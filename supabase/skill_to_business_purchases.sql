-- One-time Skill to Business program purchase (applicant pays directly, no
-- school revenue-share involved). Fixed price, not a subscription - the same
-- person can purchase again in a future year, so there is no uniqueness
-- constraint on email; each row is an independent enrollment.

create table if not exists skill_to_business_purchases (
  id uuid primary key default gen_random_uuid(),

  full_name text not null,
  email text not null,
  phone text,
  skill_or_business text not null, -- what they do / their skill or trade

  amount_usd numeric not null default 100,
  payment_status text not null default 'pending', -- 'pending' | 'paid' | 'failed'
  flutterwave_reference text,

  created_at timestamptz not null default now()
);

create index if not exists skill_to_business_purchases_reference_idx
  on skill_to_business_purchases (flutterwave_reference);
