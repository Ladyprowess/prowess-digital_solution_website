-- Learn LMS, Phase 3: Achievement system (points, streaks, badges).
-- Run after supabase/certificates.sql (Phase 2).
--
-- Table order matters here: badges must exist before user_badges, but
-- badges' own read policy needs to reference user_badges - so badges is
-- created with RLS enabled but no policy yet, user_badges is created
-- next, and only then is badges' policy created.

create table achievement_point_rules (
  activity_type text primary key check (activity_type in ('lesson_completed','quiz_passed','course_completed','certificate_earned')),
  points int not null check (points >= 0), -- no accidental negative point rules
  updated_at timestamptz not null default now()
);
insert into achievement_point_rules (activity_type, points) values
  ('lesson_completed', 5),
  ('quiz_passed', 10),
  ('course_completed', 50),
  ('certificate_earned', 25);
alter table achievement_point_rules enable row level security;
create policy "authenticated_read" on achievement_point_rules for select to authenticated using (true);
-- admin_full_access granted via admin_content_policies.sql.
-- point_events snapshots the points value at award time, so a rule change
-- here is prospective only - it never rewrites an event already
-- recorded, and history/leaderboard standings for past events do not
-- retroactively change when an admin edits a value here.

-- Append-only ledger - the one place idempotency is enforced. The same
-- (user, activity_type, source_id) can never be awarded twice. source_id
-- is a lesson_id/quiz_id/course_id/certificate_id depending on
-- activity_type - never an FK (it points at four different tables) -
-- server-side callers are responsible for only ever passing a source_id
-- already independently verified against a durable table (see the
-- evaluate-completion route's lesson_completed re-check - this is what
-- prevents a point-farming exploit, not the unique constraint alone).
create table point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null check (activity_type in ('lesson_completed','quiz_passed','course_completed','certificate_earned')),
  source_id uuid not null,
  points int not null,
  created_at timestamptz not null default now(),
  unique (user_id, activity_type, source_id)
);
alter table point_events enable row level security;
create policy "own_read" on point_events for select to authenticated using (auth.uid() = user_id);
-- No write policy for authenticated - only src/lib/achievements/evaluate.ts
-- (service role) ever writes this. Any authenticated write path here
-- would let a learner directly inflate their own points.

create table learner_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_points int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_activity_date date,
  updated_at timestamptz not null default now()
);
alter table learner_stats enable row level security;
create policy "own_read" on learner_stats for select to authenticated using (auth.uid() = user_id);
-- No write policy for authenticated - writes go through
-- reconcile_learner_total_points() below (for total_points) plus a direct
-- streak-field update, both only ever called from
-- src/lib/achievements/evaluate.ts's service-role client.

create table badges (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, -- stable identifier, set once at creation, never regenerated on edit
  title text not null,
  description text,
  icon_key text not null default 'award',
  criteria_type text not null check (criteria_type in ('total_points','streak_days','courses_completed','quizzes_passed')),
  threshold int not null check (threshold > 0),
  status text not null default 'draft' check (status in ('draft','published','archived')), -- 'archived' is the retirement path, not delete
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table badges enable row level security;
-- Policy created further below, after user_badges exists.

create table user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- RESTRICT, not CASCADE: an admin must never be able to delete a badge
  -- out from under a learner who already earned it - an earned badge is a
  -- credential, same "once issued, it stands" principle as certificates.
  -- The admin UI never offers a delete action for badges at all (only
  -- draft/published/archived transitions) - this constraint is defense in
  -- depth against a future direct-SQL delete.
  badge_id uuid not null references badges(id) on delete restrict,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);
alter table user_badges enable row level security;
create policy "own_read" on user_badges for select to authenticated using (auth.uid() = user_id);
-- No write policy for authenticated - service-role evaluator only.

-- Now that user_badges exists, badges' read policy can reference it.
-- Published badges are visible to every signed-in learner (so they can
-- see what to work toward); an already-earned badge stays visible to the
-- learner who holds it even if an admin later archives it.
create policy "published_read" on badges for select to authenticated using (
  status = 'published'
  or exists (select 1 from user_badges ub where ub.badge_id = badges.id and ub.user_id = auth.uid())
);
-- admin_full_access granted via admin_content_policies.sql.

-- Atomic, single-statement points reconciliation. Plain JS read-then-write
-- (SELECT sum, then UPDATE with that value) has a real race: two
-- concurrent awards for the same user can interleave so the LATER write
-- overwrites a correct total with an EARLIER, stale sum (A reads 100, B
-- reads+writes 105, A then writes its stale 100 last). Computing the sum
-- inside the same UPDATE statement Postgres executes means it's always
-- consistent at the instant of the write - no JS-side window for another
-- writer to land in between. The upsert (ON CONFLICT) is also the ONLY
-- place a learner_stats row is ever created, so there is no separate
-- "does this user have a row yet" race anywhere in application code.
create or replace function reconcile_learner_total_points(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into learner_stats (user_id, total_points, updated_at)
  values (p_user_id, (select coalesce(sum(points), 0) from point_events where user_id = p_user_id), now())
  on conflict (user_id) do update
    set total_points = excluded.total_points, updated_at = excluded.updated_at;
$$;
revoke all on function reconcile_learner_total_points(uuid) from public, anon, authenticated;
-- Only ever called via supabaseAdmin()'s service-role client from
-- src/lib/achievements/evaluate.ts.
