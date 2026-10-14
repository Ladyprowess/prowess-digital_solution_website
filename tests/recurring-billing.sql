-- Run against an isolated database with the schema and migration installed.
-- Every fixture rolls back.
begin;
do $$
declare k text; ident uuid; r jsonb; expiry timestamptz; status_value text; code_expiry bigint;
begin
 foreach k in array array['membership','premium_membership'] loop
  ident:=gen_random_uuid();
  execute format('insert into %I(id,billing_interval,full_name,email,business_name,plan_slug) values($1,''monthly'',''Test'',''test@example.com'',''Test'',''diagnostic'')',case when k='membership' then 'membership_subscriptions' else 'premium_membership_subscriptions' end) using ident;
  r:=reconcile_subscription_event(k,ident,'paid','initial-'||k,'2026-01-31T12:00:00Z',array['calculator']);
  if not (r->>'initial')::boolean then raise exception 'Initial grant missing'; end if;
  r:=reconcile_subscription_event(k,ident,'paid','initial-'||k,'2026-01-31T12:00:00Z');
  if (r->>'changed')::boolean then raise exception 'Duplicate changed record'; end if;
  execute format('select paid_through from %I where id=$1',case when k='membership' then 'membership_subscriptions' else 'premium_membership_subscriptions' end) into expiry using ident;
  if expiry<>'2026-02-28T12:00:00Z'::timestamptz then raise exception 'Month-end calculation wrong: %',expiry; end if;
  perform reconcile_subscription_event(k,ident,'failed','failed-'||k,'2026-02-28T12:00:00Z');
  perform reconcile_subscription_event(k,ident,'paid','renewal-'||k,'2026-03-01T12:00:00Z',array['calculator']);
  perform reconcile_subscription_event(k,ident,'failed','delayed-'||k,'2026-02-28T13:00:00Z');
  execute format('select subscription_status,paid_through from %I where id=$1',case when k='membership' then 'membership_subscriptions' else 'premium_membership_subscriptions' end) into status_value,expiry using ident;
  if status_value<>'active' or expiry<>'2026-04-01T12:00:00Z'::timestamptz then raise exception 'Recovery/order handling failed'; end if;
  perform reconcile_subscription_event(k,ident,'cancelled');
  perform reconcile_subscription_event(k,ident,'paid','late-'||k,'2026-03-02T12:00:00Z');
  execute format('select subscription_status,paid_through from %I where id=$1',case when k='membership' then 'membership_subscriptions' else 'premium_membership_subscriptions' end) into status_value,expiry using ident;
  if status_value<>'cancelled' or expiry<>'2026-04-02T12:00:00Z'::timestamptz then raise exception 'Cancellation lost paid period or reactivated'; end if;
  if k='membership' then
   select expires_at into code_expiry from client_codes where payment_key='membership:'||ident::text and status='active';
   if code_expiry is distinct from (extract(epoch from expiry)*1000)::bigint then raise exception 'Tool expiry mismatch'; end if;
  end if;
  -- Annual leap-day and legacy recovery after a newer failure.
  ident:=gen_random_uuid();
  execute format('insert into %I(id,billing_interval,full_name,email,business_name,plan_slug,payment_status,subscription_status,last_charge_at) values($1,''annually'',''Test'',''test@example.com'',''Test'',''diagnostic'',''paid'',''lapsed'',''2025-03-01T12:00:00Z'')',case when k='membership' then 'membership_subscriptions' else 'premium_membership_subscriptions' end) using ident;
  perform reconcile_subscription_event(k,ident,'paid','legacy-'||k,'2024-02-29T12:00:00Z',array['calculator']);
  execute format('select subscription_status,paid_through from %I where id=$1',case when k='membership' then 'membership_subscriptions' else 'premium_membership_subscriptions' end) into status_value,expiry using ident;
  if status_value<>'lapsed' or expiry<>'2025-02-28T12:00:00Z'::timestamptz then raise exception 'Legacy recovery or annual calculation failed'; end if;
 end loop;
 if has_function_privilege('anon','public.reconcile_subscription_event(text,uuid,text,text,timestamptz,text[])','execute') then raise exception 'Anonymous reconciliation permitted'; end if;
 if has_function_privilege('authenticated','public.reconcile_subscription_event(text,uuid,text,text,timestamptz,text[])','execute') then raise exception 'Client reconciliation permitted'; end if;
end $$;
rollback;
