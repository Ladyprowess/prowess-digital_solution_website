# Payment audit and repair status

13 October 2026. Code review and mocked regression tests, not a production payment certification. No real charges, cancellations, refunds or customer emails were made during this audit.

## Coverage

| Flow | Entry points reviewed | Repairs |
| --- | --- | --- |
| Resources, ebook formats, courses, career paths | Content checkout/verify, content fulfilment, entitlement checks, purchase return | Check published status; reject unavailable requested currency; save authenticated user ID and payment reference before checkout; bind verified reference, product type, purchase ID, buyer, amount and currency; escape receipt content |
| Business memberships | Membership checkout/verify, recurring helpers, tool grants | Save/check provider references before checkout; bind charge to subscription; prevent competing callbacks from sending duplicate first confirmations; persist a unique retryable tools grant; protect cancelled states and surface failed DB updates |
| Premium Membership | Premium checkout/verify, account membership page, access helper | Preserve pending order price/reference/link; prevent deletion of pending payments; block a new subscription while an existing one is lapsed; claim pending checkout atomically; require paid and active status for access |
| Skill to Business | Checkout/verify, fulfilment and tools | Bind verified charge to purchase and buyer; persist reference before checkout; deduplicate grant and first-confirmation race; stop payment completion when access provisioning fails |
| Consultations | Book, free confirm, paid verify, calendar/email fulfilment | Close unauthenticated paid-to-free mutation; use stored price/currency/reference rather than current service price; retry calendar work even after payment state is saved; deterministic calendar ID; claim email delivery and release on send failure; reject past dates and unsupported currencies |
| Events | Register, verify, webhook, payment return | Use one provider-verified reconciliation function; save price snapshot in provider metadata; reject draft/past-event registration; reject currency switching; process `tx_ref` redirect parameter; show network failures; enforce unique registration reference through SQL |
| Shared provider/webhook | Flutterwave transport, plan cache, webhook | Check returned reference and checkout URL; bound network timeout and disable fetch cache; price-version plan cache for new checkouts; constant-time shared-secret comparison; propagate reconciliation failures as HTTP 500 so retry is possible |

The Business Structure Diagnostic remains enquiry → suitability confirmation → payment instructions. It has no automatic diagnostic checkout and was not converted into a subscription.

## Required database migration

Apply `supabase/payment_integrity.sql` **before deploying** these code changes. It adds `checkout_url` for Premium pending checkouts, a unique tools-grant payment key, unique payment references for one-time purchases/bookings/registrations, and extends Premium duplicate-subscription protection to lapsed subscriptions.

The transaction intentionally fails if existing duplicate references or overlapping open Premium subscriptions conflict with the new indexes. Investigate those records against provider transactions; do not delete customer orders just to make the migration pass. The migration does not delete or reprice records. It has not been run against the production database during this audit.

Existing pending Premium checkouts without a saved checkout URL now require reconciliation/support rather than deleting the pending order and risking a second charge. New pending checkouts reuse their saved URL. An initialization interrupted after reference persistence may also need support; the system does not assume the provider failed simply because the request timed out.

## Validation

- Regression tests cover charge/order mismatch, failed/pending charges, buyer/currency/reference mismatch, invalid prices, paid-to-free bypass, consultation snapshot pricing and calendar retry, webhook signature and retry responses, pending Premium preservation, competing callbacks, and tool-grant failure.
- Existing repository test suite, targeted ESLint and TypeScript checks are run for this change.
- Database uniqueness guarantees depend on applying the migration. Mocked tests do not prove production database constraints or real provider delivery.

## Remaining verification and known limitations

1. Run every flow using Flutterwave **test credentials**, both supported currencies where configured, then verify the expected row, access, receipt and return screen. Confirm actual provider recurrence metadata and cancellation payloads. The code intentionally rejects charges whose verified metadata does not match their local order; missing provider recurrence metadata must be reconciled, not accepted solely by price.
2. Confirm webhook secret configuration and provider retry enablement. Classic v3 `verif-hash` is retained. Provider documentation: https://developer.flutterwave.com/docs/webhooks and https://developer.flutterwave.com/docs/flutterwave-standard-1.
3. Receipts are still not backed by a durable email outbox. Some flows intentionally preserve a paid order if email fails, but automatic receipt retry is not guaranteed. The consultation email claim can remain set if a process dies between claiming and sending; the provider idempotency key prevents ordinary resend duplicates, not this crash window.
4. Verify consultation slot constraints and pending-booking expiry in the deployed database. The repository does not provide a complete base consultation schema. Preventing overlapping bookings and reconciling late payments requires checking the actual deployed constraints before a migration can safely be designed.
5. Event registration has no implemented capacity reservation. Existing checkouts without the new provider price snapshot still use the current event price during reconciliation. Review old in-flight payments if event pricing changes.
6. Membership cancellation is received through provider webhooks. No self-service provider cancellation endpoint was found; refunds and disputes also have no automatic reconciliation flow. Do not describe these as tested or implemented.
7. Business membership tools retain the existing one-year access policy. Renewal-driven extension and the treatment of legacy grants shared by email/plan still require review against customer commitments. Newly issued grants are scoped by subscription and cannot revoke a newer subscription's grant when an older one is cancelled.
8. A full Node.js 24 production build and browser/provider test-mode checks remain outstanding. This environment runs Node.js 20.20.0. No deployment was performed.

These limitations prevent calling the entire payment system production-verified. They are distinct from the code defects repaired above.
