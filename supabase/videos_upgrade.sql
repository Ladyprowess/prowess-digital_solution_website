-- Upgrades the existing /videos experience (already live, backed by
-- resources.resource_type = 'video') with:
--   - a placement system so admins can decide WHERE a resource surfaces,
--     independent of its resource_type/audience/category -- applies to
--     every resource type (video, ebook, article, guide), not just video.
--   - content_role, a curation-only field (never generates nav tabs) that
--     powers rails like "Ideas Worth Watching" (motivation + interview).
--   - duration_minutes / why_recommended for the new video detail page.
--   - video_progress, for real YouTube watch-position tracking (Continue
--     Watching), mirroring learning_progress's percent-based shape rather
--     than lesson_completions' binary one.
--
-- Run after supabase/resources_schema.sql and supabase/accounts_schema.sql.

alter table resources add column if not exists content_role text
  check (content_role in ('general', 'learning', 'career', 'business', 'motivation', 'interview', 'webinar', 'tutorial'));

alter table resources add column if not exists duration_minutes integer;
alter table resources add column if not exists why_recommended text;

-- "Normal flow" -- default true so nothing already published silently
-- vanishes from its existing home the day this migration runs.
alter table resources add column if not exists show_in_library boolean not null default true;
alter table resources add column if not exists show_in_learn boolean not null default true;
alter table resources add column if not exists show_in_recommended boolean not null default true;

-- Deliberate curation opt-in -- default false, admin picks what shows here.
alter table resources add column if not exists show_on_homepage boolean not null default false;
alter table resources add column if not exists show_in_business boolean not null default false;
alter table resources add column if not exists show_in_career boolean not null default false;

-- Backfill so the Business destination isn't empty on day one -- audience
-- already carries real data for every existing row. Admins can uncheck
-- individual rows afterward; this only sets the initial state.
update resources set show_in_business = true
  where audience in ('business', 'both') and status = 'published';

-- Percent-based watch progress (mirrors learning_progress, not the binary
-- lesson_completions shape -- a video needs a resume position, not just
-- done/not-done).
create table if not exists video_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed')),
  progress_percent int not null default 0
    check (progress_percent >= 0 and progress_percent <= 100),
  position_seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, resource_id)
);

-- Personal data, own-rows only -- not added to admin_content_policies.sql's
-- admin-bypass loop, matching learning_progress/lesson_completions'
-- precedent (no admin-edit UI for a user's own watch history).
alter table video_progress enable row level security;
create policy "own_rows" on video_progress
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
