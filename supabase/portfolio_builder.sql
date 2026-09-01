-- Portfolio Builder: Pro-tier only (no free version - see
-- CAREER_PLAN_TOOLS in src/lib/payments/careerTools.ts, only 'pro'
-- includes 'portfolio_builder'). Two outputs from one saved record: a
-- public shareable page (/portfolio/[slug]) and a downloadable PDF
-- (reusing the same @react-pdf/renderer pattern as CV Builder).
create table if not exists member_portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  full_name text not null default '',
  headline text not null default '',
  bio text not null default '',
  -- projects: [{ title, role, description, link, tags: string[] }][]
  projects jsonb not null default '[]'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists member_portfolios_user_idx on member_portfolios (user_id);
create index if not exists member_portfolios_slug_idx on member_portfolios (slug);

alter table member_portfolios enable row level security;

-- Owner-only read/write for the builder itself (matches member_cvs's
-- "own_rows" shape in premium_membership_and_cv_builder.sql).
drop policy if exists "own_rows" on member_portfolios;
create policy "own_rows" on member_portfolios
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Separate, additive public-read policy for the public portfolio page
-- (/portfolio/[slug], a signed-out server component) - anyone can read a
-- row that its owner has explicitly marked public. This does not weaken
-- the owner-only write policy above; Postgres RLS policies are additive,
-- so a row is writable only by its owner regardless of this select grant.
drop policy if exists "public_read_public_portfolios" on member_portfolios;
create policy "public_read_public_portfolios" on member_portfolios
  for select to anon, authenticated
  using (is_public = true);
