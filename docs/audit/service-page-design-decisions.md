# Service page design decisions

Recorded 13 October 2026 from the owner's approved feedback.

- Keep `/services` as the main business services and advertising destination. Navigation links to it. Each service has its own detail page; the diagnostic enquiry form remains on its diagnostic page.
- Preserve the approved interactive design. Use Prowess Digital Solutions in full, existing steel teal accents, neutral surfaces and business language. Avoid saturating the page with teal.
- Provide useful interactive experiences with answers tied to actual inputs. Health and process results have named assessments, explain the gaps and avoid claiming verified business performance.
- Keep all five process steps visible in compact rows. Do not convert the process builder to a one-question wizard. Align input and result panels side by side on desktop, stack on mobile.
- Preview/print actions use underlined link styling. Keep the compact animated printer popup and gradual paper feed; respect reduced-motion preferences.
- The popup, image download and print/PDF must reproduce the visible result, preserving its wording, figures and layout. Do not substitute a separate text report or TXT download.
- Financial results use the paper-slip appearance, full brand name, aligned label/value rows, highlighted balance and completion stamp.
- Preserve all four standalone services and distinct recurring memberships. No fabricated client proof or performance claims.

## Diagnostic page application

Use the existing diagnostic URL and enquiry backend. Keep the confirmed one-time fee of $60 - $120, five business days after confirmed payment and complete information, written review/report, prioritised 30-day roadmap, relevant tools, 45-minute review call and one follow-up email within seven calendar days after the call. Preserve published exclusions.

Journey: interactive scope preview → free health check with named result → deliverables and terms → enquiry on the same page → suitability confirmation → payment instructions. Submission success stays on-page; failed submissions retain inputs for retry. Analytics include assessment start/completion and successful enquiries without form contents or personal data.

Local checks do not establish deployment, email delivery or real analytics receipt. Browser verification and deployed verification must be recorded separately.

## Diagnostic implementation verification

13 October 2026: local desktop (1440px) and mobile (390px) browser checks passed for scope selection, completing the five-question assessment, showing the named result and opening its captured-image popup. No horizontal mobile overflow or browser runtime errors were observed. Desktop and mobile screenshots were reviewed. ESLint, TypeScript and four health/verdict tests passed. No enquiry was submitted and no deployment was performed.

The initial diagnostic layout was rejected as too basic. Replaced its scope tabs with a selectable recurring-problem board and animated review-focus reveal. Added an explorable fictional diagnostic report with four situations, observed gaps, risks and a four-week action sequence, optional reviewed-state controls and an exact visible-result export. Local browser checks passed for reveal, week selection, health-check completion, captured-result popup and mobile overflow; no runtime errors observed. Enquiry sending and deployment remain untested in this pass.

## Owner wording preference

Do not use “illustrative” in customer-facing copy. Use direct, professional language and avoid repeated explanations that make the tools sound unserious. Label report previews simply as previews where needed; never present generated scenarios as actual client evidence. This preference applies to future work as well as the services and diagnostic pages.

Owner wording update: Do not use “example” or “sample” as customer-facing labels or explanatory copy either. Use direct business wording. Keep claims grounded; do not frame generated scenarios as observed client findings.

## SOP Vault

Added a dedicated `/services/sop-vault` page with a workflow cabinet, four selectable procedures, per-workflow responsible roles and completion checks, exact visible-result export, deliverables and rollout journey. Existing $300–$550 range and three-to-four-process starting scope retained. Enquiry links use `/contact?service=sop-vault`. Local browser checks passed for completion controls, captured-result popup and mobile width, with no runtime errors. ESLint and TypeScript passed. No deployment or enquiry submission performed.

SOP refinement: owner rejected the first SOP layout and unreadably scaled popup. Result images now open at their original CSS width with zoom and two-axis scrolling in a wider, bounded dialog. SOP workflow navigation now spans the top of a full-width workbench; procedures use larger text and a centred reading area instead of a narrow sidebar/report split. Keep visible-result exports unchanged in content.

