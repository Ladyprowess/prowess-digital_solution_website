-- Apply after payment_integrity.sql, before deploying the matching application code.
begin;
alter table public.membership_subscriptions add column if not exists paid_through timestamptz;
alter table public.membership_subscriptions add column if not exists last_charge_at timestamptz;
alter table public.premium_membership_subscriptions add column if not exists paid_through timestamptz;
alter table public.premium_membership_subscriptions add column if not exists last_charge_at timestamptz;
create table if not exists public.subscription_charge_events (
  kind text not null check (kind in ('membership','premium_membership')),
  subscription_id uuid not null,
  reference text not null,
  outcome text not null check (outcome in ('paid','failed')),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  primary key(kind, reference, outcome)
);
alter table public.subscription_charge_events enable row level security;

-- Serialize all state changes for a subscription, including code expiry changes.
create or replace function public.reconcile_subscription_event(
 p_kind text, p_id uuid, p_outcome text, p_reference text default null,
 p_occurred_at timestamptz default null, p_tools text[] default '{}'
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
 t text; s record; until_at timestamptz; initial boolean; code_value text; historical boolean := false;
begin
 if p_kind not in ('membership','premium_membership') or p_outcome not in ('paid','failed','cancelled') then raise exception 'Invalid event'; end if;
 t := case when p_kind='membership' then 'membership_subscriptions' else 'premium_membership_subscriptions' end;
 execute format('select * from %I where id=$1 for update',t) into s using p_id;
 if s.id is null then raise exception 'Subscription not found'; end if;
 if p_outcome <> 'cancelled' then
  if p_reference is null or length(p_reference)=0 or p_occurred_at is null or p_occurred_at > now()+interval '5 minutes' then raise exception 'Missing or invalid charge identity'; end if;
  insert into subscription_charge_events(kind,subscription_id,reference,outcome,occurred_at)
    values(p_kind,p_id,p_reference,p_outcome,p_occurred_at) on conflict do nothing;
  if not found then return jsonb_build_object('changed',false); end if;
  if s.last_charge_at is not null and (p_occurred_at < s.last_charge_at or (p_occurred_at = s.last_charge_at and p_outcome='failed')) then
   if p_outcome='paid' and s.paid_through is null then
    historical := true; -- Recover a legacy paid period without undoing a newer failure.
   else
    return jsonb_build_object('changed',false);
   end if;
  end if;
 end if;
 if p_outcome='cancelled' then
  if s.subscription_status='cancelled' then return jsonb_build_object('changed',false); end if;
  execute format('update %I set subscription_status=''cancelled'', lapsed_at=coalesce(lapsed_at,now()) where id=$1',t) using p_id;
  -- Paid access remains until its existing expiry. Cancellation stops renewal, not work already purchased.
  if p_kind='membership' then
   update client_codes set expires_at=case when s.paid_through is not null then greatest(expires_at,(extract(epoch from s.paid_through)*1000)::bigint) else expires_at end
    where payment_key='membership:'||p_id::text;
  end if;
  return jsonb_build_object('changed',true);
 end if;
 if s.subscription_status='cancelled' and p_outcome='failed' then return jsonb_build_object('changed',false); end if;
 if p_outcome='failed' then
  if s.payment_status<>'paid' then return jsonb_build_object('changed',false); end if;
  execute format('update %I set subscription_status=''lapsed'', lapsed_at=$2,last_charge_at=$2 where id=$1',t) using p_id,p_occurred_at;
  return jsonb_build_object('changed',s.subscription_status<>'lapsed');
 end if;
 if s.billing_interval not in ('monthly','annually') then raise exception 'Invalid interval'; end if;
 until_at := p_occurred_at + case when s.billing_interval='annually' then interval '1 year' else interval '1 month' end;
 until_at := greatest(until_at,s.paid_through);
 initial := s.payment_status<>'paid';
 if p_kind='membership' then
  insert into client_codes(code,payment_key,name,email,business,type,status,created_at,expires_at,allowed_tools,plan_slug)
   values('PDS-'||upper(replace(gen_random_uuid()::text,'-','')),'membership:'||p_id::text,s.full_name,s.email,s.business_name,'1year','active',
    (extract(epoch from now())*1000)::bigint,(extract(epoch from until_at)*1000)::bigint,p_tools,s.plan_slug)
   on conflict(payment_key) do update set expires_at=greatest(client_codes.expires_at,excluded.expires_at),status='active'
   returning code into code_value;
 end if;
 execute format('update %I set payment_status=''paid'',subscription_status=case when subscription_status=''cancelled'' then ''cancelled'' when $5 then subscription_status else ''active'' end,lapsed_at=case when subscription_status=''cancelled'' or $5 then lapsed_at else null end,paid_through=$2,last_charge_at=greatest(last_charge_at,$3),flutterwave_reference=$4 where id=$1',t)
  using p_id,until_at,p_occurred_at,p_reference,historical;
 return jsonb_build_object('changed',true,'initial',initial,'code',code_value);
end $$;
revoke all on function public.reconcile_subscription_event(text,uuid,text,text,timestamptz,text[]) from public,anon,authenticated;
grant execute on function public.reconcile_subscription_event(text,uuid,text,text,timestamptz,text[]) to service_role;
commit;
