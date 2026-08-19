create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_created_at_idx
  on public.messages (created_at desc);

-- Required so the dashboard's chat receives new messages live instead of only
-- on page refresh. If this errors because the table is already in the
-- publication, that's fine - ignore it.
alter publication supabase_realtime add table public.messages;
