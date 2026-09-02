-- Learn LMS: Assignments - learner submissions (required text + optional
-- file), admin grading, and an independent peer-review requirement. Makes
-- course_completion_rules.require_assignments / .require_peer_reviews real
-- (previously schema-only, silently ignored by the evaluator - see
-- evaluate.ts's require_assignments/require_peer_reviews wiring).
--
-- Run after supabase/course_quizzes.sql, supabase/accounts_schema.sql and
-- supabase/certificates.sql.

create table assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instructions text not null,
  -- Optional combined auto-graded component - see resolveQuizAccess()'s
  -- "assignment_quiz" context in src/lib/quizzes/access.ts for how access
  -- and completion actually branch on this. Deliberately not enforced
  -- unique against course_lessons.quiz_id at the DB level (no clean
  -- cross-table constraint) - the admin save handlers validate this
  -- server-side instead (see src/app/admin/learn).
  quiz_id uuid references quizzes(id) on delete set null,
  allow_file_upload boolean not null default true,
  -- Not every assignment needs peer review - without this, the UI can't
  -- tell an instructor-only assignment from a peer-reviewed one.
  peer_review_enabled boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Submission text is ALWAYS required per product scope ("required text +
-- optional file") - deliberately no submission_text_required toggle here,
-- that would let an admin contradict the confirmed rule.

alter table course_lessons add column if not exists assignment_id uuid references assignments(id) on delete set null;
create unique index course_lessons_assignment_id_unique on course_lessons (assignment_id) where assignment_id is not null;

alter table course_completion_rules
  add column if not exists required_peer_review_count int not null default 1
    check (required_peer_review_count > 0);
-- Deliberately course-wide, not per-assignment: "review N submissions
-- ANYWHERE in this course with peer review enabled," not "review N per
-- assignment." Simpler evaluator - stated explicitly here so the admin UI
-- and AssignmentRunner's copy never implies a per-assignment count.

create table assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  -- Denormalized for queries; NEVER trusted as authority for anything
  -- that affects completion/credentials - the grading route re-derives
  -- course/lesson from assignment_id -> course_lessons -> course_modules
  -- and cross-checks this column, failing closed on any mismatch.
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  submission_text text not null check (char_length(trim(submission_text)) between 1 and 4000),
  file_path text,   -- private storage path (assignment-submissions bucket), never a public URL
  file_name text,
  status text not null default 'submitted' check (status in ('submitted', 'graded', 'superseded')),
  score_percent int check (score_percent between 0 and 100),
  passed boolean,
  feedback text,
  graded_at timestamptz,
  graded_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- "Active" = status in ('submitted','graded') is used CONSISTENTLY
-- everywhere in this feature (this index, the evaluator, the grading
-- route's stale-check, the peer-review eligibility queries) - never
-- "latest by submitted_at" in one place and this definition in another.
create unique index assignment_submissions_one_active on assignment_submissions (assignment_id, user_id) where status in ('submitted', 'graded');
create index assignment_submissions_grading_queue_idx on assignment_submissions (course_id, submitted_at) where status = 'submitted';

-- Independent, non-grading requirement. A review that already happened
-- stays counted even if the reviewed submission is later superseded by a
-- resubmission (the reviewer genuinely did the work at the time) -
-- deliberate, not a gap.
create table assignment_peer_reviews (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  reviewer_user_id uuid not null references auth.users(id) on delete cascade,
  submission_id uuid not null references assignment_submissions(id) on delete cascade,
  rating smallint check (rating between 1 and 5),
  feedback text not null check (char_length(trim(feedback)) between 1 and 4000),
  created_at timestamptz not null default now(),
  unique (reviewer_user_id, submission_id)
);
create index assignment_peer_reviews_course_reviewer_idx on assignment_peer_reviews (course_id, reviewer_user_id);

-- ============================================================
-- Atomic resubmission
-- ============================================================

-- Resubmission has two hazards a plain "update old, then insert new" JS
-- sequence doesn't close: (a) two near-simultaneous resubmits racing the
-- partial unique index, and (b) a STALE-BUT-STILL-"COMPLETE" lesson if the
-- learner had already been graded-passed before resubmitting - the old
-- row becomes superseded, but nothing else told lesson_completions /
-- learning_progress the assignment is no longer in a passed state. Both
-- handled here, in one transaction, called via .rpc() from
-- src/app/api/assignments/[assignmentId]/submissions/route.ts.
create or replace function submit_assignment(
  p_assignment_id uuid, p_course_id uuid, p_user_id uuid, p_lesson_id uuid,
  p_submission_text text, p_file_path text, p_file_name text
) returns uuid as $$
declare
  new_id uuid;
begin
  update assignment_submissions
    set status = 'superseded'
    where assignment_id = p_assignment_id and user_id = p_user_id and status in ('submitted', 'graded');

  begin
    insert into assignment_submissions (assignment_id, course_id, user_id, submission_text, file_path, file_name, status)
    values (p_assignment_id, p_course_id, p_user_id, p_submission_text, p_file_path, p_file_name, 'submitted')
    returning id into new_id;
  exception when unique_violation then
    raise exception 'A resubmission is already in progress - please try again.';
  end;

  -- A fresh submission is not graded yet - if the PREVIOUS submission had
  -- already been graded-passed and completed this lesson, that completion
  -- is now stale and must be cleared, not left showing "complete" while a
  -- new, ungraded submission sits in the queue.
  delete from lesson_completions where user_id = p_user_id and lesson_id = p_lesson_id;

  return new_id;
end;
$$ language plpgsql security invoker;
-- security invoker - the caller is always the service-role client (the
-- route verifies entitlement itself before calling this), so no RLS
-- interaction to worry about.

-- ============================================================
-- RLS
-- ============================================================

-- None of this content is public/SEO-visible like Community's - it's all
-- entitlement-gated private learner content, so there's no
-- "published_read" analogue anywhere here.

alter table assignments enable row level security;
alter table assignment_submissions enable row level security;
alter table assignment_peer_reviews enable row level security;

-- Learners read assignment prompts through resolveAssignmentAccess() + a
-- GET route, exactly like quizzes (which also have no authenticated
-- select policy) - assignments gets no select policy for authenticated at all.

create policy "own_read" on assignment_submissions for select to authenticated using (auth.uid() = user_id);
-- No insert/update policy for authenticated - submitting goes through the
-- API route (entitlement + the atomic RPC above); grading goes through
-- the admin API route (needs the evaluateCourseCompletion cascade). Both
-- use supabaseAdmin(), bypassing RLS for the write.

-- Reviewer can see their OWN authored reviews directly (no anonymity
-- concern - it's their own action, their own reviewer_user_id).
create policy "own_authored_read" on assignment_peer_reviews for select to authenticated using (auth.uid() = reviewer_user_id);

-- Deliberately NO "received reviews" RLS policy for the submission owner.
-- A direct table policy can only include/exclude whole ROWS, not
-- columns - and reviewer_user_id must never reach the reviewed learner
-- (anonymity is a stated product requirement). Reviews-received-on-my-
-- submission are instead served by /api/assignments/[assignmentId]
-- (GET), which explicitly selects only {rating, feedback, created_at}
-- via supabaseAdmin() and never includes reviewer_user_id in the response.

-- ============================================================
-- Storage
-- ============================================================

-- Private bucket, matching the CV Checker's privacy level (personal
-- submitted work), not the portfolio builder's public-media bucket.
-- Upload and signed-URL minting both happen server-side only via
-- supabaseAdmin() - no anon/authenticated storage policy.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assignment-submissions', 'assignment-submissions', false, 15728640,
  array[
    'application/pdf', 'application/zip', 'text/plain',
    'image/jpeg', 'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

-- File lifecycle note: FK cascades above clean up rows, not storage
-- objects - deleting an assignment/course/account leaves its submitted
-- files in the bucket. Deliberately deferred rather than built now:
-- cascading deletes here are rare admin-initiated actions, and cleaning
-- up the resulting orphaned storage objects is a fine candidate for a
-- later maintenance pass, not part of this build.
