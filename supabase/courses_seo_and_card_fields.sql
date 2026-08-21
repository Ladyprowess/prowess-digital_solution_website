-- Brings courses up to the same standard jobs/opportunities already have:
-- SEO overrides, plus the card-facing fields resources already has
-- (thumbnail_url, featured) that courses never got, plus a free-text
-- duration (too variably phrased for a rigid enum) and a dedicated
-- "what you'll learn" rich-text field, distinct from description.

alter table courses add column if not exists meta_title text;
alter table courses add column if not exists meta_description text;
alter table courses add column if not exists thumbnail_url text;
alter table courses add column if not exists featured boolean not null default false;
alter table courses add column if not exists duration_label text;
alter table courses add column if not exists what_youll_learn text;
