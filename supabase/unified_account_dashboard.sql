-- Connect every customer-owned payment and application record to the one
-- public My Account dashboard. Safe to run more than once.
begin;

alter table public.business_service_orders add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.membership_subscriptions add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.skill_to_business_purchases add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.consultation_bookings add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.event_registrations add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.event_registrations add column if not exists amount_paid numeric;
alter table public.event_registrations add column if not exists currency text;

create index if not exists business_service_orders_user_idx on public.business_service_orders(user_id, created_at desc);
create index if not exists membership_subscriptions_user_idx on public.membership_subscriptions(user_id, created_at desc);
create index if not exists skill_to_business_purchases_user_idx on public.skill_to_business_purchases(user_id, created_at desc);
create index if not exists consultation_bookings_user_idx on public.consultation_bookings(user_id, created_at desc);
create index if not exists event_registrations_user_idx on public.event_registrations(user_id, created_at desc);

-- Existing applications only supported jobs. Keep the original job_id for
-- compatibility and add opportunity support plus a snapshot, so an account
-- retains its history after a listing closes or is removed.
alter table public.applications alter column job_id drop not null;
alter table public.applications add column if not exists opportunity_id uuid references public.opportunities(id) on delete set null;
alter table public.applications add column if not exists item_type text not null default 'job' check (item_type in ('job','opportunity'));
alter table public.applications add column if not exists title text;
alter table public.applications add column if not exists organisation_name text;
alter table public.applications add column if not exists apply_url text;

create unique index if not exists applications_user_job_unique
  on public.applications(user_id, job_id) where job_id is not null;
create unique index if not exists applications_user_opportunity_unique
  on public.applications(user_id, opportunity_id) where opportunity_id is not null;

commit;
