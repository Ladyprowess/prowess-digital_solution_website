# Prowess rebrand decision matrix

Decision draft dated 13 October 2026. This matrix proposes the role of each business function, what the public website should emphasize, and the checks required before implementation. It builds on the [page and feature inventory](page-feature-inventory.md) and [audit findings and repair status](findings-and-next-steps.md). It is a decision document, not an approved redesign or migration specification.

**Recommendation: retain one Prowess brand and the four audience paths, with business support more visible as a commercial priority to test.** Preserve learning, jobs and opportunities as useful destinations with their own journeys. Keep shared accounts, content and payment infrastructure. Do not rename the brand, migrate domains, remove products or replace working routes without evidence.

Business support has defined offers and related editorial content, but its revenue potential has not been validated. Career and learning usage, paid demand and operating costs are also unknown. The recommendation therefore changes emphasis before it changes product scope.

## Positioning options

| Option | Benefit | Cost or risk | Decision |
| --- | --- | --- | --- |
| Equal emphasis for every function | Reflects the current breadth | Business support remains harder to distinguish; navigation must explain many products | Retain the breadth, but improve the hierarchy |
| One brand with clearer audience journeys and greater business visibility | Tests a commercial direction while preserving existing users and URLs | Could reduce career engagement if business messaging dominates | Recommended test, with audience-specific measures |
| Business-only website | A focused consultancy proposition | Could abandon useful learning and career products, access obligations and search traffic | Defer until usage, demand and maintenance evidence support it |
| Separate brands or domains for career and business | Independent positioning | Duplicate acquisition, publishing and account operations; migration risk | Defer; internal navigation separation is sufficient for now |

## Proposed public hierarchy

The homepage should explain the platform briefly, then show four explicit entry points: **Grow your business**, **Build your skills**, **Find work**, and **Find opportunities**. Put business support first without making every visitor pass through a service pitch. Keep search visible and preserve access to current content feeds.

Proposed primary navigation: **Business support** (`/services`), **Learning** (`/learn`), **Jobs** (`/jobs`), **Opportunities** (`/opportunities`), and **Tools** (`/tools`). A secondary Explore menu can contain Library, Videos, Career paths, Skills and Events. About, Case studies, Blog and Contact remain accessible through contextual links and secondary navigation. Account access and search remain utility actions. Test this hierarchy before replacing the current menu.

For business visitors, use the existing `/services` page as the entry point. Explain the diagnostic and link to its existing detail route. Until scope, price and fulfilment are agreed and checkout is verified, use an honest enquiry action rather than implying an immediate one-time purchase is available. Once ready, the diagnostic can become the primary paid action. Ongoing support should be explained separately.

A lower navigation position does not mean unpublishing a page, adding noindex or removing internal links. Preserve relevant pathways between learning, tools, content and opportunities.

## Business function decisions

Keep means preserve the function. Improve means correct or clarify it. Separate means distinguish its audience or purpose within the existing platform; it does not mean a new domain. Retire requires evidence and a replacement or exit plan. No function is currently recommended for retirement.

| ID | Business function and audience | Proposed decision | Public emphasis | Proposed change and rationale |
| --- | --- | --- | --- | --- |
| D1 | Business advisory and service delivery for owners | Improve | Primary commercial destination | Make the diagnostic scope and one-time purchase model explicit; explain memberships as a separate ongoing option. Existing offers provide a starting point, not proof of demand. |
| D2 | Learning and professional development | Keep and improve | Primary audience path | Organize courses, skills and career paths into a coherent learning journey. Repair missing course relationships and label external versus Prowess-provided content clearly. |
| D3 | Jobs and opportunity discovery | Keep | Two primary audience paths | Retain separate jobs and funding/programme destinations. Prioritize relevant, current listings and a clear next action; avoid inserting unrelated business-service CTAs into every listing. |
| D4 | Practical tools for business and careers | Separate and improve | Shared primary destination with audience choices | Preserve both tool groups; make category and access requirements clear. Link business visitors directly to relevant tools without treating career tools as irrelevant. |
| D5 | Editorial content and resource publishing | Keep and improve | Discovery and support for every audience | Preserve articles, library and videos. Add contextual next steps based on the content's audience; distinguish free, paid, external, read, download and physical formats where applicable. |
| D6 | Credibility and company information | Improve | Close to service decisions; secondary global navigation | Match samples and case studies to the actual service. Retain authentic reviews with context; do not present website-development feedback as diagnostic evidence. Rewrite company positioning only after D1–D5 are agreed. |
| D7 | Enquiries and consultation booking | Improve | Visible contact route and relevant service actions | Distinguish asking a question, booking a consultation and buying a diagnostic. State what happens next and verify delivery of confirmations. |
| D8 | Events, community and retention | Keep, with conditional prominence | Secondary discovery; promote confirmed activity contextually | Feature active events and useful community activity. Keep newsletter preferences aligned to audience interests; do not advertise inactive activity as an active programme. |
| D9 | Customer accounts, purchases and access | Keep | Utility navigation and purchase journeys | Preserve saved items, progress, certificates and purchase access. Explain business membership versus premium-content membership before asking users to subscribe. |
| D10 | Internal operations and recruitment | Separate | Admin operations outside public discovery; genuine vacancies accessible | Keep staff dashboards and publishing tools separate from customer navigation. Treat Work With Us as Prowess recruitment, not the public jobs catalogue. |
| D11 | Measurement and search acquisition | Improve | Behind the scenes | Establish audience and commercial baselines before changing hierarchy; extend eligible sitemap coverage and instrument journeys. Measure qualified enquiries and fulfilment as well as clicks. |

