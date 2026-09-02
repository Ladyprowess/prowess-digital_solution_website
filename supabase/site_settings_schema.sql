-- Backs /admin/settings: the handful of site-wide values that were
-- hardcoded in src/content/site.ts (contact), src/components/Footer.tsx
-- (social links) and src/app/layout.tsx (SEO title/description) - moved
-- here so they can be edited without a code change. Everything else in
-- those files (icons, manifest, OG image, JSON-LD structure, nav links)
-- stays as code; this table only owns the values that are genuinely just
-- content, not structure.
--
-- Singleton table: exactly one row, id fixed so every reader/writer can
-- .eq('id', 1) without a separate lookup.
--
-- Run after supabase/jobs_opportunities_schema.sql, then add
-- 'site_settings' to the admin_full_access loop in
-- supabase/admin_content_policies.sql and re-run that file.

create table if not exists site_settings (
  id integer primary key default 1,
  single_row boolean not null default true unique,

  contact_email text,
  contact_phone text,
  contact_location text,

  social_linkedin text,
  social_instagram text,
  social_twitter text,

  seo_title text,
  seo_description text,

  updated_at timestamptz not null default now(),

  constraint site_settings_singleton check (id = 1)
);

alter table site_settings enable row level security;
drop policy if exists "public_read" on site_settings;
create policy "public_read" on site_settings for select to anon, authenticated using (true);

-- Seed with the values already live in code today, so nothing changes
-- until an admin actually edits something in /admin/settings.
insert into site_settings (
  id, contact_email, contact_phone, contact_location,
  social_linkedin, social_instagram, social_twitter,
  seo_title, seo_description
) values (
  1,
  'info@prowessdigitalsolutions.com',
  '+2348162174443',
  'Remote, worldwide. Based in Nigeria.',
  'https://www.linkedin.com/company/prowess-digital-solutions',
  'https://www.instagram.com/prowessdigitalsolutions',
  'https://twitter.com/prowessDS',
  'Prowess Digital Solutions | Discover Opportunities, Learn Skills, Build Your Career',
  'Prowess Digital Solutions helps people learn, build and grow through practical resources, tools, opportunities and business support.'
)
on conflict (id) do nothing;
