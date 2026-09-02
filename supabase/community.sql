-- Learn LMS: Community - discussions (course-level board + per-lesson Q&A)
-- and reviews (star rating + text), plus a moderation report queue.
--
-- Run after supabase/jobs_opportunities_schema.sql, supabase/accounts_schema.sql
-- and supabase/certificates.sql.
--
-- status lifecycle, identical across discussion_posts, discussion_replies,
-- course_reviews:
--   'visible'              - live, publicly readable (subject to the
--                            parent course being published)
--   'deleted_by_author'    - the author hid their own content; they may
--                            toggle this back to 'visible' themselves
--   'removed_by_moderator' - an admin removed it for cause; the author can
--                            never move a row out of this state again
-- Three values, not two: a learner self-hiding their own post and a
-- moderator removing it for cause are materially different states, and
-- collapsing them into one 'removed' value would both block a learner
-- from ever undoing their own accidental self-delete and make audit/
-- reporting ambiguous about which actually happened.

-- No existing "touch updated_at on edit" trigger convention exists in this
-- repo (certificates/course_completions never get updated after insert) -
-- this is a small, reusable one, since both an API-route update and a
-- direct client RLS update need updated_at to actually reflect edits, and
-- relying on every future call site to remember to set it by hand is
-- exactly the kind of thing that silently rots.
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table discussion_posts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  lesson_id uuid references course_lessons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,        -- snapshot at post time - see certificates.learner_name precedent.
  author_avatar_url text,           -- snapshot at post time; deliberately NOT kept live - a name/avatar
                                     -- changing later doesn't retroactively rewrite what was posted under
                                     -- it, same as any forum. Documented explicitly, not just inherited
                                     -- from the certificate pattern by assumption.
  body text not null
    check (char_length(trim(body)) between 1 and 4000),
  status text not null default 'visible'
    check (status in ('visible', 'deleted_by_author', 'removed_by_moderator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index discussion_posts_course_visible_idx on discussion_posts (course_id, created_at desc) where status = 'visible';
create index discussion_posts_lesson_visible_idx on discussion_posts (lesson_id, created_at desc) where status = 'visible';
create trigger discussion_posts_set_updated_at before update on discussion_posts for each row execute function set_updated_at();

create table discussion_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references discussion_posts(id) on delete cascade,
  -- Denormalized (not just derivable via post_id -> discussion_posts.course_id) so the
  -- published-course RLS check below never needs a second-hop join through the parent
  -- post - same "always carry course_id" choice already made on discussion_posts itself.
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_avatar_url text,
  body text not null
    check (char_length(trim(body)) between 1 and 2000),
  status text not null default 'visible'
    check (status in ('visible', 'deleted_by_author', 'removed_by_moderator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index discussion_replies_post_visible_idx on discussion_replies (post_id, created_at) where status = 'visible';
create trigger discussion_replies_set_updated_at before update on discussion_replies for each row execute function set_updated_at();

create table course_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  body text
    check (body is null or char_length(trim(body)) between 1 and 4000),
  status text not null default 'visible'
    check (status in ('visible', 'deleted_by_author', 'removed_by_moderator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)   -- one review row per learner per course, ever - edits update it in place
);
create index course_reviews_course_visible_idx on course_reviews (course_id) where status = 'visible';
create trigger course_reviews_set_updated_at before update on course_reviews for each row execute function set_updated_at();

-- Generic report queue - same "no type-specific fields" reasoning already
-- used for saved_items (jobs_opportunities_schema.sql). target_id is
-- intentionally not an FK (Postgres can't express a conditional FK across
-- three tables) - integrity here is enforced by the API route
-- (src/app/api/community/report/route.ts), NOT by a client-writable RLS
-- insert policy - see the "no authenticated insert policy" note below.
create table content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('course_review', 'discussion_post', 'discussion_reply')),
  target_id uuid not null,
  reason text check (reason is null or char_length(reason) <= 500),
  status text not null default 'pending' check (status in ('pending', 'actioned', 'dismissed')),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_note text,
  created_at timestamptz not null default now(),
  unique (reporter_user_id, target_type, target_id)   -- can't spam-report the same item twice
);
create index content_reports_status_idx on content_reports (status);

-- ============================================================
-- RLS
-- ============================================================

alter table discussion_posts enable row level security;
alter table discussion_replies enable row level security;
alter table course_reviews enable row level security;
alter table content_reports enable row level security;

-- Public read requires BOTH the row itself being visible AND the parent
-- course being published - a status='visible' check alone would let
-- anyone who knows/guesses a course id read discussion/review content
-- belonging to a still-draft, unpublished course, regardless of what
-- /learn/[slug] itself hides. course_id is denormalized onto all three
-- tables (including replies) so this is always a one-hop join, never a
-- second hop through the parent post.
create policy "published_read" on discussion_posts for select to anon, authenticated
  using (status = 'visible' and exists (select 1 from courses c where c.id = discussion_posts.course_id and c.status = 'published'));

create policy "published_read" on discussion_replies for select to anon, authenticated
  using (status = 'visible' and exists (select 1 from courses c where c.id = discussion_replies.course_id and c.status = 'published'));

create policy "published_read" on course_reviews for select to anon, authenticated
  using (status = 'visible' and exists (select 1 from courses c where c.id = course_reviews.course_id and c.status = 'published'));

-- An author must also be able to see their OWN row regardless of status -
-- published_read alone would hide a self-deleted or moderator-removed
-- review/post from its own author, who otherwise couldn't tell the two
-- apart (or ever self-undelete, since the UI needs to find the row first).
-- Postgres combines permissive select policies with OR, so a non-owner is
-- unaffected - they still only ever match published_read.
create policy "own_read" on discussion_posts for select to authenticated using (auth.uid() = user_id);
create policy "own_read" on discussion_replies for select to authenticated using (auth.uid() = user_id);
create policy "own_read" on course_reviews for select to authenticated using (auth.uid() = user_id);

-- Owner edit / self-delete / self-undelete. Lets an owner toggle freely
-- between visible and deleted_by_author in either direction (edit,
-- self-delete, self-undelete) - but once a row's status is
-- removed_by_moderator, `using` no longer matches so the owner can never
-- touch it again, and the `with check` allow-list means a non-admin
-- caller can never SET removed_by_moderator themselves either way.
-- No insert policy for authenticated on any of the three - inserts only
-- happen through the API routes, where entitlement (and, for reviews,
-- completion) can actually be checked.
create policy "own_update" on discussion_posts for update to authenticated
  using (auth.uid() = user_id and status in ('visible', 'deleted_by_author'))
  with check (auth.uid() = user_id and status in ('visible', 'deleted_by_author'));

create policy "own_update" on discussion_replies for update to authenticated
  using (auth.uid() = user_id and status in ('visible', 'deleted_by_author'))
  with check (auth.uid() = user_id and status in ('visible', 'deleted_by_author'));

create policy "own_update" on course_reviews for update to authenticated
  using (auth.uid() = user_id and status in ('visible', 'deleted_by_author'))
  with check (auth.uid() = user_id and status in ('visible', 'deleted_by_author'));

-- content_reports: deliberately NO authenticated insert policy. The API
-- route (src/app/api/community/report/route.ts) is the actual validation
-- boundary (confirms the target exists, is currently visible, and isn't
-- the reporter's own content) - a client-writable insert policy here
-- would let anyone skip that validation and write a fabricated report
-- directly via Supabase JS. All writes to this table go through
-- supabaseAdmin() after that validation.

-- ============================================================
-- Moderation: one atomic resolve function, not two separate client writes
-- ============================================================

-- A client page doing "update the content row" then "update the report
-- row" as two separate Supabase calls can partially fail (content
-- removed, report still shows pending). security invoker - runs as the
-- calling admin, still bound by their own admin_full_access RLS, no
-- elevated privilege needed - just atomicity (one function call = one
-- transaction) and a full audit trail in one place.
create or replace function resolve_content_report(
  p_report_id uuid, p_action text, p_note text
) returns void as $$
declare
  r content_reports%rowtype;
  tbl text;
begin
  select * into r from content_reports where id = p_report_id;
  if r.id is null then raise exception 'report not found'; end if;

  tbl := case r.target_type
    when 'course_review' then 'course_reviews'
    when 'discussion_post' then 'discussion_posts'
    when 'discussion_reply' then 'discussion_replies'
  end;

  if p_action = 'remove' then
    execute format('update %I set status = ''removed_by_moderator'' where id = $1', tbl) using r.target_id;
  elsif p_action <> 'dismiss' then
    raise exception 'invalid action';
  end if;

  -- Bulk-resolve every OTHER pending report against this same target too -
  -- several people can report the same abusive post, and leaving the
  -- duplicates sitting in the queue as "still pending" after the first
  -- one's already been actioned is just moderation noise.
  update content_reports
    set status = case when p_action = 'remove' then 'actioned' else 'dismissed' end,
        resolved_at = now(), resolved_by = auth.uid(), resolution_note = p_note
    where target_type = r.target_type and target_id = r.target_id and status = 'pending';
end;
$$ language plpgsql security invoker;