## Change impact and validation matrix

Route patterns refer to current routes, not proposed new ones. Source files are relative to the repository root. Dependency lists identify the main change boundaries; the full route inventory provides additional statically detected dependencies. SEO risk ratings describe the proposed change with URLs retained, not current indexing health.

| ID | Affected routes and implementation entry points | Dependencies to preserve or review | SEO risk and safeguards | Validation required before release |
| --- | --- | --- | --- | --- |
| D1 | `/services`, `/services/[slug]`, `/services/business-structure-diagnostic`, `/pricing`, `/pricing/success`; `src/content/site.ts`, service pages, membership checkout/verify APIs | Static service and plan definitions; `membership_subscriptions`; Flutterwave plans/webhooks; Resend. A diagnostic order and fulfilment model still needs specification; content checkout does not support a service item type. | Medium: changed service intent and pricing copy could affect relevant queries. Retain existing service slugs, titles aligned to the offer and relevant blog links. | Owner agrees scope, exclusions, pilot price/currency, delivery clock, customer inputs, call and follow-up terms. Verify checkout, failure/cancel, duplicate callback handling, receipt, order visibility and fulfilment. Existing subscriptions retain their promised terms. |
| D2 | `/learn`, `/learn/[slug]`, `/skills`, `/skills/[slug]`, `/career-paths`, `/career-paths/[slug]`, `/account/learning`, `/certificates/verify/[code]`; corresponding admin editors | Courses, lessons, skills, career mappings; external creator/source fields; assessments, completion/certificates; member identity and entitlement | Medium: grouping changes can weaken internal links. Preserve detail URLs and course access; add eligible published pages to sitemap only after canonical checks. | Review actual published content and map relevant courses to paths. Verify anonymous and member views, external destinations, lesson access, progress and certificate verification. Confirm schema migrations are applied before relying on creator fields. |
| D3 | `/jobs`, `/jobs/[slug]`, `/opportunities`, `/opportunities/[slug]`, `/search`; JobsPageClient, OpportunitiesPageClient, import APIs | Jobs, opportunities, companies, categories/types, skill maps; publication/expiry rules, external application URLs and alert preferences | Medium if navigation prominence changes; high if routes are retired. Preserve route patterns, crawlable links and valid detail pages. Review expiry behavior without redirecting unrelated listings to the homepage. | Check fresh and expired listings, search/filter results, external application destinations and alert preferences. Compare landing-page traffic and useful outbound actions separately for jobs and opportunities. |
| D4 | `/tools` and every tool detail route; `/portfolio/[slug]`; static tool aliases in `next.config.ts`; `src/app/tools/page.tsx` | Tool catalogue/configuration, client codes and saved data, CV/portfolio storage, PDF generation, premium access and tool APIs | Low for labels; medium for static-to-Next.js consolidation. Preserve HTML assets and rewrite aliases until equivalent replacements are tested; evaluate canonical duplication. | Exercise each retained tool's core task, save/reopen and export. Check free/premium boundaries, signed-in access, responsive use and data retention. Do not label a tool functional from its card alone. |
| D5 | `/blog`, `/blog/[slug]`, `/resources`, `/resources/[slug]`, `/videos`, `/videos/[slug]`; resource listing/file APIs and WordPress integration | WordPress posts/slugs; resources, audience/publication flags, signed cover/file storage; format prices, purchases and entitlement | Medium for editorial changes; high for bulk URL or taxonomy migration. Preserve established slugs and relevant internal links; review query/page performance before merges. | Verify the actual page renders, filters distinguish error from empty, links/files work and paid formats grant the correct access. Audit articles individually for usefulness and sourcing; track relevant next actions. |
| D6 | `/about`, `/case-studies`, `/case-studies/[slug]`, homepage reviews and service proof; case-study admin/API handlers | Published case studies, approved client evidence, review provenance; admin authorization and public field selection | Low if URLs remain. Avoid unsupported claims in titles or snippets; retain useful case-study detail URLs. | Verify permission to publish, redaction and correspondence between each claim and evidence. Test draft isolation and authorized publishing in deployed environment. Label illustrative samples explicitly. |
| D7 | `/contact`, `/consultation`, `/consultation/success`; contact, consultations/book, verify-payment and confirm APIs | Contact messages, consultation services/bookings, availability constraints, timezone handling, Google Calendar, Flutterwave, email delivery | Low with retained pages; preserve clear booking/enquiry intent and internal service links. Transaction-return pages are not search landing pages. | Test enquiries using designated test addresses, confirmations and inbox delivery. Check concurrent slots, supported currencies, missing-price behavior, pending booking expiry and payment callbacks. Agree who responds and the response commitment. |
| D8 | `/events`, `/events/[slug]`, `/events/payment-success`, newsletter forms, subscribe/unsubscribe and community APIs | Events, registrations, feedback, newsletter preferences and consent, discussions/reviews, moderation and Resend | Low for placement changes; medium if event history disappears. Keep useful event history; decide archive treatment by value and privacy, not just date. | Confirm genuine dates, registration/capacity, paid and free flows, reminders where promised, moderation and unsubscribe. Promote only activity that has an owner and can be delivered. |
| D9 | `/account/*`, `/purchase/success`, `/pricing/success`, `/skill-to-business` and its success route; content, memberships, premium-membership and skill-to-business APIs | Supabase Auth, profiles/member profiles, purchases, distinct subscription tables, saved content and achievements; payment webhook and entitlement helpers | Low if private/transaction routes remain excluded from discovery. Verify noindex and avoid indexing personal data; check public certificate/portfolio pages separately. | Test registration/login return destinations, paid access, purchase history, renewal/cancellation and duplicate callbacks. Document what each subscription grants. Confirm Skill to Business remains a supported offer before expanding promotion. |
| D10 | `/admin/*`, `/dashboard`, `/login`, `/work-with-us`; recruitment and staff notification APIs; `/careers` and `/tools-admin` redirects | Staff/admin roles, client records, publishing workflows, recruitment records and internal messages; server-side authorization | Low if internal routes remain non-indexable. Preserve existing redirects. Do not redirect the public `/jobs` catalogue to recruitment. | Confirm role isolation and direct API protection, staff workflows and active vacancies. Remove recruitment promotion only after the owner confirms roles are closed; preserve the route with an honest state when appropriate. |
| D11 | `/`, all public landing/detail pages, `src/components/Navbar.tsx`, `src/components/HeroSection.tsx`, `src/content/site.ts`, `src/app/layout.tsx`, `src/app/sitemap.ts` | GA4 collection and conversion configuration, Search Console, consent behavior, payment records, internal links, metadata and published content sources | Medium for hierarchy changes. Sitemap omission is not proof of deindexing. Preserve canonicals and existing redirects; add eligible public URLs and exclude private/return URLs. | Verify mobile and desktop navigation, crawlable links, metadata, sitemap responses, event delivery and deduplication. Establish query/page and journey baselines before comparing outcomes. |

