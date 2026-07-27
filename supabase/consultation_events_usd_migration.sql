-- Convert consultation bookings and event registrations from NGN to USD
-- pricing, per the owner's instruction to use a fixed rate of 2000 NGN = $1
-- for converting existing stored prices.
--
-- Old *_ngn columns are left untouched as a historical record - never
-- backfilled again, never written to going forward. New price_usd/amount_usd
-- columns are what the app reads and writes from here on.

alter table consultation_services
  add column if not exists price_usd numeric;

update consultation_services
  set price_usd = round(price_ngn / 2000.0, 2)
  where price_usd is null and price_ngn is not null;

alter table consultation_bookings
  add column if not exists amount_usd numeric;

update consultation_bookings
  set amount_usd = round(amount_ngn / 2000.0, 2)
  where amount_usd is null and amount_ngn is not null;

alter table events
  add column if not exists price_usd numeric;

update events
  set price_usd = round(price_ngn / 2000.0, 2)
  where price_usd is null and price_ngn is not null;
