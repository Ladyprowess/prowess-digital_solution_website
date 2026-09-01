-- Interview Prep: a static, admin-authored question library (no AI, no
-- submissions) - same content-library shape as Resources/Career Paths.
-- Gated by Premium Membership, checked via hasPremiumAccess() - see
-- src/app/api/interview-prep/route.ts.
create table if not exists interview_questions (
  id uuid primary key default gen_random_uuid(),
  role_category text not null,
  question text not null,
  answer_tips text not null,
  difficulty text not null default 'general' check (difficulty in ('general', 'entry', 'mid', 'senior')),
  position integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interview_questions_category_idx on interview_questions (role_category);
create index if not exists interview_questions_status_idx on interview_questions (status);

alter table interview_questions enable row level security;
-- No public/anon policy - this is gated content. Content is only ever
-- served through /api/interview-prep, which checks career-tool/Premium
-- access with the service-role client before returning anything, the same
-- pattern as /api/content/access for premium resources. Admin write access
-- goes through the existing admin_full_access policy loop (add
-- 'interview_questions' to that array in admin_content_policies.sql).
