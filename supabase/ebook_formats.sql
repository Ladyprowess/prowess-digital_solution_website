-- Format-specific pricing, additive alongside the existing price_usd/price_ngn.
-- Only meaningful for resource_type = 'ebook'; every other resource type
-- ignores these and keeps using price_usd/price_ngn exactly as today. An
-- ebook that never gets these set also keeps working on price_usd/price_ngn -
-- see getItemPrice in src/lib/payments/content.ts for the exact rule: once
-- any of these six is set, the plain price_usd/price_ngn stop being used for
-- checkout on that item entirely (not a fallback, a hard switch).
alter table resources add column if not exists price_read_usd numeric;
alter table resources add column if not exists price_read_ngn numeric;
alter table resources add column if not exists price_download_usd numeric;
alter table resources add column if not exists price_download_ngn numeric;
alter table resources add column if not exists price_hardcopy_usd numeric;
alter table resources add column if not exists price_hardcopy_ngn numeric;

-- Mockup images need to stay visible in a transactional email days after
-- purchase, which a signed URL can't do (the existing resource-covers
-- bucket is private - createSignedUrl gives it 20min-1hr, confirmed by
-- reading src/app/api/resources/route.ts and resources/[slug]/page.tsx -
-- so mockups get their own genuinely public bucket instead of reusing it.
-- The actual ebook files and cover images stay exactly as private as they
-- are today; this only adds a new bucket, nothing about the existing ones
-- changes.
insert into storage.buckets (id, name, public)
values ('resource-mockups', 'resource-mockups', true)
on conflict (id) do nothing;

drop policy if exists "public_read_resource_mockups_bucket" on storage.objects;
create policy "public_read_resource_mockups_bucket" on storage.objects
  for select
  using (bucket_id = 'resource-mockups');

-- Preview/mockup images, additive and separate from the existing single
-- cover_url/cover_path - same shape as event_media (the event archive
-- table built earlier this session).
create table if not exists resource_mockups (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id) on delete cascade,
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table resource_mockups enable row level security;
drop policy if exists "public_read_published" on resource_mockups;
create policy "public_read_published" on resource_mockups
  for select to anon, authenticated
  using (exists (select 1 from resources r where r.id = resource_mockups.resource_id and r.status = 'published'));

-- Which format was actually bought, and where to ship a hard copy.
-- Both nullable: every non-ebook purchase (and any ebook bought before this
-- shipped) simply has format = null, exactly like today.
alter table purchases add column if not exists format text check (format in ('read', 'download', 'hardcopy'));
alter table purchases add column if not exists shipping_full_name text;
alter table purchases add column if not exists shipping_phone text;
alter table purchases add column if not exists shipping_address text;
