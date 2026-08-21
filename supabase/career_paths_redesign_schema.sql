-- Schema for the Career Paths redesign: a "career command center" detail
-- page (roadmap, branching career roles, projects, tools) plus a real
-- discovery listing (featured/level/category/icon). Every new table follows
-- an existing convention in this schema:
--   - ordered child content (no own status column) -> public_read_published
--     policy that joins through to the parent career_paths.status, exactly
--     like course_modules/course_lessons join through to courses.status.
--   - skill-map / tool-map join tables -> same join-through-to-parent
--     pattern (a stricter, more defensive version of the plain `using
--     (true)` used by the older job_skill_map/career_path_skill_map maps).
--   - career_path_projects has its own status column, so it (and its skill
--     map) is gated on BOTH its own status and the parent path's.
--
-- Also fixes a real, pre-existing gap: career_paths' original "public_read"
-- policy has no status filter (every sibling content table does). Not
-- currently exploitable since app queries already add .eq("status",
-- "published"), but RLS should enforce it independently.
--
-- Run after supabase/jobs_opportunities_schema.sql and
-- supabase/tools_schema.sql, then add the 8 new table names below to the
-- admin_full_access loop in supabase/admin_content_policies.sql and re-run
-- that file (it is deliberately re-runnable).

-- ============================================================
-- CAREER_PATHS: new columns
-- ============================================================

alter table career_paths add column if not exists featured boolean not null default false;

alter table career_paths add column if not exists level text
  check (level in ('beginner', 'intermediate', 'advanced'));

alter table career_paths add column if not exists category text
  check (category in ('technology', 'business', 'marketing', 'creative', 'data'));

-- Defaults to 'path', matching the icon already hardcoded on today's
-- listing page, so existing rows render sensibly with zero backfill.
alter table career_paths add column if not exists icon_key text not null default 'path';

-- Optional hero illustration. Null falls back to a generated visual, same
-- "omit rather than fabricate" convention as courses.thumbnail_url etc.
alter table career_paths add column if not exists image_url text;

-- Short bullet strings for the "Is this career for you?" section.
alter table career_paths add column if not exists who_its_for text[];

-- ============================================================
-- RESPONSIBILITIES ("What you'll do" accordion)
-- ============================================================

create table if not exists career_path_responsibilities (
  id uuid primary key default gen_random_uuid(),
  career_path_id uuid not null references career_paths(id) on delete cascade,
  position integer not null default 0,
  title text not null,
  body text,
  created_at timestamptz not null default now()
);

create index if not exists career_path_responsibilities_path_idx
  on career_path_responsibilities (career_path_id, position);

-- ============================================================
-- ROADMAP (admin-authored stages, e.g. Foundations -> Core Skills ->
-- Practice -> Portfolio -> Job Ready -> Advancement)
-- ============================================================

create table if not exists career_path_roadmap_stages (
  id uuid primary key default gen_random_uuid(),
  career_path_id uuid not null references career_paths(id) on delete cascade,
  position integer not null default 0,
  title text not null,
  description text,
  -- Free-text bullet items for activity-style stages (e.g. "Practice")
  -- where entries aren't real taxonomy skills. Real skill entries use the
  -- map table below instead.
  items text[],
  created_at timestamptz not null default now()
);

create index if not exists career_path_roadmap_stages_path_idx
  on career_path_roadmap_stages (career_path_id, position);

