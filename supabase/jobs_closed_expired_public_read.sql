-- A closed or expired job was public until recently -- rather than making
-- its URL 404 identically to a slug that never existed, the detail page
-- renders a "no longer accepting applications" state. That requires the
-- anon/authenticated read policy to allow closed/expired rows too (still
-- read-only, still no draft exposure).

create policy "public_read_closed_expired" on jobs
  for select to anon, authenticated using (status in ('closed', 'expired'));
