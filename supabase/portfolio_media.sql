-- Adds a profile photo to member_portfolios. Project-level media
-- (coverImageUrl, videoUrl) lives inside the existing `projects` jsonb
-- column, so it needs no schema change - only the validator
-- (src/app/api/portfolio-builder/save/route.ts) and the UI know about it.

alter table member_portfolios add column if not exists photo_url text;

-- Public bucket for profile photos and project cover images -
-- /api/portfolio-builder/upload/route.ts uploads here. Public (unlike the
-- `cvs` bucket), because the public portfolio page (/portfolio/[slug]) is
-- a signed-out server component that renders these images directly - a
-- signed URL wouldn't survive being cached on that page indefinitely.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-media', 'portfolio-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- Service-role only - no anon/authenticated storage policy. Uploads
-- happen server-side via the service-role client in the upload route
-- (which checks ownership and Portfolio Builder access before writing);
-- public reads work through the bucket's own `public` flag above, not an
-- RLS policy.
