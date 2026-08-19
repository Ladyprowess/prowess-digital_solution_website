-- Closes a real gap in the already-live course_modules/course_lessons RLS:
-- the existing policy (in jobs_opportunities_schema.sql) only checks that
-- the parent course is published, not whether it's free. That means anyone
-- with the anon key - which is public, embedded in every page - can query
-- course_lessons directly today and read a premium lesson's full
-- content_text/content_url, entirely bypassing any future paywall UI.
--
-- Fix: direct client reads (RLS) are only granted for lessons belonging to
-- a FREE published course. Premium lesson content is never readable via
-- direct query, by anyone, regardless of entitlement - it must go through
-- /api/content/access (service role, which bypasses RLS after verifying the
-- caller's own purchase). This is deliberately simpler than trying to make
-- RLS itself understand entitlement: a guest who just paid has no Supabase
-- session at all to check auth.uid()/auth.jwt() against, so RLS alone can
-- never grant them access anyway - signed-in-and-entitled-only through the
-- server route is the one consistent rule, for guests and members alike.
--
-- jobs_opportunities_schema.sql already succeeded in production and its
-- bare `create policy` statements have no `drop policy if exists` guard, so
-- this is its own file rather than an edit to that one (re-running it would
-- fail with "policy already exists").
--
-- Run any time after supabase/jobs_opportunities_schema.sql.

drop policy if exists "public_read_of_published_course" on course_modules;
create policy "public_read_of_published_course" on course_modules
  for select to anon, authenticated
  using (exists (
    select 1 from courses c
    where c.id = course_modules.course_id and c.status = 'published' and c.access = 'free'
  ));

drop policy if exists "public_read_of_published_course" on course_lessons;
create policy "public_read_of_published_course" on course_lessons
  for select to anon, authenticated
  using (exists (
    select 1 from course_modules m
    join courses c on c.id = m.course_id
    where m.id = course_lessons.module_id and c.status = 'published' and c.access = 'free'
  ));
