-- Adds a profile photo to member_portfolios. Project-level media
-- (coverImageUrl, videoUrl) lives inside the existing `projects` jsonb
-- column, so it needs no schema change - only the validator
-- (src/app/api/portfolio-builder/save/route.ts) and the UI know about it.
--
-- The portfolio-media storage bucket itself is created by the app at
-- runtime via the service-role client (supabase.storage.createBucket),
-- not here - bucket creation is a storage-API call, not DDL, and the app
-- can do it without needing this file run first. This file only needs to
-- be run for the photo_url column.

alter table member_portfolios add column if not exists photo_url text;
