-- Second batch of import sources, added after live-testing every URL from
-- the 40-source research list (both curl and the actual connector code -
-- see src/lib/jobs/importers/ and src/lib/opportunities/importers/).
-- Everything below actually returned real, parseable data at test time.
-- All rows are seeded INACTIVE - turn each on from Admin > Jobs /
-- Admin > Opportunities > Sources once you've reviewed a manual import.
--
-- Skipped from the research list, and why:
--   - Remote OK's RSS URL is dead (410) - already handled via their JSON
--     API in the first batch (job_sources_import.sql).
--   - JobsCollider's RSS is literally RemoteFirstJobs' feed under a
--     different label (same <title>/<link> pointing at remotefirstjobs.com)
--     - adding both would double-import identical jobs.
--   - Jobicy's own RSS URL is behind a Cloudflare bot challenge a server
--     can't pass - used their public JSON API instead (same data).
--   - Adzuna, USAJobs, RapidAPI Job Postings - all need a paid/keyed API
--     account that doesn't exist yet. Connectors not built; add later once
--     there are real credentials.
--   - Ashby, Workable, SmartRecruiters, Recruitee, Teamtailor, BambooHR -
--     same company-by-company shape as Greenhouse/Lever below, but no
--     connector built yet since there's no company list to point them at
--     regardless. Greenhouse and Lever (the two most common) are built and
--     ready - see the comment near the bottom for how to add a company.
--   - Remotewx - the API endpoint the research pointed at doesn't actually
--     exist (returns the frontend HTML page, not JSON); no working endpoint
--     found to replace it with.
--   - African Development Bank, The Grant Desk (both pages), Global
--     Opportunities Impact, Africa No Filter, African Universities VLP,
--     Youth Opportunities Africa - none returned a real RSS/API from a
--     direct fetch. Some may still have one hiding somewhere on their site;
--     worth a manual look later.
--   - Feedspot directories - discovery tools, not sources themselves.
--   - Mastercard Foundation, African Union, DAAD, UN agencies, Handshake -
--     real organisations, not confirmed feed URLs (per the research notes)
--     - need a manual visit to each site to find (or confirm the absence
--     of) an actual feed before they can be wired in.

-- ============================================================
-- JOB SOURCES
-- ============================================================

insert into job_sources (slug, name, source_type, connector, feed_url, website_url, default_category_slug, default_type_slug, import_frequency_minutes, active, auto_publish)
values
  ('remote-first-jobs-cybersecurity', 'Remote First Jobs - Cybersecurity', 'external', 'remotefirstjobs', 'https://remotefirstjobs.com/rss/jobs/cybersecurity.rss', 'https://remotefirstjobs.com', 'tech', 'full-time', 60, false, false),
  ('remote-first-jobs-marketing', 'Remote First Jobs - Marketing', 'external', 'remotefirstjobs', 'https://remotefirstjobs.com/rss/jobs/marketing.rss', 'https://remotefirstjobs.com', 'marketing', 'full-time', 60, false, false),
  ('remote-first-jobs-design', 'Remote First Jobs - Design', 'external', 'remotefirstjobs', 'https://remotefirstjobs.com/rss/jobs/design.rss', 'https://remotefirstjobs.com', 'design', 'full-time', 60, false, false),
  ('remote-first-jobs-writing', 'Remote First Jobs - Writing', 'external', 'remotefirstjobs', 'https://remotefirstjobs.com/rss/jobs/writing.rss', 'https://remotefirstjobs.com', 'writing', 'full-time', 60, false, false),
  ('remote-first-jobs-sales', 'Remote First Jobs - Sales', 'external', 'remotefirstjobs', 'https://remotefirstjobs.com/rss/jobs/sales.rss', 'https://remotefirstjobs.com', 'sales', 'full-time', 60, false, false),
  ('himalayas', 'Himalayas', 'external', 'himalayas', 'https://himalayas.app/jobs/rss', 'https://himalayas.app', 'tech', 'full-time', 60, false, false),
  ('we-work-remotely', 'We Work Remotely', 'external', 'weworkremotely', 'https://weworkremotely.com/remote-jobs.rss', 'https://weworkremotely.com', 'tech', 'full-time', 60, false, false),
  ('arbeitnow', 'Arbeitnow', 'external', 'arbeitnow', 'https://arbeitnow.com/api/job-board-api', 'https://arbeitnow.com', 'tech', 'full-time', 60, false, false),
  -- Remotive's own terms cap requests at "max 4 times a day" - 360 minutes
  -- keeps every automatic run within that even if turned on.
  ('remotive', 'Remotive', 'external', 'remotive', 'https://remotive.com/api/remote-jobs', 'https://remotive.com', 'tech', 'full-time', 360, false, false),
  ('jobicy', 'Jobicy', 'external', 'jobicy', 'https://jobicy.com/api/v2/remote-jobs', 'https://jobicy.com', 'tech', 'full-time', 60, false, false)
on conflict (slug) do nothing;

-- Greenhouse and Lever connectors are ready (src/lib/jobs/importers/
-- greenhouse.ts, lever.ts) but need a real company to point at - there's no
-- directory of which companies use which platform, so this can't be
-- guessed or seeded automatically. To track a company once you have one:
--
--   insert into job_sources (slug, name, source_type, connector, feed_url, default_category_slug, default_type_slug)
--   values ('greenhouse-acme', 'Acme (Greenhouse)', 'external', 'greenhouse',
--     'https://boards-api.greenhouse.io/v1/boards/acme/jobs?content=true', 'tech', 'full-time');
--
--   insert into job_sources (slug, name, source_type, connector, feed_url, default_category_slug, default_type_slug)
--   values ('lever-acme', 'Acme (Lever)', 'external', 'lever',
--     'https://api.lever.co/v0/postings/acme', 'tech', 'full-time');
--
-- Swap "acme" for the company's actual Greenhouse/Lever token (visible in
-- their careers page URL).

-- ============================================================
-- OPPORTUNITY SOURCES (feed the same job_sources table, but their rows
-- are picked up by /api/admin/opportunities/import, not the jobs one -
-- see connector name)
-- ============================================================

insert into job_sources (slug, name, source_type, connector, feed_url, website_url, import_frequency_minutes, active, auto_publish)
values
  ('opportunities-for-youth', 'Opportunities for Youth', 'external', 'generic_rss_opportunity', 'https://opportunitiesforyouth.org/feed/', 'https://opportunitiesforyouth.org', 120, false, false),
  ('youth-opportunities-hub', 'Youth Opportunities Hub', 'external', 'generic_rss_opportunity', 'https://youthopportunitieshub.com/feed/', 'https://youthopportunitieshub.com', 120, false, false),
  ('your-opportunities-africa', 'Your Opportunities Africa', 'external', 'generic_rss_opportunity', 'https://youropportunitiesafrica.com/feed/', 'https://youropportunitiesafrica.com', 120, false, false)
on conflict (slug) do nothing;
