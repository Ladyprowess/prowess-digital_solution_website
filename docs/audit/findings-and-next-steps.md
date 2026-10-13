# Prowess audit findings and next steps

Audit date: 13 October 2026. Source baseline: `8b27a4b`. Preserve the four audience paths and the existing platform. Correct confirmed defects before changing positioning or promoting a paid diagnostic. The companion [inventory](page-feature-inventory.md) covers all 97 page files, 87 route handlers and 8 static HTML files found in this checkout.

## What the checks establish

| Area | Evidence | Conclusion and limits |
| --- | --- | --- |
| Resources | Public GET `/api/resources?pageSize=1&exclude_resource_type=video&audience=consumer,business,both` returned HTTP 200, `ok:true`, total 5, one requested result. | The current public library API is not empty. This does not verify browser rendering, every resource, file access or payment. |
| Case studies | Public GET `/api/case-studies?published=true&pageSize=1` returned HTTP 200, `ok:true`, total 2, one requested result. | Published records load through the API. A crawler's loading text does not establish a broken collection. |
| Career paths | Read-only anonymous-key queries against the locally configured Supabase project returned 2 published paths, 34 path-skill mappings, 0 path-course mappings and 202 job-skill mappings, all HTTP 200. | Missing course mappings explain zero linked-course counts in this project's current implementation. Counts are aggregate and do not establish the skill/job count for each published path. The configured project was not independently matched to deployed environment settings. |
| Diagnostic | `src/content/site.ts` defines a $180–$320 service and a 48–72 hour delivery promise. `src/app/services/[slug]/page.tsx` links its primary CTA to `/pricing` with the matching membership anchor. | A standalone service description leads into membership pricing. The intended purchase model needs an explicit decision. |
| Payments | Content checkout requires a verified member and obtains item prices server-side. Content verification rechecks provider status, amount and currency before updating the purchase. | These safeguards exist in source. Successful checkout, callback delivery, receipt delivery and access after payment remain unverified. |
| Analytics | `src/app/layout.tsx` loads GA4 and calls `gtag('config', ...)`. A source search found no explicit `begin_checkout` or `generate_lead` instrumentation. | Base installation exists. Collection, client-side navigation, conversion definitions and any externally configured events need GA4 verification. |

No real payments, signups, bookings, emails or production writes were performed. Public endpoint checks are point-in-time observations. Browser interaction was unavailable in this session, so mobile rendering, keyboard flows and end-to-end journeys are still open checks. The configured database queries used the public anonymous key, not privileged access, and reported aggregate counts only.

## Priority findings

### P0 Case study access control

`src/app/api/case-studies/route.ts` exposes a POST handler using the service-role client without checking the caller. The same pattern exists in `src/app/api/case-studies/insert/route.ts` and `src/app/api/admin/case-studies/route.ts`. The public GET handler allows `published=false` to remove the publication filter and uses `select('*')`.

No middleware or proxy file was found in the checkout to supply route protection. This confirms missing application-level authorization in these handlers; external production protections were not inspected. Client-side admin page gating does not protect an API handler. No write request or unpublished-record request was made to demonstrate exploitation.

Next implementation: require a verified admin for every write and draft read, force published-only output for public readers, select only public fields and cap pagination. Check all existing admin callers before changing their authentication contract. Acceptance: anonymous and ordinary-member writes fail; authorized admin writes work; public readers cannot retrieve drafts. Test against isolated fixtures, not by adding records to production.

### P1 Loading errors are presented as empty content

- `src/app/resources/page.tsx`: `fetchResources` does not check `res.ok` or the response's `ok` flag. An error JSON becomes an empty result. The effect has no catch/finally for rejected network requests, which can leave loading active.
- `src/app/career-paths/CareerPathsPageClient.tsx`: queries destructure `data` while ignoring `error`; failures become empty lists or zero counts. The async effect has no rejection handler.
- `src/app/case-studies/CaseStudiesPageClient.tsx`: the catch clears results and logs to the console; no user-facing error distinguishes failure from absence. Its finally block clears loading, so the source does not support assuming all failures cause endless loading.

Next implementation: distinguish loading, successful-empty, successful-results and failure; provide retry; avoid replacing valid counts with zero after a failed request. Acceptance: simulated network failure and HTTP/database errors show a recoverable error; legitimate empty results retain their empty message; successful responses still render.

### P1 Career path course mappings are absent

The explorer counts learning from `career_path_course_map`, not from the size of the courses catalogue. The configured project has no rows in that map. Use `/admin/career-paths/[id]` and its associated editing workflow to associate appropriate existing courses after reviewing relevance. Do not fabricate relationships just to increase counters. Verify mappings for each published path and check the anonymous read policy.

### P1 Diagnostic purchase model is unclear

The service promises a focused review while the CTA sends users to recurring pricing. Content checkout only accepts `resource`, `course` and `career_path`; it is not a ready-made service order endpoint. Membership, premium-content membership, consultation, event and skill-to-business payments are separate flows and must not be treated as interchangeable.

