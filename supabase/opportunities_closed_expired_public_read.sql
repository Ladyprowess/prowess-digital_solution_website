-- Same fix jobs needed: a closed/expired opportunity was public until
-- recently - rather than 404ing identically to a slug that never existed,
-- the detail page renders "Applications are closed". Requires the
-- anon/authenticated read policy to allow closed/expired rows too.

create policy "public_read_closed_expired" on opportunities
  for select to anon, authenticated using (status in ('closed', 'expired'));
