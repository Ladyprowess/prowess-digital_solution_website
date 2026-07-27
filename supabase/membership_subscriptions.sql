-- Membership tier subscriptions (Diagnostic / Foundation / Growth / Full Support),
-- billed monthly or annually via Paystack. Intake details are collected in a
-- modal BEFORE payment so the admin has everything needed to follow up within
-- 24 hours of a successful payment.

create table if not exists membership_subscriptions (
  id uuid primary key default gen_random_uuid(),
  plan_slug text not null,               -- 'diagnostic' | 'foundation' | 'growth' | 'full-support'
  billing_interval text not null,        -- 'monthly' | 'annually'
  amount_usd numeric not null,

  full_name text not null,
  email text not null,
  phone text,
  business_name text not null,
  website text,
  business_description text not null,
  service_focus text not null,           -- what specifically they want looked at/delivered

  payment_status text not null default 'pending', -- 'pending' | 'paid' | 'failed'
  paystack_reference text,
  paystack_plan_code text,

  contacted_at timestamptz,              -- set by admin once the 24hr follow-up happens
  created_at timestamptz not null default now()
);

create index if not exists membership_subscriptions_reference_idx
  on membership_subscriptions (paystack_reference);

-- Cache of Paystack plan codes so we don't recreate a plan on every checkout.
-- One row per (tier, billing interval) pair, created lazily on first use.
create table if not exists paystack_plans (
  slug text not null,
  interval text not null,                -- 'monthly' | 'annually'
  plan_code text not null,
  created_at timestamptz not null default now(),
  primary key (slug, interval)
);
