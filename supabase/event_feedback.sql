-- Events: post-event feedback and reviews.
--
-- Visitors can submit feedback after an event has ended through
-- /api/events/feedback. Public event pages only show approved feedback.
-- Admins manage moderation from /admin/events/[id]/feedback.

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists event_feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  attendee_name text not null check (char_length(trim(attendee_name)) between 1 and 120),
  attendee_email text not null check (position('@' in attendee_email) > 1 and char_length(trim(attendee_email)) <= 254),
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(trim(body)) between 1 and 4000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, attendee_email)
);

create index if not exists event_feedback_event_status_idx on event_feedback (event_id, status, created_at desc);
drop trigger if exists event_feedback_set_updated_at on event_feedback;
create trigger event_feedback_set_updated_at before update on event_feedback for each row execute function set_updated_at();

alter table event_feedback enable row level security;

drop policy if exists "approved_public_read" on event_feedback;
create policy "approved_public_read" on event_feedback for select to anon, authenticated
  using (
    status = 'approved'
    and exists (
      select 1
      from events e
      where e.id = event_feedback.event_id
        and e.status = 'published'
    )
  );

drop policy if exists "admin_full_access" on event_feedback;
create policy "admin_full_access" on event_feedback
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
