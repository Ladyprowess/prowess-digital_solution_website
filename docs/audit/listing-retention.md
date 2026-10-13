# Automatic listing deletion

Applies to jobs and opportunities. The owner requested removal rather than retaining closed listings. Past events and other content are not included pending scope confirmation.

Apply `supabase/auto_delete_closed_listings.sql` in the Supabase SQL Editor as the database owner. It creates the pg_cron extension/schedule and performs the first deletion in the same transaction. The named task runs once daily using `0 0 * * *`: midnight in the cron scheduler timezone, or 01:00 Africa/Lagos when cron uses its default UTC timezone. Listings that close between runs are deleted at the next daily run. Reapplying updates the named schedule rather than creating a second task.

Deletion criteria: status closed or expired, or published with deadline_at or expires_at at or before the database clock. Drafts and open listings without a known closing time remain. External websites changing status cannot be detected from these fields alone. Existing timestamps are respected; newly saved date-only deadlines use 23:59:59.999 Africa/Lagos.

Deletion removes listing content, cascading skill mappings, and saved-item links. Personal application notes remain with a null job_id. Shared companies, taxonomies, courses, purchases and event registrations are not deleted. A source-ID fingerprint, without listing content, prevents imports from recreating deleted external listings. Database/provider backups follow their own retention policies.

The two importers handle a suppressed reimport as skipped, not as a new imported listing. Deploy their code changes alongside the migration. Deleted detail URLs naturally return not found when read from the database; previously cached pages may persist until their cache is refreshed. No redirects to unrelated pages are added.

Validation: isolated PostgreSQL tests passed for closed status, elapsed deadline, elapsed expiry, future/open/draft preservation, repeated cleanup, deletion of saved and skill mappings, personal-note preservation, import suppression and denied anonymous function execution. The local test stubbed cron.schedule; production scheduling requires pg_cron to be available and the migration to succeed.

Activation status: not applied to production. Supabase CLI has no access token and no database connection credential was available in the checkout. After application, verify the named entry in cron.job and successful runs in cron.job_run_details. Do not interpret the migration file alone as an active production schedule.
