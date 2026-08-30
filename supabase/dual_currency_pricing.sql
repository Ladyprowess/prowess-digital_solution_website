-- Lets every priced item on the site carry both a USD and an NGN price, so
-- the customer can pick a currency at checkout. Additive only - the old
-- price/price_currency columns (and events.price_usd) are left untouched,
-- so anything that only has the old fields set keeps working exactly as
-- before until an admin fills in both new fields. Same "leave the old
-- columns alone" precedent as consultation_events_usd_migration.sql, just
-- run in the opposite direction (splitting back into two currencies instead
-- of consolidating into one).

alter table resources add column if not exists price_usd numeric;
alter table resources add column if not exists price_ngn numeric;

alter table courses add column if not exists price_usd numeric;
alter table courses add column if not exists price_ngn numeric;

alter table career_paths add column if not exists price_usd numeric;
alter table career_paths add column if not exists price_ngn numeric;

alter table events add column if not exists price_ngn numeric;

-- consultation_services.price_ngn and consultation_bookings.amount_ngn
-- already exist from before the USD-only consolidation - nothing to add
-- there, the application code just needs to start writing to them again.

alter table consultation_bookings add column if not exists currency text not null default 'USD';

alter table membership_subscriptions add column if not exists currency text not null default 'USD';
alter table membership_subscriptions add column if not exists amount_ngn numeric;

alter table skill_to_business_purchases add column if not exists currency text not null default 'USD';
alter table skill_to_business_purchases add column if not exists amount_ngn numeric;

-- payment_plans caches one Flutterwave recurring-plan id per (tier,
-- interval) today - a USD and an NGN plan for the same tier/interval would
-- collide on that key, so currency has to become part of the primary key,
-- not just a plain column.
alter table payment_plans add column if not exists currency text not null default 'USD';
alter table payment_plans drop constraint if exists payment_plans_pkey;
alter table payment_plans add primary key (provider, slug, interval, currency);
