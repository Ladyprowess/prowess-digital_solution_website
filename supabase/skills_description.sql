-- Optional blurb for the "Learn by Skill" cards on /learn. Nullable - when
-- an admin hasn't written one, the card falls back to a computed
-- "N courses · N resources" count instead of an invented description.

alter table skills add column if not exists description text;
