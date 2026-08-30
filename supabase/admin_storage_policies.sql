-- Lets an admin (profiles.role = 'admin') upload/replace/delete files
-- directly from the browser into the resources/resource-covers buckets,
-- using their own authenticated session (anon key + RLS) instead of
-- routing the raw file bytes through a Next.js API route first.
--
-- That server-route detour is what broke real ebook uploads: Vercel caps
-- a serverless function's request body at ~4.5MB, so any PDF bigger than
-- that failed with FUNCTION_PAYLOAD_TOO_LARGE before our code ever ran,
-- and the client tried to JSON-parse Vercel's plain-text error response
-- ("Unexpected token 'R', \"Request En\"... is not valid JSON"). Uploading
-- straight from the browser to Supabase Storage bypasses that Vercel
-- function entirely, so file size is limited only by Supabase's own
-- project-level storage limit, not Vercel's request body cap.
--
-- Mirrors admin_content_policies.sql's exact admin_full_access logic, just
-- on storage.objects (a separate RLS table from the ones already covered
-- there). Uses its own distinct policy name rather than reusing
-- "admin_full_access" -- storage.objects is shared across every bucket in
-- the project (case-studies, events, event-covers, etc.), and a
-- differently-scoped policy under that same name may already exist there;
-- dropping/replacing it blindly could silently break admin access to
-- buckets this migration was never meant to touch.
drop policy if exists "admin_resources_storage_access" on storage.objects;
create policy "admin_resources_storage_access" on storage.objects
  for all to authenticated
  using (
    bucket_id in ('resources', 'resource-covers', 'resource-mockups')
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    bucket_id in ('resources', 'resource-covers', 'resource-mockups')
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
