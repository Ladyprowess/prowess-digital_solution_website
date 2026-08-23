-- Lets an admin turn off the "Download" link on a resource's page,
-- independent of how its content is displayed (written text or embedded
-- PDF) -- some resources should only be readable on the site, not
-- downloadable as a raw file.
--
-- Default true is backward compatible: every existing resource keeps
-- showing its download link exactly as it does today until an admin
-- explicitly turns it off.
alter table resources add column if not exists allow_download boolean not null default true;
