-- Backs the /tools listing page (career + business tool/resource cards) with
-- a real table so /admin/tools can add, edit, reorder, and publish/unpublish
-- cards without a code change. Does NOT touch the tools themselves (the
-- calculator, tracker, invoice, inventory, reach, business-health-check,
-- business-helper, business-structure, customer-support pages, and their
-- access-code gating in src/lib/tools/tierAccess.ts) - those stay real code.
-- This table only owns the marketing copy and card metadata shown on the
-- listing page.
--
-- Run after supabase/jobs_opportunities_schema.sql, then add 'tools' to the
-- admin_full_access loop in supabase/admin_content_policies.sql and re-run
-- that file (it is deliberately re-runnable).

create table if not exists tools (
  id uuid primary key default gen_random_uuid(),

  -- Stable identifier for known business tools (matches src/lib/tools/tierAccess.ts
  -- PREMIUM_TOOL_KEYS where applicable) and for icon lookup. Free-form for
  -- new career tools since those have no tier system to line up with.
  key text not null unique,

  category text not null check (category in ('career', 'business')),

  title text not null,
  description text not null,
  detail text,

  icon_key text not null default 'business-helper',
  badge text not null default 'Free',
  gated boolean not null default false,

  -- Null href = "coming soon" card, not clickable.
  href text,

  position integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tools_category_status_position_idx on tools (category, status, position);

alter table tools enable row level security;
drop policy if exists "public_read_published" on tools;
create policy "public_read_published" on tools
  for select to anon, authenticated using (status = 'published');

-- Seed: the exact cards already live on /tools today, including the fix for
-- three "free" tool cards that were pointing at routes that never existed
-- (/tools/business-helper, /tools/business-structure, /tools/customer-support
-- all 404'd - the tool content itself was already built, just never wired to
-- a route). This seed wires them to their now-real hrefs.
insert into tools (key, category, title, description, detail, icon_key, badge, gated, href, position, status)
values
  ('calculator', 'business', 'Startup Cost & Break-Even Calculator', 'Know exactly how much it costs to launch. Set the right price. Find your break-even point before you spend a single dollar.', 'Startup costs · Pricing · Break-even · Funding tracker', 'calculator', 'From Diagnostic', true, '/tools/calculator', 0, 'published'),
  ('tracker', 'business', 'Profit & Cashflow Tracker', 'Track every dollar in and out. Monthly summaries, annual overview, and cashflow forecasting so you always know where your business stands.', 'Monthly tracking · Annual view · Cashflow forecast', 'tracker', 'From Diagnostic', true, '/tools/tracker', 1, 'published'),
  ('invoice', 'business', 'Invoice Manager', 'Create professional invoices, track who has paid and who has not, and send payment reminders directly to clients via WhatsApp or email.', 'Invoice creation · Payment tracking · WhatsApp reminders', 'invoice', 'From Foundation', true, '/tools/invoice', 2, 'published'),
  ('inventory', 'business', 'Inventory Manager', 'Track your stock levels in real time. Get low stock alerts before you run out. Works for both product and service businesses.', 'Stock tracking · Low stock alerts · Service availability', 'inventory', 'From Growth', true, '/tools/inventory', 3, 'published'),
  ('reach', 'business', 'Reach & Growth Planner', 'A full growth toolkit; content ideas for every platform, an ad campaign tracker, a social media calendar, and a practical marketing guide.', 'Content ideas · Ad planner · Social calendar · Growth guide', 'reach', 'From Growth', true, '/tools/reach', 4, 'published'),
  ('business-helper', 'business', 'Business Helper', 'Tell us what is happening in your business. Get a structured diagnostic report with a Business Health Score and clear next steps powered by AI.', 'AI diagnostic · Health score · Action plan', 'business-helper', 'Free', false, '/tools/business-helper', 5, 'published'),
  ('business-health-check', 'business', 'Operational Health Self-Audit', 'Work through the foundational things every business must have before chasing growth. Check off what you have. See where the gaps are.', '36 checkpoints · 6 categories · Progress tracking', 'business-health-check', 'Free', false, '/tools/business-health-check', 6, 'published'),
  ('business-structure', 'business', 'Business Structure Template', 'Map out your business structure step by step. Define roles, responsibilities, decision making, and communication flow.', 'Role mapping · Decision flow · Downloadable output', 'business-structure', 'Free', false, '/tools/business-structure', 7, 'published'),
  ('customer-support', 'business', 'Customer Service Guide', 'A practical guide to handling client communication, complaints, and retention.', 'Response scripts · Complaint handling · Retention', 'customer-support', 'Free', false, '/tools/customer-support', 8, 'published'),

  ('cv-builder', 'career', 'CV Builder', 'Build a clean, professional CV in minutes.', null, 'career-generic', 'Coming Soon', false, null, 0, 'published'),
  ('cv-checker', 'career', 'CV Checker', 'Get feedback on an existing CV before you send it out.', null, 'career-generic', 'Coming Soon', false, null, 1, 'published'),
  ('interview-prep', 'career', 'Interview Prep', 'Practice answers to common interview questions.', null, 'career-generic', 'Coming Soon', false, null, 2, 'published'),
  ('portfolio-builder', 'career', 'Portfolio Builder', 'Put your work together into a shareable portfolio.', null, 'career-generic', 'Coming Soon', false, null, 3, 'published')
on conflict (key) do nothing;