## Measures for the positioning test

Use a representative baseline period, then a comparable observation period after release, accounting for promotions and changes in content supply. Choose the duration and decision thresholds once actual traffic and operational capacity are known. Current evidence does not support a numeric conversion target or a short statistically reliable A/B test.

| Function | Primary evidence of value | Guardrail |
| --- | --- | --- |
| Business services | Qualified enquiries, verified purchases, completed delivery, customer feedback and delivery margin | Failed checkout, refunds, delivery delays and increased support burden |
| Learning | Relevant course starts, continued learning and completion where tracked; verified paid demand | Lost access, incorrect source attribution and broken course relationships |
| Jobs and opportunities | Relevant listing engagement, useful outbound applications and repeat use | Expired or misleading listings and reduced discovery after navigation changes |
| Tools and resources | Completed tasks, valid downloads, saves/return use and verified purchases | Broken exports, unexpected paywalls and failed entitlement checks |
| Events and retention | Valid registrations, attendance where recorded and relevant return visits | Unsubscribes, failed confirmations and inactive promoted programmes |

Tag entry-point and CTA events by audience, destination and offer where appropriate. Do not send names, emails, form text or private customer data in analytics events. Count purchases only after server verification with a stable transaction identifier; reconcile with payment and order records. An enquiry needs a documented qualification rule before it can be called a qualified lead.

## Decisions needed before implementation

