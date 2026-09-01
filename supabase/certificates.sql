-- Learn LMS, Phase 2: course completion (its own durable fact) +
-- certificates (an optional, separate credential issued on top of it).
-- See the "Learn LMS - Phase 2: Credentials" plan for the full design.
--
-- Run after supabase/course_quizzes.sql (Phase 1).

-- The durable "did this learner complete this course" fact - separate
-- from certificates on purpose. A future Achievement phase's points/
-- badges key off THIS table, not off certificate issuance, since a
-- course can be fully completed with certificates turned off entirely.
create table course_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, course_id)
);
alter table course_completions enable row level security;
create policy "own_read" on course_completions for select to authenticated using (auth.uid() = user_id);
-- Same "no write policy for authenticated" shape as certificates below -
-- only the service-role evaluator (src/lib/certificates/evaluate.ts)
-- ever writes this.

create table certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- SET NULL, not CASCADE: a certificate is a public credential someone
  -- may have already shared/printed. course_title is snapshotted
  -- specifically so it keeps meaning something even if the source course
  -- is later deleted - a hard-delete cascade would silently 404 every
  -- verification link for a credential that already stands. user_id stays
  -- CASCADE (matches this codebase's account-deletion convention
  -- everywhere else, e.g. quiz_attempts) - deleting your own account
  -- takes your certificates' verifiability with it, the accepted norm
  -- here, not a new decision specific to this table.
  course_id uuid references courses(id) on delete set null,
  verification_code text not null unique,
  learner_name text not null,   -- snapshot at issue time (member_profiles.full_name - no email fallback, see evaluate.ts)
  course_title text not null,   -- snapshot at issue time
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)   -- one certificate per course per learner, ever - deliberate
);

alter table certificates enable row level security;
-- Owner can READ their own certificates (Account -> Certificates page uses
-- this directly, matching every other dashboard list in this codebase).
-- Deliberately NO insert/update/delete policy for authenticated users -
-- certificates are only ever written by the service-role evaluator,
-- never directly by a learner, which would otherwise let someone
-- fabricate their own certificate. Also no public/anon select policy -
-- the verify page uses supabaseAdmin() as its only client (no public RLS
-- policy exists to lean on instead).
create policy "own_read" on certificates for select to authenticated using (auth.uid() = user_id);

-- final_assessment_quiz_id (on course_completion_rules, created in
-- Phase 1) had no explicit on-delete behavior, which defaults to
-- blocking the delete of a referenced quiz. Made explicit here: a
-- deleted quiz clears the pointer rather than blocking deletion, and the
-- evaluator treats require_final_assessment=true with a null
-- final_assessment_quiz_id as unsatisfiable (never as "satisfied"), so a
-- quiz disappearing out from under a rule fails closed instead of
-- silently passing.
alter table course_completion_rules
  drop constraint if exists course_completion_rules_final_assessment_quiz_id_fkey,
  add constraint course_completion_rules_final_assessment_quiz_id_fkey
    foreign key (final_assessment_quiz_id) references quizzes(id) on delete set null;
