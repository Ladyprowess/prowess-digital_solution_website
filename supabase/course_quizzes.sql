-- Learn LMS, Phase 1: the quiz/assessment engine, plus the foundation the
-- rest of the seven-system LMS architecture builds on later (course
-- completion rules now, certificates/achievements/assignments/community
-- after). See the "Learn LMS" plan for the full seven-system design this
-- is one piece of.
--
-- Run after supabase/jobs_opportunities_schema.sql and
-- supabase/course_lessons_entitlement.sql. Run
-- supabase/admin_content_policies.sql again after this file, since it now
-- grants admin_full_access to quizzes/quiz_questions/quiz_options/
-- course_completion_rules, which don't exist until this file has run.

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  quiz_type text not null check (quiz_type in ('knowledge_check','assessment')),
  pass_mark_percent int check (pass_mark_percent between 0 and 100),
  allow_retry boolean not null default true,
  show_correct_answer text not null default 'immediately' check (show_correct_answer in ('immediately','after_submission')),
  randomize_questions boolean not null default false,
  randomize_options boolean not null default false,
  required_to_continue boolean not null default false, -- schema-only in V1, not enforced anywhere yet
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_type text not null check (question_type in ('single_choice','multiple_select','true_false','short_answer')),
  question_text text not null,
  explanation text,
  accepted_answers text[],       -- short_answer only
  case_sensitive boolean not null default false, -- short_answer only
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index quiz_questions_quiz_id_idx on quiz_questions (quiz_id, position);

create table quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  position int not null default 0
);
create index quiz_options_question_id_idx on quiz_options (question_id, position);

create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','submitted')),
  score_percent int,
  passed boolean,
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);
create index quiz_attempts_quiz_user_idx on quiz_attempts (quiz_id, user_id);
-- Only one open attempt per (quiz, user) at a time - the real enforcement
-- for "one in-progress attempt", not just an application-level check.
-- Concurrent requests (two tabs both hitting "start attempt") can still
-- both pass an app-level "does one already exist" check before either has
-- committed; this index is what actually guarantees the invariant, same
-- partial-unique-index pattern already used for
-- premium_membership_subscriptions and career_tool_purchases elsewhere in
-- this codebase. The start-attempt route catches the resulting
-- unique-violation on a race and re-fetches the now-existing row instead
-- of erroring.
create unique index quiz_attempts_one_in_progress on quiz_attempts (quiz_id, user_id) where status = 'in_progress';

-- Snapshots which questions (and their order) belong to an attempt at the
-- moment it starts. Grading and the score denominator are computed against
-- THIS table, never against a live query of quiz_questions - otherwise an
-- admin adding/editing/deleting a question while someone has an
-- in-progress attempt would change what that attempt is graded against out
-- from under them. Also the natural place a future randomize_questions
-- implementation persists its per-attempt order (compute once at attempt
-- start, store here, never re-randomize on a later GET/render - refreshing
-- mid-attempt must not reshuffle question order).
create table quiz_attempt_questions (
  attempt_id uuid not null references quiz_attempts(id) on delete cascade,
  question_id uuid not null references quiz_questions(id) on delete cascade,
  position int not null,
  primary key (attempt_id, question_id)
);

create table quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references quiz_attempts(id) on delete cascade,
  question_id uuid not null references quiz_questions(id) on delete cascade,
  selected_option_ids uuid[],  -- single_choice / multiple_select / true_false
  typed_answer text,           -- short_answer
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

-- One row per course, created now (self-contained, zero risk) even though
-- nothing enforces these rules yet - the Credentials phase is what
-- actually reads this table and gates completion against it. No admin UI
-- for it in Phase 1 either; the table just exists so that phase doesn't
-- need a migration of its own.
create table course_completion_rules (
  course_id uuid primary key references courses(id) on delete cascade,
  require_all_required_activities boolean not null default true,
  require_all_quizzes_passed boolean not null default false,
  require_final_assessment boolean not null default false,
  final_assessment_quiz_id uuid references quizzes(id),
  require_assignments boolean not null default false,
  require_peer_reviews boolean not null default false,
  minimum_final_score_percent int check (minimum_final_score_percent between 0 and 100),
  issue_certificate_automatically boolean not null default false
);
alter table course_completion_rules enable row level security;
-- admin_content_policies.sql (re-run after this file) grants
-- admin_full_access. No public read policy needed yet (no UI reads it in
-- Phase 1); add one in a later phase if a course's rules ever need to be
-- shown to learners (e.g. "this course requires 70% to pass").

