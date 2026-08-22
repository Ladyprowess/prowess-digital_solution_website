-- Upgrades the existing /resources experience (the broader resource
-- library -- articles, guides, ebooks, templates, checklists, podcasts,
-- external courses; distinct from /learn's structured courses and
-- /videos' dedicated video experience) with:
--   - page_count, for the ebook detail page.
--   - use_case, a curation-only field (never generates nav tabs) powering
--     the admin-curated "Browse by need" tiles on the new /resources page.
--   - checklist_progress, for real per-user checked-item state on
--     interactive checklists.
--
-- reading_minutes (an ebook/article reading-time field) and every
-- placement column (show_in_library/show_in_learn/show_in_recommended/
-- show_on_homepage/show_in_business/show_in_career) already exist from
-- earlier migrations and already apply to every resource type, not just
-- video -- no changes needed to either here.
--
-- Run after supabase/resources_schema.sql and supabase/videos_upgrade.sql.

alter table resources add column if not exists page_count integer;

alter table resources add column if not exists use_case text
  check (use_case in ('learn', 'template', 'checklist', 'business_guide', 'career', 'read'));

-- Item-indexed, not percent-based -- a checklist has discrete items, not a
-- scrub position like video. checked_items holds the indices of checked
-- <li> items within the resource's parsed content, so it stays meaningful
-- even as the number of items varies per checklist.
create table if not exists checklist_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  checked_items integer[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique (user_id, resource_id)
);

-- Personal data, own-rows only -- not added to admin_content_policies.sql's
-- admin-bypass loop, matching video_progress/learning_progress's
-- precedent (no admin-edit UI for a user's own checklist state).
alter table checklist_progress enable row level security;
create policy "own_rows" on checklist_progress
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
