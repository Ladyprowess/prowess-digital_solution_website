-- B2C account primitives: a Prowess Digital Solutions member profile,
-- real premium-content purchases (Flutterwave, same pattern as the existing
-- skill_to_business_purchases flow), course progress, and career interests.
--
-- Deliberately NOT public.profiles: that table is Prowess Digital
-- Solutions' internal staff/payroll table (role, pay_type, monthly_rate,
-- managed_by) reached via /login -> /dashboard. Members of the public
-- platform are a different population and must never be mixed into it --
-- everything here keys off Supabase auth.users(id) directly instead.
--
-- Run after supabase/jobs_opportunities_schema.sql and
-- supabase/resources_schema.sql.

create table if not exists member_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  headline text,           -- e.g. "Aspiring Product Designer"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Real Flutterwave one-time purchases of premium content, following the
-- exact pattern already proven by skill_to_business_purchases: a pending
-- row is created before redirecting to Flutterwave, then flipped to 'paid'
-- by whichever of the webhook / client-verify route fires first (see
-- src/lib/payments/content.ts). The amount/currency charged is always read
-- server-side from the item's own price at checkout time -- the client
-- never gets to say what something costs.
--
-- user_id is nullable and there's a plain email column: there is no B2C
-- sign-in flow yet, so purchases are guest-checkout by email (exactly like
-- skill_to_business_purchases), with user_id ready to be filled in once
-- accounts exist, instead of blocking payments on building a login system
-- first.
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  item_type text not null
    check (item_type in ('resource', 'course', 'career_path')),
  item_id uuid not null,   -- not a foreign key: can point at resources, courses or career_paths depending on item_type
  amount numeric not null,
  currency text not null default 'NGN',
  flutterwave_reference text,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now()
);

create index if not exists purchases_email_idx on purchases (email);
create index if not exists purchases_reference_idx on purchases (flutterwave_reference);

-- Course-level progress. Lesson-level completion is tracked separately in
-- lesson_completions below, once course_modules/course_lessons exist.
create table if not exists learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  progress_percent int not null default 0
    check (progress_percent >= 0 and progress_percent <= 100),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- Granular lesson-level completion, referencing course_lessons defined in
-- jobs_opportunities_schema.sql.
create table if not exists lesson_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references course_lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- Raw material for a future "recommended for you" query (resources/courses/
-- jobs tagged with skills from career paths a member is interested in) --
-- not a scoring system, just what someone told us they're interested in.
create table if not exists user_career_interests (
  user_id uuid not null references auth.users(id) on delete cascade,
  career_path_id uuid not null references career_paths(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, career_path_id)
);

-- ============================================================
-- ROW LEVEL SECURITY -- strictly self-service, same pattern as
-- saved_items/applications in jobs_opportunities_schema.sql.
-- ============================================================

alter table member_profiles enable row level security;
create policy "own_row" on member_profiles
  for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No anon/authenticated policy at all: purchases has no signed-in owner to
-- check (guest checkout by email, not auth.uid()), and a policy readable by
-- email would let anyone look up anyone else's purchase history just by
-- guessing an address. All reads/writes go through server-side API routes
-- (service role) or an admin (admin_full_access in
-- admin_content_policies.sql, for manually granting access as a support
-- gesture) -- entitlement checks for premium content must happen server-side
-- for the same reason, never a direct client query against this table.
alter table purchases enable row level security;

alter table learning_progress enable row level security;
create policy "own_rows" on learning_progress
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table lesson_completions enable row level security;
create policy "own_rows" on lesson_completions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table user_career_interests enable row level security;
create policy "own_rows" on user_career_interests
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