-- No position column here (no other skill-map table in this schema has
-- one -- skills always render as an unordered pill set). The admin UI
-- restricts this picker to skills already on the parent path; that's a
-- UI-level constraint, not a DB one -- see the file header comment.
create table if not exists career_path_roadmap_stage_skill_map (
  stage_id uuid not null references career_path_roadmap_stages(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  primary key (stage_id, skill_id)
);

-- ============================================================
-- ROLES (the "What can you become?" branching diagram)
-- ============================================================

-- Self-referential: null parent_role_id = a tier-1 branch off the career
-- path itself; a non-null parent_role_id = a tier-2 branch off that role.
-- This is the minimum structure that can actually render a branching
-- diagram -- a flat tier number can't say *which* tier-1 role a tier-2 role
-- branches from. "Only 2 levels deep" is enforced in the admin UI (the
-- "add sub-role" action only appears on tier-1 rows), not here.
create table if not exists career_path_roles (
  id uuid primary key default gen_random_uuid(),
  career_path_id uuid not null references career_paths(id) on delete cascade,
  parent_role_id uuid references career_path_roles(id) on delete cascade,
  position integer not null default 0,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists career_path_roles_path_idx
  on career_path_roles (career_path_id, position);
create index if not exists career_path_roles_parent_idx
  on career_path_roles (parent_role_id);

-- Global skill picker (not restricted to the parent path's skills -- a role
-- can reasonably need a skill the path itself doesn't list as core).
create table if not exists career_path_role_skill_map (
  role_id uuid not null references career_path_roles(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  primary key (role_id, skill_id)
);

-- ============================================================
-- TOOLS (links a career path to the already-existing `tools` table)
-- ============================================================

create table if not exists career_path_tool_map (
  career_path_id uuid not null references career_paths(id) on delete cascade,
  tool_id uuid not null references tools(id) on delete cascade,
  primary key (career_path_id, tool_id)
);

-- ============================================================
-- PROJECTS ("Build experience while you learn")
-- ============================================================

create table if not exists career_path_projects (
  id uuid primary key default gen_random_uuid(),
  career_path_id uuid not null references career_paths(id) on delete cascade,
  position integer not null default 0,
  title text not null,
  level text check (level in ('beginner', 'intermediate', 'advanced')),
  description text,
  external_link text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists career_path_projects_path_idx
  on career_path_projects (career_path_id, position);

-- Join table, matching every other "skills practiced/required" relationship
-- in this schema -- never a text[].
create table if not exists career_path_project_skill_map (
  project_id uuid not null references career_path_projects(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  primary key (project_id, skill_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Fix: career_paths had no status filter on its public read policy.
drop policy if exists "public_read" on career_paths;
drop policy if exists "public_read_published" on career_paths;
create policy "public_read_published" on career_paths
  for select to anon, authenticated using (status = 'published');

alter table career_path_responsibilities enable row level security;
drop policy if exists "public_read_published" on career_path_responsibilities;
create policy "public_read_published" on career_path_responsibilities
  for select to anon, authenticated
  using (exists (
    select 1 from career_paths p
    where p.id = career_path_responsibilities.career_path_id and p.status = 'published'
  ));

alter table career_path_roadmap_stages enable row level security;
drop policy if exists "public_read_published" on career_path_roadmap_stages;
create policy "public_read_published" on career_path_roadmap_stages
  for select to anon, authenticated
  using (exists (
    select 1 from career_paths p
    where p.id = career_path_roadmap_stages.career_path_id and p.status = 'published'
  ));

alter table career_path_roadmap_stage_skill_map enable row level security;
drop policy if exists "public_read_published" on career_path_roadmap_stage_skill_map;
create policy "public_read_published" on career_path_roadmap_stage_skill_map
  for select to anon, authenticated
  using (exists (
    select 1 from career_path_roadmap_stages s
    join career_paths p on p.id = s.career_path_id
    where s.id = career_path_roadmap_stage_skill_map.stage_id and p.status = 'published'
  ));

alter table career_path_roles enable row level security;
drop policy if exists "public_read_published" on career_path_roles;
create policy "public_read_published" on career_path_roles
  for select to anon, authenticated
  using (exists (
    select 1 from career_paths p
    where p.id = career_path_roles.career_path_id and p.status = 'published'
  ));

alter table career_path_role_skill_map enable row level security;
drop policy if exists "public_read_published" on career_path_role_skill_map;
create policy "public_read_published" on career_path_role_skill_map
  for select to anon, authenticated
  using (exists (
    select 1 from career_path_roles r
    join career_paths p on p.id = r.career_path_id
    where r.id = career_path_role_skill_map.role_id and p.status = 'published'
  ));

alter table career_path_tool_map enable row level security;
drop policy if exists "public_read_published" on career_path_tool_map;
create policy "public_read_published" on career_path_tool_map
  for select to anon, authenticated
  using (exists (
    select 1 from career_paths p
    where p.id = career_path_tool_map.career_path_id and p.status = 'published'
  ));

alter table career_path_projects enable row level security;
drop policy if exists "public_read_published" on career_path_projects;
create policy "public_read_published" on career_path_projects
  for select to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1 from career_paths p
      where p.id = career_path_projects.career_path_id and p.status = 'published'
    )
  );

alter table career_path_project_skill_map enable row level security;
drop policy if exists "public_read_published" on career_path_project_skill_map;
create policy "public_read_published" on career_path_project_skill_map
  for select to anon, authenticated
  using (exists (
    select 1 from career_path_projects pr
    join career_paths p on p.id = pr.career_path_id
    where pr.id = career_path_project_skill_map.project_id
      and pr.status = 'published'
      and p.status = 'published'
  ));
