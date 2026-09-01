create table if not exists cv_checker_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  target_role text not null,
  career_level text not null,
  review_focus text,
  cv_file_path text not null,
  cv_file_name text not null,
  cv_file_type text not null,
  cv_file_size integer not null,
  status text not null default 'submitted' check (status in ('submitted', 'in_review', 'completed', 'archived')),
  source text not null default 'tools_page',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cv_checker_submissions_email_idx on cv_checker_submissions (email);
create index if not exists cv_checker_submissions_status_idx on cv_checker_submissions (status);
create index if not exists cv_checker_submissions_created_at_idx on cv_checker_submissions (created_at desc);

alter table cv_checker_submissions enable row level security;
-- Service-role only for now. Users submit through /api/cv-checker and admins
-- receive notifications by email while the review process remains manual.

-- Private bucket for uploaded CV files - /api/cv-checker/route.ts uploads
-- here and mints a signed URL (7-day expiry) for the admin notification
-- email. Not public: these are personal documents, same privacy level as
-- the `resources` bucket, not the genuinely-public `resource-mockups` one.
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

-- Service-role only, matching the table above - no anon/authenticated
-- storage policy. Uploads and signed-URL minting both happen server-side
-- via the service-role client in /api/cv-checker/route.ts.
