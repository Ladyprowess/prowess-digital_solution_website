-- B2C recurring subscription ("Premium Membership") + CV Builder.
--
-- premium_membership_subscriptions is deliberately a new table, not a reuse
-- of membership_subscriptions (the existing B2B business-consulting
-- membership at /pricing, shaped around business_name/service_focus/website
-- fields that don't apply here). It is the billing/subscription record
-- only - nothing outside src/lib/payments/premiumMembership.ts should ever
-- query this table directly. Every feature that needs to know "is this
-- member premium right now" calls hasPremiumAccess() from that file
-- instead, so future entitlement sources (trials, grandfathered access,
-- promo codes) only ever change in one place.
create table if not exists premium_membership_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  plan_slug text not null default 'premium',
  billing_interval text not null check (billing_interval in ('monthly','annually')),
  amount_usd numeric,
  amount_ngn numeric,
  currency text not null default 'USD',
  payment_status text not null default 'pending' check (payment_status in ('pending','paid')),
  subscription_status text not null default 'pending' check (subscription_status in ('pending','active','lapsed','cancelled')),
  lapsed_at timestamptz,
  flutterwave_plan_id text,
  -- Flutterwave's actual recurring-subscription id (distinct from the plan
  -- id) - captured as soon as it's known. Confirm the exact field name
  -- against a real test-mode webhook payload before relying on it; it's
  -- not pinned down elsewhere in this codebase yet, only inferred.
  flutterwave_subscription_id text,
  flutterwave_reference text,
  created_at timestamptz not null default now()
);

create index if not exists premium_membership_subscriptions_user_idx on premium_membership_subscriptions (user_id);
create index if not exists premium_membership_subscriptions_email_idx on premium_membership_subscriptions (email);
create index if not exists premium_membership_subscriptions_reference_idx on premium_membership_subscriptions (flutterwave_reference);
create index if not exists premium_membership_subscriptions_flw_sub_idx on premium_membership_subscriptions (flutterwave_subscription_id);

-- Database-enforced duplicate protection, not just an application check: a
-- partial unique index means two concurrent checkout requests can't both
-- succeed in creating a second open (pending/active) row for the same
-- member, even under a race. The application-level check in the checkout
-- route is the user-friendly early-exit; this index is what actually
-- guarantees the invariant.
create unique index if not exists premium_membership_subscriptions_one_open_per_user
  on premium_membership_subscriptions (user_id)
  where subscription_status in ('pending', 'active');

alter table premium_membership_subscriptions enable row level security;
-- No policy - service-role only, same as `purchases` in accounts_schema.sql.
-- A client-readable policy here would expose payment amounts/references to
-- probing; every read/write goes through a server route that calls
-- verifyMember() first.

-- A member's saved CV drafts. Owner-only read/write.
create table if not exists member_cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'My CV',
  template text not null default 'plain',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists member_cvs_user_idx on member_cvs (user_id);

alter table member_cvs enable row level security;
drop policy if exists "own_rows" on member_cvs;
create policy "own_rows" on member_cvs
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Premium Membership price, admin-editable from /admin/settings (same
-- table/page already used for contact info, social links, and SEO
-- defaults) rather than hardcoded in src/content/site.ts - one flat price
-- that unlocks everything Premium gates, not a per-template price. Added
-- here (not a separate migration file) since site_settings already exists
-- and this is purely additive columns on it.
alter table site_settings add column if not exists premium_membership_monthly_usd numeric;
alter table site_settings add column if not exists premium_membership_monthly_ngn numeric;
alter table site_settings add column if not exists premium_membership_annual_usd numeric;
alter table site_settings add column if not exists premium_membership_annual_ngn numeric;
