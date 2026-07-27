-- Migrate payment processing from Paystack to Flutterwave.
--
-- Existing paystack_* columns are left untouched as a historical record of
-- pre-migration payments - never backfilled, never written to again. New
-- payments populate the new flutterwave_* columns instead.

alter table membership_subscriptions
  add column if not exists flutterwave_reference text,
  add column if not exists flutterwave_plan_id text,
  add column if not exists subscription_status text not null default 'active', -- 'active' | 'lapsed' | 'cancelled'
  add column if not exists lapsed_at timestamptz;

alter table consultation_bookings
  add column if not exists flutterwave_reference text;

alter table event_registrations
  add column if not exists flutterwave_reference text;

-- Generic payment-plan cache, replacing the Paystack-specific paystack_plans
-- table for anything created going forward. paystack_plans is left in place,
-- untouched, as a historical record.
create table if not exists payment_plans (
  provider text not null default 'flutterwave',
  slug text not null,
  interval text not null,   -- 'monthly' | 'annually'
  plan_id text not null,
  created_at timestamptz not null default now(),
  primary key (provider, slug, interval)
);
