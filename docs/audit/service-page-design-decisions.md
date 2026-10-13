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

Use the existing diagnostic URL and enquiry backend. Keep the confirmed one-time fee of $120, five business days after confirmed payment and complete information, written review/report, prioritised 30-day roadmap, relevant tools, 45-minute review call and one follow-up email within seven calendar days after the call. Preserve published exclusions.

Journey: interactive scope preview → free health check with named result → deliverables and terms → enquiry on the same page → suitability confirmation → payment instructions. Submission success stays on-page; failed submissions retain inputs for retry. Analytics include assessment start/completion and successful enquiries without form contents or personal data.

Local checks do not establish deployment, email delivery or real analytics receipt. Browser verification and deployed verification must be recorded separately.

## Diagnostic implementation verification

13 October 2026: local desktop (1440px) and mobile (390px) browser checks passed for scope selection, completing the five-question assessment, showing the named result and opening its captured-image popup. No horizontal mobile overflow or browser runtime errors were observed. Desktop and mobile screenshots were reviewed. ESLint, TypeScript and four health/verdict tests passed. No enquiry was submitted and no deployment was performed.

The initial diagnostic layout was rejected as too basic. Replaced its scope tabs with a selectable recurring-problem board and animated review-focus reveal. Added an explorable fictional diagnostic report with four situations, observed gaps, risks and a four-week action sequence, optional reviewed-state controls and an exact visible-result export. Local browser checks passed for reveal, week selection, health-check completion, captured-result popup and mobile overflow; no runtime errors observed. Enquiry sending and deployment remain untested in this pass.

## Owner wording preference

Do not use “illustrative” in customer-facing copy. Use direct, professional language and avoid repeated explanations that make the tools sound unserious. Label report previews simply as previews where needed; never present generated scenarios as actual client evidence. This preference applies to future work as well as the services and diagnostic pages.
