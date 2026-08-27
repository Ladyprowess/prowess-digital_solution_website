-- The link sent to a registrant after they sign up (e.g. a WhatsApp group,
-- Zoom/Meet link, or community invite) - distinct from registration_url,
-- which is an external link used BEFORE registration instead of this site's
-- own form. Nullable: most events won't set one, and the confirmation email
-- just omits the "join" button when it's empty.
alter table public.events add column if not exists join_link text;
