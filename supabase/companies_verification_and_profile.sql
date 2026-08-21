-- Adds admin-controlled verification and optional profile fields to
-- companies. "Verified" must only ever be set by an admin -- the public
-- job card/detail page should never show it based on anything else.

alter table companies add column if not exists verified boolean not null default false;
alter table companies add column if not exists industry text;
alter table companies add column if not exists company_size text;
