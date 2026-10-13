# Local payment review — 14 October 2026

No live charges, subscription changes or outbound emails were performed.

## Fixed

- Tool-data reads and writes now enforce the access code's allowed tool list, matching code verification. Legacy unrestricted codes retain their existing behaviour.
- Both subscription types ignore duplicate failure notifications once lapsed and guard the database update against concurrent cancellation. Only the update winner sends the failure notice.
- Cancellation emails no longer assume that every cancellation resulted from payment failure.
- Non-string access-code input is rejected rather than throwing while normalising it.

## Local verification

17 payment-integrity tests pass, including verified amount/currency/customer/order matching, rejected metadata, failed grants, callback races, webhook authentication/retry response, pending checkout reuse, duplicate renewal failures and tool scope enforcement. Scoped ESLint and TypeScript passed.

## Remaining limitations and release checks

- Actual provider webhook signature scheme, renewal metadata, transaction-reference behaviour and subscription-resource IDs need test-mode payload verification. Cancellation resolution includes plan/email fallback; ambiguous matches and lookup errors currently need operational reconciliation.
- Subscription failure processing does not yet maintain a provider event ledger. Out-of-order old failure events arriving after recovery remain a risk; the duplicate-failure guard is not full chronological reconciliation.
- Business membership codes currently have a one-year expiry; successful recurring charges do not extend it. Decide how expiry should follow paid billing periods before claiming indefinite recurring tool access.
- Cancellation currently ends new premium access immediately, rather than at paid-period end. Confirm this matches customer terms. Existing premium CV preservation is intentional.
- The account does not provide a provider cancellation API in this code. Verify and communicate the actual support/provider cancellation route.
- Confirm payment_integrity.sql and applicable subscription unique indexes are applied in the deployed database.
- Test NGN and USD separately: success, failed/cancelled checkout, duplicate callback, renewal failure, recovery, cancellation, and access on each included/excluded tool.
- Verify receipt delivery and the customer-visible payment history. Paid status alone does not prove an email reached the inbox.

This is a local review with targeted fixes, not certification of the live billing system.
