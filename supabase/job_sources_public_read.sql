-- job_sources previously had zero anon/authenticated read policies, making
-- it invisible to the public site entirely - fine while nothing public
-- needed it, but the job detail page's source-transparency footer ("Job
-- source: We Work Remotely - Apply on original website") needs to read
-- name/source_type through the same anon client the rest of the page
-- already use. None of this table's columns are actually sensitive (the
-- feed URLs it imports from are themselves public data sources), so a
-- plain public read policy - the same pattern companies already uses - is
-- the right fix rather than routing one field through a separate client.

create policy "public_read" on job_sources for select to anon, authenticated using (true);
