-- Apply before deploying the payment-audit code. No customer records are deleted.
-- Duplicate references must be investigated before this migration can commit.
begin;
alter table public.premium_membership_subscriptions add column if not exists checkout_url text;
alter table public.client_codes add column if not exists payment_key text;
create unique index if not exists client_codes_payment_key_unique on public.client_codes(payment_key);
create unique index if not exists event_registration_payment_reference_unique
  on public.event_registrations(flutterwave_reference) where flutterwave_reference is not null;
create unique index if not exists purchases_payment_reference_unique
  on public.purchases(flutterwave_reference) where flutterwave_reference is not null;
create unique index if not exists skill_to_business_payment_reference_unique
  on public.skill_to_business_purchases(flutterwave_reference) where flutterwave_reference is not null;
create unique index if not exists consultation_payment_reference_unique
  on public.consultation_bookings(flutterwave_reference) where flutterwave_reference is not null;
-- A lapsed subscription can still be billed again by the provider. Do not allow a second one.
drop index if exists public.premium_membership_subscriptions_one_open_per_user;
create unique index premium_membership_subscriptions_one_open_per_user
  on public.premium_membership_subscriptions(user_id) where subscription_status in ('pending','active','lapsed');
commit;
