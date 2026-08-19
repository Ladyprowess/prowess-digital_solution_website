-- Core schema for the Prowess Digital Solutions B2C platform: a job board
-- and opportunities hub, plus the shape needed for the wider "professional
-- growth platform" vision (career paths and courses carrying free/premium
-- access + price, a generic saved-items list, and entitlement/progress
-- tracking) so the model doesn't need another rework once content beyond
-- jobs/opportunities gets built out. See supabase/resources_schema.sql for
-- the content-library side (articles/e-books/videos/etc.) and
-- supabase/accounts_schema.sql for purchases/learning-progress/interests.
--
-- Deliberately thin everywhere the *feature*, not the data shape, isn't
-- ready yet:
--   - no employer accounts (admin creates/imports jobs and companies for now)
--   - no ATS (applications is a personal tracker, not a hiring pipeline)
--   - no LMS content structure (courses has no lessons/modules -- just
--     enough to be a priceable, skill-tagged, publishable entity)
--   - no job_locations lookup table (location lives directly on jobs/
--     opportunities as country/city/location_type/remote_regions)
--   - no job_alerts table (saved-search alerts fold into
--     newsletter_subscribers.filters until someone needs multiple distinct
--     saved searches)
--   - no payment processing (purchases in accounts_schema.sql is a data
--     record of entitlement, not a payment gateway integration)
--   - no recommendation engine (user_career_interests in accounts_schema.sql
--     is raw material for a future simple query, not a scoring system)
--
-- Run this after supabase/newsletter_subscribers.sql.

-- ============================================================
-- LOOKUP / TAXONOMY TABLES
-- ============================================================

create table if not exists job_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists job_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists opportunity_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- Where a listing came from. Keep this shared between jobs and
-- opportunities rather than building separate source-tracking per entity.
create table if not exists job_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  source_type text not null default 'manual'
    check (source_type in ('manual', 'external', 'partner')),
  created_at timestamptz not null default now()
);

