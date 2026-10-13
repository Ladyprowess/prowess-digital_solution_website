-- Jobs/opportunities only. Run as database owner in Supabase SQL Editor.
-- Deletes existing closed/expired listings immediately, then daily at 00:00 UTC (01:00 Africa/Lagos with the default UTC cron timezone).
-- No listing-content archive. Fingerprints prevent imported records returning.
begin;
create extension if not exists pg_cron;

create table if not exists public.retired_listing_keys (
  fingerprint text primary key
);
alter table public.retired_listing_keys enable row level security;
revoke all on public.retired_listing_keys from anon, authenticated;

-- Listing removal must not cascade into a member's personal application notes.
alter table public.applications alter column job_id drop not null;
alter table public.applications drop constraint if exists applications_job_id_fkey;
alter table public.applications add constraint applications_job_id_fkey
  foreign key (job_id) references public.jobs(id) on delete set null;

create or replace function public.cleanup_deleted_listing()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.saved_items
  where item_type = case when TG_TABLE_NAME = 'jobs' then 'job' else 'opportunity' end
    and item_id = OLD.id;
  if OLD.external_id is not null and OLD.source_id is not null then
    insert into public.retired_listing_keys(fingerprint)
    values (md5(TG_TABLE_NAME || ':' || OLD.source_id::text || ':' || OLD.external_id))
    on conflict do nothing;
  end if;
  return OLD;
end;
$$;

create or replace function public.prevent_retired_listing_import()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if NEW.external_id is not null and NEW.source_id is not null and exists (
    select 1 from public.retired_listing_keys
    where fingerprint = md5(TG_TABLE_NAME || ':' || NEW.source_id::text || ':' || NEW.external_id)
  ) then
    return null;
  end if;
  return NEW;
end;
$$;

create or replace function public.delete_closed_listings()
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.jobs where status in ('closed','expired')
    or (status = 'published' and (deadline_at <= now() or expires_at <= now()));
  delete from public.opportunities where status in ('closed','expired')
    or (status = 'published' and (deadline_at <= now() or expires_at <= now()));
end;
$$;
revoke all on function public.delete_closed_listings() from public, anon, authenticated;
revoke all on function public.cleanup_deleted_listing() from public, anon, authenticated;
revoke all on function public.prevent_retired_listing_import() from public, anon, authenticated;

create or replace trigger jobs_cleanup_after_delete after delete on public.jobs
for each row execute function public.cleanup_deleted_listing();
create or replace trigger opportunities_cleanup_after_delete after delete on public.opportunities
for each row execute function public.cleanup_deleted_listing();
create or replace trigger jobs_prevent_retired_import before insert on public.jobs
for each row execute function public.prevent_retired_listing_import();
create or replace trigger opportunities_prevent_retired_import before insert on public.opportunities
for each row execute function public.prevent_retired_listing_import();

select cron.schedule('delete-closed-listings', '0 0 * * *', 'select public.delete_closed_listings()');
select public.delete_closed_listings();
commit;
