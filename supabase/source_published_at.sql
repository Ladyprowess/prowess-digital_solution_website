-- Every external job/opportunity source currently imports as a draft
-- (job_sources.auto_publish is false for all of them) - an admin reviews
-- and publishes later, at which point published_at was being set to
-- *that* moment (now()), not when the listing actually went live on the
-- site it came from. This column captures the source's real posting date
-- at import time so it survives the import -> draft -> eventual publish
-- gap and can be used instead of "now" when an admin publishes.
--
-- Nullable: manually created listings (source "manual") have no external
-- source date, and some feeds don't expose one either - those keep using
-- publish-time as today, no worse than before.
alter table jobs add column if not exists source_published_at timestamptz;
alter table opportunities add column if not exists source_published_at timestamptz;
