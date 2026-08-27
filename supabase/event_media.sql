-- Per-event archive: photos and YouTube recordings from a past event, added
-- by the admin. No RLS here, matching the existing (unprotected) precedent
-- on events/event_registrations - neither of those tables has RLS enabled
-- either, so the admin pages already read/write them directly with the
-- anon-key client. This table follows the same pattern rather than
-- inventing a new security model for just this one feature.
create table if not exists event_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  url text not null, -- Storage public URL for images, YouTube URL for videos
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists event_media_event_id_idx on event_media(event_id);