-- course_lessons becomes a generic "activity" row, not just video/text/pdf -
-- widened now (assignment/discussion_prompt/download included) even though
-- only 'quiz' is actually used until their own phases, so this constraint
-- never needs touching again.
--
-- `required` has exactly ONE job: it's read by the future
-- course_completion_rules evaluator's "require_all_required_activities"
-- check (a later phase, not built now) to decide formal course completion.
-- It plays NO role in Phase 1's progress-percent math - that stays exactly
-- the existing all-activities/all-lessons formula, unchanged. These are
-- deliberately two different concepts, not the same number read two ways:
--   - learning_progress.progress_percent = completed activities / all
--     activities - a lightweight "how far through" indicator, still
--     computed the same way it already is today.
--   - formal course completion = whatever course_completion_rules'
--     evaluator decides (a later phase) - can require passing marks,
--     specific activities, etc. 100% progress does NOT imply "course
--     completed"; someone can finish every activity, fail the final
--     assessment, and be at 100% progress while still not
--     completion-rule-eligible for a certificate. Don't let a later phase
--     collapse these into one number.
alter table course_lessons drop constraint if exists course_lessons_content_type_check;
alter table course_lessons add constraint course_lessons_content_type_check
  check (content_type in ('video', 'text', 'youtube', 'pdf', 'external', 'quiz', 'assignment', 'discussion_prompt', 'download'));
alter table course_lessons add column if not exists required boolean not null default true;
alter table course_lessons add column if not exists quiz_id uuid references quizzes(id) on delete set null;
-- One quiz instance per course activity for V1 - without this, the same
-- quiz_id could be attached to more than one course_lessons row, making
-- "which course/lesson does this quiz belong to" (needed for every
-- entitlement and completion check) ambiguous. A future standalone/shared
-- quiz (reused across multiple places) is explicitly out of scope for now;
-- that would need the API to take an explicit lesson/context id alongside
-- quizId, not just quizId alone.
create unique index course_lessons_quiz_id_unique on course_lessons (quiz_id) where quiz_id is not null;

alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_options enable row level security;
-- Deliberately NO select policy on these three tables beyond what
-- admin_content_policies.sql grants admins - quiz_options.is_correct and
-- quiz_questions.accepted_answers/case_sensitive must never be directly
-- queryable by a learner (would leak answers). Every learner-facing read
-- goes through GET /api/quizzes/[quizId], which strips those fields - same
-- reasoning as why premium course_lessons content is only ever served
-- through /api/content/access rather than direct RLS reads.

alter table quiz_attempts enable row level security;
create policy "own_rows" on quiz_attempts for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- quiz_answers and quiz_attempt_questions both have no user_id column of
-- their own, so their own_rows policies join through quiz_attempts instead
-- of a direct auth.uid() = user_id.
alter table quiz_answers enable row level security;
create policy "own_rows" on quiz_answers for all to authenticated
  using (exists (select 1 from quiz_attempts a where a.id = quiz_answers.attempt_id and a.user_id = auth.uid()))
  with check (exists (select 1 from quiz_attempts a where a.id = quiz_answers.attempt_id and a.user_id = auth.uid()));

alter table quiz_attempt_questions enable row level security;
create policy "own_rows" on quiz_attempt_questions for all to authenticated
  using (exists (select 1 from quiz_attempts a where a.id = quiz_attempt_questions.attempt_id and a.user_id = auth.uid()))
  with check (exists (select 1 from quiz_attempts a where a.id = quiz_attempt_questions.attempt_id and a.user_id = auth.uid()));