| Decision | Recommended default | Who resolves it and what evidence is needed |
| --- | --- | --- |
| Primary commercial emphasis | Business support is more visible while all four audiences remain | Business owner confirms desired revenue direction; compare available enquiry, purchase and delivery records |
| Diagnostic pilot terms | One fixed, scoped engagement; no price selected in this document | Service owner defines scope and delivery capacity, then tests customer willingness to pay |
| Business versus content subscriptions | Explain and manage them as distinct products | Owner and technical review confirm benefits, active obligations, renewal and cancellation behavior |
| Learning and opportunity commitment | Keep both as supported audience journeys | Content owner confirms publishing capacity and reviews usage/quality before any reduction |
| Events, recruitment and Skill to Business | Keep routes; prominence depends on current availability | Relevant owner confirms active offers, vacancies and programmes |
| Name and visual identity | Retain Prowess Digital Solutions, existing teal palette and typography for this phase | Revisit only if approved positioning demonstrates a communication problem that content and hierarchy cannot solve |
| URL or domain migration | None proposed | Any later proposal needs a per-URL mapping, search evidence, dependency plan and rollback approach |

## Sequence and release gates

1. **Agree scope and emphasis.** Resolve the business decisions above. This matrix is the review point before further branding, layout or commercial code changes.
2. **Verify the repair baseline.** The audit records local case-study authorization and loading-state repairs with automated checks. Production deployment and browser verification remain unconfirmed. Verify those before relying on them in a launch.
3. **Validate content and operating capacity.** Review the course mappings, live offers, service evidence and ownership of publishing and fulfilment.
4. **Specify the journeys.** Write the approved diagnostic order flow and the proposed navigation paths. Confirm prices, customer commitments, account access and the distinction between subscription products.
5. **Implement the agreed information hierarchy and measurement.** Keep URLs stable. Review mobile/desktop accessibility, error states, real data, test-mode payments, admin isolation, SEO and analytics before release.
6. **Evaluate before visual redesign.** Compare results with the baseline. Retain changes that improve useful outcomes without damaging other audience journeys. Revert navigation or copy if it materially harms discovery; do not reverse customer payment records or entitlements as part of a visual rollback.

A later visual brief should follow the approved hierarchy and verified offer. It should not decide product scope through layout choices. No application code, route, price, brand asset or production record was changed to produce this matrix.

## Implementation status after the fix request

Implemented locally: primary navigation and secondary access; standalone service enquiry links with validated topic preselection; recurring business membership explanations; audience, enquiry, sign-in and selected checkout events; missing public sitemap sections and published detail records; noindex metadata for account and payment-return pages; consultation missing-price rejection; contact honeypot alignment; case-study drafts without prefilled outcome claims. Earlier case-study authorization and loading-retry repairs retain regression coverage.

The new analytics instrumentation covers contact-form success, hero audience selection, service enquiry clicks, account-login links, and checkout start/errors for shared content purchases, ebook formats, business memberships and Skill to Business. It does not establish that GA4 received events or count purchases from browser redirects. Server-verified revenue instrumentation and other purchase flows still require a separate reconciliation design and live verification.

Remaining decisions and verification:

- Diagnostic terms are now confirmed by the owner, as recorded below. Keep the agreed enquiry-first process; payment instructions follow suitability confirmation.
- Content owner: appropriate career-course links, genuine service samples, publication permission, active recruitment/events and support for Skill to Business. Do not populate arbitrary records or invent proof.
- Account access: inspect GA4 and Search Console, establish real baselines and verify configured conversions.
- Test environment: complete payment, renewal/cancellation, receipt, booking concurrency and entitlement journeys with test credentials and designated recipients.
- Release: verify browser behavior, full Node.js 24 build and deployed fixes. No deployment was performed in this pass.

These remaining items prevent declaring the entire matrix complete. Existing customer prices and subscriptions were not changed.


## Confirmed diagnostic terms

The owner confirmed a fixed one-time fee of **$60 - $120**. Deliverables are a business review covering model, customers, offer, pricing, sales, operations and basic financial tracking; a written diagnostic report; a prioritised 30-day roadmap with suggested timelines; relevant templates, checklists or tracking tools; and one 45-minute online review call.

Turnaround is five business days after both payment confirmation and receipt of all required client information. Follow-up is one email within seven calendar days after the review call to clarify the report or action plan. Exclusions are bookkeeping, tax or legal advice, implementation, financial statement audits, market research, preparation of a full business plan, additional calls and ongoing advisory support.

The agreed journey is enquiry → suitability confirmation by Prowess → payment instructions. The enquiry asks for the business, current challenges and goals. These decisions supersede this draft's earlier unresolved diagnostic-price and delivery assumptions. The standalone service copy has been updated accordingly; existing recurring membership prices and obligations remain unchanged.

## Listing retention decision

The owner subsequently requested automatic deletion of closed jobs and opportunities, superseding the earlier recommendation to retain expired listing records. The implementation and activation status are in [listing retention](listing-retention.md). The listing functions and their index routes remain; closed records are removed. No change to event or paid-content retention is authorized by this implementation.