Before implementing the offer, agree one fixed pilot price, exact scope, exclusions, required customer inputs, when the delivery clock starts, the review call and follow-up terms. Preserve the existing sign-in requirement for content and membership purchases. Do not imply a new diagnostic checkout exists until its order record, payment verification and fulfilment workflow exist.

### P2 Sitemap coverage

`src/app/sitemap.ts` includes a short static list, service slugs and WordPress posts. It omits explicit coverage of jobs, opportunities, learn, tools, career paths, skills and videos, and does not enumerate their published detail records. This is confirmed source coverage, not proof of deindexing. Preserve blog URLs and redirects. Add eligible canonical public routes after checking publication and indexing intent; keep account, admin and transaction-return pages out. Compare against Search Console before retiring anything.

### P2 Measurement and receipts

Verify GA4 realtime/debug events, page navigation, CTA clicks, sign-in start, checkout start/failure, successful payment and lead submissions. Record revenue from server-verified payments with stable transaction IDs to prevent duplicate counting; reconcile with Flutterwave and database records. Inspect email delivery logs separately from successful payment status: receipt calls in `src/lib/payments/content.ts` suppress rejected sends, so a paid row does not establish receipt delivery.

## Purchase flow verification map

| Journey | Main source and dependencies | Verified in this pass | Remaining acceptance checks |
| --- | --- | --- | --- |
| Paid resource/course/path | `api/content/checkout`, `api/content/verify`, `lib/payments/content.ts`, `lib/payments/entitlement.ts`; Supabase Auth, purchases, item tables, Flutterwave, Resend | Source checks for member identity, server pricing, provider verification and conditional paid update | Test-mode sign-in, currency/format pricing, cancel/fail/retry, webhook-before-return and return-before-webhook, duplicate notifications, protected read/download, receipt and account purchase listing |
| Business membership | `api/memberships/checkout`, `api/memberships/verify`, `lib/payments/membership.ts`; membership subscriptions and provider plans | Separate checkout and verification implementation exists | Fixed amount/plan agreement, renewal, cancellation, repeated callbacks, account status and entitlement semantics |
| Premium content membership | `api/premium-membership/*`, `lib/payments/premiumMembership.ts`; premium membership subscriptions and member profiles | Distinct product and data path found | Clarify difference from business support tiers, access while active, renewal failure, cancellation and reactivation |
| Consultation | `api/consultations/book`, `verify-payment`, `confirm`; consultation services/bookings, Google Calendar, Flutterwave, email | Server resolves service amount and inserts a booking; duplicate-slot errors are handled | Verify deployed database overlap constraints, concurrent slot attempts, pending expiry, timezone behavior, calendar entry, payment and confirmation. Also test NGN-only services: the USD fallback uses `Number(service.price_usd || 0)`, which can classify a missing USD price as free. |
| Paid events | `api/events/register`, `verify-payment`, webhook; events and registrations | Routes and webhook reconciliation exist | Capacity, duplicate registration, currency, cancellation, receipt and admin list |
| Skill to business | `api/skill-to-business/checkout`, `verify`, `lib/payments/skillToBusiness.ts` | Separate purchase flow exists | Confirm offer is still active, scope/pricing, customer receipt and fulfilment |
| Contact/newsletter | `api/contact`, `api/subscribe`; contact messages/newsletter subscribers and Resend | Persistence and email calls exist in source | Isolated submission, validation, duplicate subscription, consent preferences, inbox delivery and unsubscribe |

## Recommended implementation order

1. Protect the case-study API handlers and test authorization.
2. Add visible failure and retry states to the three content journeys.
3. Review and populate legitimate career-course mappings; verify browser rendering at mobile and desktop widths.
4. Agree the diagnostic pilot's commercial terms and implement its complete one-time order journey.
5. Verify payment flows with test-mode transactions, including failure and duplicate-callback cases.
6. Add conversion measurement and public sitemap coverage, then verify GA4 and Search Console.
7. Add genuine samples and service-specific evidence, deploy reviewed changes and measure results.

The inventory uses Keep, Improve and Separate provisionally. Separate applies to internal operations, not a recommendation to split the four public audiences into new websites. Nothing is marked Retire: usage, lead quality, maintenance cost and search performance have not yet justified removal.

The Node.js 24 configuration change predates this audit; its production deployment status was not checked here. The initial audit added documentation only. The repair status below records subsequent code changes; business terms remain unchanged.

## Implementation update

The first repair pass now protects all four case-study write handlers, including the additional `/admin/case-studies` route handler found during implementation. Draft reads require an admin session; public listings use explicit fields and bounded pagination. The publishing form sends its session token. Importer cron credentials do not grant content-management permission.

Resources, career paths and case studies now distinguish failed requests from empty results and offer retry. Career-path counts do not show zero while loading or after a failed request. Network and database/HTTP failure recovery and handler authorization have isolated automated coverage. These changes are local; deployed authorization, browser interaction and production publishing remain unverified. Course mapping, commercial pricing, checkout rollout and analytics work are still pending.
