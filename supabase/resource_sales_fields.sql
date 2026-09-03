-- Adds resource detail page copy fields so each paid/free resource can
-- explain its value with admin-written content instead of generic fallback
-- blocks in the public UI.
--
-- Safe to run more than once.

alter table resources add column if not exists what_you_get text;
alter table resources add column if not exists who_is_this_for text;
alter table resources add column if not exists key_outcomes text;
alter table resources add column if not exists preview_note text;

-- A contents list the admin writes by hand, one entry per line, optionally
-- with the page it starts on: "Why branding matters | 3". Deliberately
-- separate from the rich-text content field so a resource that is only a
-- PDF can still show a proper contents list without anyone retyping the
-- document as text.
alter table resources add column if not exists table_of_contents text;
