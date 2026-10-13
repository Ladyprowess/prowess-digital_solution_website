-- Lets Learn carry courses made by other creators alongside Prowess Digital
-- Solutions' own, the same way the resource library already does.
--
-- A curated course is a real course page on our site - same layout, same
-- badges, same skills - whose lessons live on the creator's own platform.
-- external_url is where the learner is sent; creator_name is who gets the
-- credit; creator_url points at their channel or profile.
--
-- Safe to run more than once. RUN THIS BEFORE DEPLOYING THE CODE: Postgres
-- rejects a select naming a column that does not exist, so the Learn pages
-- ask for these and fall back without them until the migration lands.

alter table courses add column if not exists source text not null default 'prowess';
alter table courses add column if not exists external_url text;
alter table courses add column if not exists creator_name text;
alter table courses add column if not exists creator_url text;

-- Everything already in the table is our own work.
update courses set source = 'prowess' where source is null;
