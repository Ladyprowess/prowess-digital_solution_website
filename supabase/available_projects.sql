create table if not exists public.available_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  project text,
  priority text not null default 'medium',
  deadline date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  claimed_by uuid references public.profiles(id) on delete set null,
  claimed_at timestamptz,
  resulting_task_id uuid references public.tasks(id) on delete set null
);

create index if not exists available_projects_created_at_idx
  on public.available_projects (created_at desc);
