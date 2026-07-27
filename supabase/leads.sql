-- Leads captured from free lead magnets (starting with the Operational
-- Health Self-Audit). Kept separate from membership_subscriptions since
-- these are unpaid leads, not paying customers.

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  source text not null,          -- e.g. 'operational-health-self-audit'
  email text not null,
  score_percent int,
  checked_count int,
  total_items int,
  created_at timestamptz not null default now()
);

create index if not exists leads_email_idx on leads (email);