Owner rejected the overall SOP design. Rebuilt its visual direction with an interactive handover scene, compact two-column procedure cards, reviewed-state feedback and a lighter deliverables layout. Replaced accumulated SOP CSS overrides with a single responsive stylesheet. Preserved readable result preview and existing offer terms. Local completion/preview checks passed, with no mobile overflow or runtime errors; lint and TypeScript passed. Visual direction awaits owner review.

SOP enquiry and motion update: all SOP enquiry CTAs now target an in-page form using `/api/contact` with the SOP Vault inquiry type. Success remains on-page; errors retain inputs, duplicate submissions are guarded, and lead tracking fires only after confirmed success. Hero toggles every five seconds with pause/resume, pauses automatic cycling after manual state selection, and respects reduced-motion preferences. No live enquiry submitted during implementation.

## Go To Market and Offer Playbook

Dedicated page includes an automatically cycling offer/pricing/channel hero with manual pause, an offer-statement builder, three selectable starting-channel plans, visible-result export and an in-page enquiry form using the existing contact backend. Preserve $280–$480 and confirm scope/timing/final fee before payment. Shared enquiry component retains SOP defaults while accepting the Playbook offer details. No live enquiry or deployment performed.

Services business scene: replaced the central icon with an animated SVG business owner at a desk, including phone, typing, paperwork and moving task cards. Structured mode changes posture and settles tasks. Pause and reduced-motion support included. Removed remaining illustration wording from the scene and legacy toolkit.

Playbook visual revision: owner rejected the original design. Replaced the route-card hero with an open-book layout and selectable Offer, Price and Route chapters. Reworked the builder into a writing area beside a live plan, with lighter service presentation. Removed animation pause/resume controls from this page. Preserved existing offer terms, exact-result export and in-page enquiry.

### Shared receipt export correction

Service result exports now use a shared narrow paper layout with full Prowess Digital Solutions branding, monospaced text, dashed dividers and a torn paper edge. The preview and PNG use this receipt rendering; Print / Save PDF uses the same HTML and styles with printable pagination, rather than shrinking a wide screenshot. The animated feed remains. Browser checks passed for financial, process, offer, health, Diagnostic report, SOP (including completion checks), and Playbook results. Playbook PDF generated locally; Diagnostic and Playbook mobile overflow checks passed. This verification covers service result exports, not every site feature or a production deployment.

### Financial Tracking and Unit Economics Dashboard

Added a dedicated service page at `/services/financial-tracking-dashboard`. It retains the existing $150–$260 scope range and deliverables. The workspace separates unit economics, actual cash movement and acquisition cost, with live results, invalid-input handling and shared receipt preview/download/print. The on-page enquiry reuses the existing contact handler and confirms scope, timing and fee before payment. No payment integration or customer records were changed. Removed the remaining SOP pause/resume animation control; a source search found no other animation controls with those labels. Media playback controls remain available.

### Financial page visual revision

Replaced the static ledger hero with a centred introduction and a working financial desk: a sales-volume slider drives the operating balance and revenue/cost bars using the same values as the lower workspace. Reworked inputs into compact rows and displayed results as dashboard metrics, while keeping receipt formatting in the export. Retained the on-page enquiry and agreed offer scope. Browser verification covered slider propagation (50 to 100 sales changes balance from $1,500 to $4,500), invalid input recovery, all three views, receipt export, and widths 390/768/1440 with no horizontal overflow or runtime errors. Lint and TypeScript passed. Local only.

### Financial workspace refinement

Replaced the tall joined grey panel across all three views with independent, compact input and result cards. Inputs use a two-column grid where space permits; results use a short metric breakdown and a dedicated visual. Receipt export retains the financial text and values and excludes decorative visuals. Verified calculations, invalid-input recovery, receipt export and 390/768/1440 widths without overflow; inspected the desktop workspace screenshot. TypeScript and lint passed.
