-- Lets an admin choose, per resource, whether the detail page shows the
-- written `content` field (with its table of contents) or instead embeds
-- the uploaded file itself so a visitor can scroll through it inline --
-- useful for a resource that's really just a PDF, where retyping it as
-- rich text would be pointless duplicate work.
--
-- Default 'text' is backward compatible: every existing resource keeps
-- rendering exactly as it does today until an admin explicitly switches it.
alter table resources add column if not exists content_display text
  check (content_display in ('text', 'pdf'))
  not null default 'text';
