-- Lets the existing `events` table join the shared skills taxonomy, same
-- pattern as job_skill_map/opportunity_skill_map/resource_skill_map/
-- course_skill_map (all already live). Kept as its own small file rather
-- than appended to jobs_opportunities_schema.sql or admin_content_policies.sql
-- editing an already-applied file's bare `create policy` statements (no
-- `drop policy if exists` guard) would fail with "policy already exists" on
-- re-run; a fresh file avoids that.
--
-- Run any time after supabase/jobs_opportunities_schema.sql (needs `skills`)
-- and after the existing `events` table (already live).

create table if not exists event_skill_map (
  event_id uuid not null references events(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  primary key (event_id, skill_id)
);

alter table event_skill_map enable row level security;
create policy "public_read" on event_skill_map for select to anon, authenticated using (true);