-- One canonical skill taxonomy shared across jobs, opportunities, career
-- paths and courses. This is what makes "Product Design" return jobs +
-- internships + fellowships + courses + a career path in one query,
-- instead of four unrelated content silos.
create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists career_paths (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,

  -- Most career paths stay free (they're the discovery/orientation layer),
  -- but a deeper premium roadmap for a given path is a real product the
  -- vision calls for, so this carries the same free/premium shape as
  -- everything else rather than being bolted on later.
  access text not null default 'free'
    check (access in ('free', 'premium')),
  price numeric,
  price_currency text,

  status text not null default 'draft'
    check (status in ('draft', 'published')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  level text
    check (level in ('beginner', 'intermediate', 'advanced')),

  access text not null default 'free'
    check (access in ('free', 'premium')),
  price numeric,
  price_currency text,

  status text not null default 'draft'
    check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Two-level course structure: modules contain lessons. Deliberately no
-- quizzes/certificates/enrollment gating yet -- position/content is enough
-- to render a real course and track lesson-level completion
-- (lesson_completions, in accounts_schema.sql).
create table if not exists course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists course_modules_course_id_idx on course_modules (course_id, position);

create table if not exists course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references course_modules(id) on delete cascade,
  title text not null,
  content_type text not null default 'text'
    check (content_type in ('video', 'text', 'youtube', 'pdf', 'external')),
  content_url text,    -- for video/youtube/pdf/external
  content_text text,   -- for text lessons hosted directly
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists course_lessons_module_id_idx on course_lessons (module_id, position);

-- ============================================================
-- COMPANIES
-- ============================================================

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text,
  website text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- JOBS
-- ============================================================

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,

  company_id uuid not null references companies(id) on delete restrict,
  category_id uuid not null references job_categories(id) on delete restrict,
  type_id uuid not null references job_types(id) on delete restrict,

  location_type text not null
    check (location_type in ('remote', 'hybrid', 'on_site')),
  country text,
  city text,
  remote_regions text[],   -- e.g. {'Africa'} or {'US','Canada'} for remote listings scoped to a region

  salary_min numeric,
  salary_max numeric,
  salary_currency text,

  experience_level text
    check (experience_level in ('entry', 'junior', 'mid', 'senior', 'executive')),

  description text,
  requirements text,
  responsibilities text,
  apply_url text not null,

  source_id uuid not null references job_sources(id) on delete restrict,
  external_id text,   -- dedupe key from the source; null for manually entered jobs

  -- For future sponsored/featured placement -- a display flag only, not a
  -- payment integration. Employers paying for this is a later feature; the
  -- column existing now means listing pages don't need a schema change to
  -- start honoring it.
  featured boolean not null default false,

  status text not null default 'draft'
    check (status in ('draft', 'published', 'closed', 'expired')),

  published_at timestamptz,
  deadline_at timestamptz,
  expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_status_published_at_idx on jobs (status, published_at desc);
create index if not exists jobs_category_id_idx on jobs (category_id);
create index if not exists jobs_type_id_idx on jobs (type_id);
create index if not exists jobs_company_id_idx on jobs (company_id);

-- Dedupe: the same source can't submit the same external listing twice.
-- Manually entered jobs (external_id is null) are exempt.
create unique index if not exists jobs_source_external_id_idx
  on jobs (source_id, external_id)
  where external_id is not null;

create table if not exists job_skill_map (
  job_id uuid not null references jobs(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  primary key (job_id, skill_id)
);

-- ============================================================
-- OPPORTUNITIES (internships, scholarships, grants, fellowships,
-- competitions, events -- different lifecycle than jobs: funding/eligibility
-- instead of salary, so kept as a separate table rather than jobs.type)
-- ============================================================

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,

  type_id uuid not null references opportunity_types(id) on delete restrict,
  organisation_name text,

  description text,
  eligibility text,
  benefits text,

  location_type text
    check (location_type in ('remote', 'hybrid', 'on_site', 'any')),
  country text,
  city text,
  remote_regions text[],

  apply_url text not null,

  source_id uuid not null references job_sources(id) on delete restrict,
  external_id text,

  featured boolean not null default false,

  status text not null default 'draft'
    check (status in ('draft', 'published', 'closed', 'expired')),

  published_at timestamptz,
  deadline_at timestamptz,
  expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists opportunities_status_published_at_idx on opportunities (status, published_at desc);
create index if not exists opportunities_type_id_idx on opportunities (type_id);

create unique index if not exists opportunities_source_external_id_idx
  on opportunities (source_id, external_id)
  where external_id is not null;

create table if not exists opportunity_skill_map (
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  primary key (opportunity_id, skill_id)
);

-- ============================================================
-- CAREER PATH / COURSE RELATIONSHIPS
-- ============================================================

create table if not exists career_path_skill_map (
  career_path_id uuid not null references career_paths(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  level text check (level in ('beginner', 'intermediate', 'advanced')),
  primary key (career_path_id, skill_id)
);

create table if not exists course_skill_map (
  course_id uuid not null references courses(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  primary key (course_id, skill_id)
);

-- resource_skill_map intentionally not created yet -- there is no
-- `resources` table to reference. Add it (and a real resources table) when
-- resources moves off the static array in src/content/site.ts.

-- ============================================================
-- USER-FACING STATE (keyed off Supabase auth.users, not public.profiles --
-- profiles is the internal staff/payroll table and has nothing to do with
-- job-seeker accounts)
-- ============================================================

-- One generic bookmark table across every content type ("My Dashboard" ->
-- saved jobs, saved opportunities, saved resources, saved courses, saved
-- career paths) instead of a near-duplicate saved_<type> table per type --
-- a bookmark has no type-specific fields, so there's nothing a dedicated
-- table would add. item_id is intentionally not a foreign key: it can point
-- at jobs, opportunities, resources, courses or career_paths depending on
-- item_type, and Postgres can't express a conditional FK across tables --
-- integrity here is enforced by the application, not the database.
create table if not exists saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null
    check (item_type in ('job', 'opportunity', 'resource', 'course', 'career_path')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

create index if not exists saved_items_user_id_idx on saved_items (user_id);

-- A personal application tracker, not an ATS: Prowess Digital Solutions has
-- no way to verify whether someone actually applied on the employer's site,
-- so this just reflects what the user tells us.
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  status text not null default 'saved'
    check (status in ('saved', 'applied', 'interviewing', 'rejected', 'offer', 'withdrawn')),
  applied_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Public taxonomy/content tables: readable by anyone (anon included). No
-- write policy is granted here for anon/authenticated -- curator writes are
-- granted separately in supabase/admin_content_policies.sql, restricted to
-- signed-in users with profiles.role = 'admin'.

alter table job_categories enable row level security;
create policy "public_read" on job_categories for select to anon, authenticated using (true);

alter table job_types enable row level security;
create policy "public_read" on job_types for select to anon, authenticated using (true);

alter table opportunity_types enable row level security;
create policy "public_read" on opportunity_types for select to anon, authenticated using (true);

alter table skills enable row level security;
create policy "public_read" on skills for select to anon, authenticated using (true);

alter table career_paths enable row level security;
create policy "public_read" on career_paths for select to anon, authenticated using (true);

alter table courses enable row level security;
create policy "public_read_published" on courses
  for select to anon, authenticated using (status = 'published');

alter table course_modules enable row level security;
create policy "public_read_of_published_course" on course_modules
  for select to anon, authenticated
  using (exists (select 1 from courses c where c.id = course_modules.course_id and c.status = 'published'));

alter table course_lessons enable row level security;
create policy "public_read_of_published_course" on course_lessons
  for select to anon, authenticated
  using (exists (
    select 1 from course_modules m
    join courses c on c.id = m.course_id
    where m.id = course_lessons.module_id and c.status = 'published'
  ));

alter table companies enable row level security;
create policy "public_read" on companies for select to anon, authenticated using (true);

alter table job_skill_map enable row level security;
create policy "public_read" on job_skill_map for select to anon, authenticated using (true);

alter table opportunity_skill_map enable row level security;
create policy "public_read" on opportunity_skill_map for select to anon, authenticated using (true);

alter table career_path_skill_map enable row level security;
create policy "public_read" on career_path_skill_map for select to anon, authenticated using (true);

alter table course_skill_map enable row level security;
create policy "public_read" on course_skill_map for select to anon, authenticated using (true);

-- job_sources is internal (which feed a listing came from) -- not exposed
-- publicly at all. No policies added, so only the service role can read it.
alter table job_sources enable row level security;

-- Jobs/opportunities: only published listings are publicly readable.
-- Drafts, closed and expired listings are admin-only (service role).

alter table jobs enable row level security;
create policy "public_read_published" on jobs
  for select to anon, authenticated using (status = 'published');

alter table opportunities enable row level security;
create policy "public_read_published" on opportunities
  for select to anon, authenticated using (status = 'published');

-- User-owned tables: strictly self-service. A user can see, create, update
-- and delete only their own rows -- never another user's.

alter table saved_items enable row level security;
create policy "own_rows" on saved_items
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table applications enable row level security;
create policy "own_rows" on applications
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
