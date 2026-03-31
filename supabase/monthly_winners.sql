create table if not exists public.monthly_winners (
  id uuid primary key default gen_random_uuid(),
  month text not null unique,
  winner_id uuid not null references public.profiles(id) on delete cascade,
  winner_name text not null,
  total_points integer not null default 0,
  tasks_completed integer not null default 0,
  logs_submitted integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists monthly_winners_month_idx
  on public.monthly_winners (month desc);
