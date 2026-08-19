-- General-purpose subscriber list for the whole Prowess Digital Solutions
-- ecosystem (job alerts, opportunities, courses, events, general updates),
-- replacing the events-only event_subscribers table used by /api/subscribe.
--
-- preferences is a single jsonb object of booleans, e.g.
--   {"jobs": true, "internships": true, "events": true}
-- so one email can hold multiple interests instead of needing a separate
-- table per audience type. /api/subscribe reads the existing row, merges
-- the new preference key in, and upserts the whole object back.
--
-- filters is reserved for saved job-search criteria (category, location,
-- remote, keywords) once /jobs exists and a user wants to save a search as
-- an alert -- not written to by anything yet.

create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  preferences jsonb not null default '{}'::jsonb,
  filters jsonb,
  source text,          -- e.g. 'homepage-launch', 'homepage-final-cta', 'footer', 'events_page'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists newsletter_subscribers_email_idx on newsletter_subscribers (email);

-- Backfill from the old events-only table, tagging everyone as interested
-- in events since that's the only thing they signed up for at the time.
insert into newsletter_subscribers (email, preferences, source, created_at)
select email, jsonb_build_object('events', true), 'events_page', created_at
from event_subscribers
on conflict (email) do update
  set preferences = newsletter_subscribers.preferences || excluded.preferences;

-- event_subscribers itself is left in place (not dropped) so nothing else
-- referencing it breaks; it's just no longer written to going forward.

alter table newsletter_subscribers enable row level security;

-- Only the server (service role, which bypasses RLS) ever reads or writes
-- this table today -- /api/subscribe is the only caller. No anon/authenticated
-- policies are added, which means the anon key gets zero access by default.
