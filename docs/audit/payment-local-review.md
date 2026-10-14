# Local payment review — 14 October 2026

No live charges, subscription changes or outbound emails were performed.

## Fixed

- Tool-data reads and writes now enforce the access code's allowed tool list, matching code verification. Legacy unrestricted codes retain their existing behaviour.
- Both subscription types reconcile charge events under a database row lock with a persistent event ledger. Duplicate and older failures cannot undo a newer successful renewal. Only a changed failure state sends a notice.
- Verified recurring charges set paid-through dates; business tool grants are created in the same transaction and extended on renewal without shortening existing grants.
- Cancellation stops renewal while preserving paid access. A verified late payment can extend paid access without reactivating renewal. Legacy paid periods are recovered from verified charges before cancellation.
- Account membership shows paid expiry and the provider-email cancellation route, with a support link.
- Cancellation resolution accepts nested provider plan IDs and retries lookup failures or ambiguous matches rather than silently acknowledging them.
- Cancellation emails no longer assume that every cancellation resulted from payment failure.
- Non-string access-code input is rejected rather than throwing while normalising it.

## Local verification

18 payment-integrity tests pass, including verified amount/currency/customer/order matching, rejected metadata, failed grants, callback races, webhook authentication/retry response, pending checkout reuse, duplicate renewal failures and tool scope enforcement. Scoped ESLint and TypeScript passed.

## Remaining limitations and release checks

- Actual provider webhook signature scheme, renewal metadata, transaction-reference behaviour and subscription-resource IDs need test-mode payload verification. Cancellation resolution includes plan/email fallback; ambiguous matches and lookup errors currently need operational reconciliation.
- Legacy premium rows without paid-through dates retain their existing active entitlement until a verified charge or cancellation reconciles them. Backfill from verified provider history before relying on expiry for all historical rows.
- Existing business tool grants retain their previously promised expiry; monthly billing does not retroactively shorten an existing one-year grant.
- Cancellation is via the provider email or support; this change does not add a self-service provider cancellation API. Confirm email cancellation links are enabled in Flutterwave settings.
- Notification delivery is not transactionally queued: provider failures after a committed payment may require manual resend. No inbox-delivery guarantee is made.
- Confirm payment_integrity.sql and applicable subscription unique indexes are applied in the deployed database.
- Test NGN and USD separately: success, failed/cancelled checkout, duplicate callback, renewal failure, recovery, cancellation, and access on each included/excluded tool.
- Verify receipt delivery and the customer-visible payment history. Paid status alone does not prove an email reached the inbox.

This is a local review with targeted fixes, not certification of the live billing system.

## Database regression checks

`tests/recurring-billing.sql` passed on an isolated PostgreSQL 14 database with minimal fixtures for both subscription types: month-end dates, annual leap-day dates, duplicate payments, failure/recovery ordering, cancellation with a late charge, tool expiry, legacy recovery, and denied RPC access for client roles. Fixtures roll back. This is not a full production-schema integration test.

## Release order

1. Apply `supabase/payment_integrity.sql` and the existing subscription/tool-scope schema prerequisites.
2. Apply `supabase/recurring_billing_integrity.sql` **before** deploying this application change; both payment handlers now require its RPC and columns.
3. Deploy and exercise test-mode initial payment, renewal, failure, recovery and cancellation in NGN and USD. Successful recurring charges still require verified subscription metadata; confirm that the provider preserves it. Unknown successful charge types are not automatically assigned to a customer.
4. Confirm tool access, paid expiry, preserved CVs and actual email delivery before enabling live traffic.
