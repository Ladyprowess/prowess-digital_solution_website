-- Extends job_sources so it can drive an automated importer (Remote OK
-- first; more sources can be added later by adding a new `connector` value
-- in code and a new row here) on top of the manual-only source it started
-- as. job_sources already has admin-only RLS from admin_content_policies.sql
-- so no new policies are needed here.

alter table job_sources
  add column if not exists connector text,
  add column if not exists feed_url text,
  add column if not exists website_url text,
  add column if not exists default_category_slug text,
  add column if not exists default_type_slug text,
  add column if not exists active boolean not null default false,
  add column if not exists auto_publish boolean not null default false,
  add column if not exists import_frequency_minutes int not null default 60,
  add column if not exists last_imported_at timestamptz,
  add column if not exists last_import_error text,
  add column if not exists last_import_count int;

-- Prevents the importer from ever inserting the same listing twice, even if
-- the app-level check-then-insert has a race (two overlapping cron runs).
create unique index if not exists jobs_source_external_id_key
  on jobs (source_id, external_id)
  where external_id is not null;

insert into job_sources (slug, name, source_type, connector, feed_url, website_url, default_category_slug, default_type_slug, active, auto_publish)
values (
  'remote-ok',
  'Remote OK',
  'external',
  'remoteok',
  'https://remoteok.com/api',
  'https://remoteok.com',
  'tech',
  'full-time',
  false,
  false
)
on conflict (slug) do nothing;
