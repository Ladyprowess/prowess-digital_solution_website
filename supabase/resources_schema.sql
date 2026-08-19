-- Extends the ALREADY EXISTING `resources` table (live in production,
-- backing /resources and /resources/upload today - real B2B business
-- guides/checklists/templates already uploaded there) into a unified
-- content library that can serve both audiences from one system, per the
-- product decision: "Resources are Resources" from a visitor's point of
-- view; the B2C/B2B split happens through an `audience` field plus
-- type/category/skills/career-path, not through separate tables.
--
-- Every existing column (type, stage, is_published, file_path, file_name,
-- file_type, file_size, cover_url, cover_path, downloads, rating,
-- description, category) is left untouched - this is additive only. The
-- existing /api/resources route and /resources/upload flow keep working
-- exactly as they do today.
--
-- IMPORTANT: this superseded an earlier version of this file that tried to
-- `create table if not exists resources` as a brand new table. That failed
-- in production with "column status does not exist" because `resources`
-- already existed under a different, incompatible schema - the CREATE TABLE
-- silently no-opped and the RLS policy below it then referenced a column
-- that was never added. If you already ran the old version of this file and
-- it errored, nothing was left behind: Supabase's SQL editor runs the whole
-- script as one transaction, so it rolled back cleanly. This version is
-- safe to run from a clean slate.
--
-- Run after supabase/jobs_opportunities_schema.sql.

alter table resources add column if not exists slug text;

-- Who this is for. Not the only axis (type/category/skills/career_path do
-- the finer targeting) but the top-level split between the B2C content
-- library and the existing B2B business-resource content.
alter table resources add column if not exists audience text not null default 'business'
  check (audience in ('consumer', 'business', 'both'));

-- A stricter, filterable categorisation than the existing free-text `type`
-- column (which holds display strings like "PDF Guide" for the legacy
-- upload flow) - resource_type is additive, not a replacement, so existing
-- rows and the existing upload page are unaffected.
alter table resources add column if not exists resource_type text
  check (resource_type in ('article', 'guide', 'checklist', 'template', 'ebook', 'video', 'podcast', 'external_course', 'business_guide'));

alter table resources add column if not exists level text
  check (level in ('beginner', 'intermediate', 'advanced'));

-- Where the material actually lives, for curated video/podcast/external
-- course links (existing rows are all Prowess-hosted uploads, hence the
-- default).
alter table resources add column if not exists source text not null default 'prowess'
  check (source in ('prowess', 'youtube', 'external'));
alter table resources add column if not exists external_url text;

-- A plain external thumbnail URL for the new admin form (e.g. a YouTube
-- thumbnail) - distinct from the existing cover_url/cover_path pair, which
-- is a signed URL generated from a real Supabase Storage upload via the
-- legacy /resources/upload flow and stays exactly as-is.
alter table resources add column if not exists thumbnail_url text;

alter table resources add column if not exists content text;

alter table resources add column if not exists access text not null default 'free'
  check (access in ('free', 'premium'));
alter table resources add column if not exists price numeric;
alter table resources add column if not exists price_currency text;

alter table resources add column if not exists featured boolean not null default false;

-- New alongside the existing `is_published` boolean, not a replacement:
-- draft/published/archived gives the same three-state publishing control
-- every other admin page in this schema already has. The admin CMS keeps
-- both in sync on every write (is_published = status = 'published') so
-- nothing that already reads is_published (the existing /api/resources
-- route) needs to change.
alter table resources add column if not exists status text not null default 'draft'
  check (status in ('draft', 'published', 'archived'));
update resources set status = case when is_published then 'published' else 'draft' end
  where status = 'draft' and is_published = true;

alter table resources add column if not exists published_at timestamptz;
update resources set published_at = created_at where published_at is null and is_published = true;

alter table resources add column if not exists updated_at timestamptz not null default now();

-- Backfill slugs for existing rows from title; new rows always get one
-- explicitly from the admin form. Partial unique index (not a NOT NULL
-- constraint) so this can't fail on an edge case in the backfill.
update resources
set slug = lower(regexp_replace(regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
where slug is null;

create unique index if not exists resources_slug_idx on resources (slug) where slug is not null;
create index if not exists resources_status_published_at_idx on resources (status, published_at desc);
create index if not exists resources_audience_idx on resources (audience);

create table if not exists resource_skill_map (
  resource_id uuid not null references resources(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  primary key (resource_id, skill_id)
);

-- resources currently has no RLS at all (confirmed live: the anon key can
-- read every row today, published or not). Enabling it here with a
-- published-only public policy is a strict improvement, not a behaviour
-- change for the existing app - /api/resources reads via the service role
-- key server-side and is unaffected either way.
alter table resources enable row level security;
drop policy if exists "public_read_published" on resources;
create policy "public_read_published" on resources
  for select to anon, authenticated using (is_published = true);

alter table resource_skill_map enable row level security;
create policy "public_read" on resource_skill_map for select to anon, authenticated using (true);
