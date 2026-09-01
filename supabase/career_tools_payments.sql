create table if not exists career_tool_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  plan_slug text not null check (plan_slug in ('basic', 'premium', 'pro')),
  amount numeric not null,
  currency text not null check (currency in ('USD', 'NGN')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  flutterwave_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists career_tool_purchases_user_idx on career_tool_purchases (user_id);
create index if not exists career_tool_purchases_email_idx on career_tool_purchases (email);
create index if not exists career_tool_purchases_reference_idx on career_tool_purchases (flutterwave_reference);
create index if not exists career_tool_purchases_paid_user_idx on career_tool_purchases (user_id, created_at desc)
  where payment_status = 'paid';

alter table career_tool_purchases enable row level security;
-- Service-role only. Checkout, verification and entitlement checks are routed
-- through server endpoints because amounts and payment references are sensitive.

alter table site_settings add column if not exists career_basic_usd numeric;
alter table site_settings add column if not exists career_basic_ngn numeric;
alter table site_settings add column if not exists career_premium_usd numeric;
alter table site_settings add column if not exists career_premium_ngn numeric;
alter table site_settings add column if not exists career_pro_usd numeric;
alter table site_settings add column if not exists career_pro_ngn numeric;
