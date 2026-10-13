# Diagnostic landing page

Implemented locally on the existing `/services/business-structure-diagnostic` route.

The hero links to the five-question health check. Each answer scores 0, 1 or 2 with equal weighting; incomplete assessments cannot produce a result. The result explicitly describes a self-assessment and recommends actions for areas scored below 2. Answers are held only in component state and are not submitted or sent to analytics.

The offer uses the existing service content for the confirmed price, deliverables and delivery terms. The enquiry section is available without requiring assessment completion. It submits business description, challenges and goals through `/api/contact`, with the controlled source `business_diagnostic`. Existing storage, admin notification and separate customer acknowledgement are reused. General contact remains available on its existing route.

Events: `assessment_start` on the first answer, `assessment_complete` on the first valid result, and `generate_lead` only after the enquiry API confirms success. Events contain controlled source and offer labels, not answers or personal details. Repeated result requests do not emit repeated completion events during the same mount. Analytics blocking does not interrupt the journey.

Failed submissions retain entered values and allow retry. Successful submissions replace the form with confirmation and suitability/payment next steps. No direct diagnostic payment or subscription is started.

Validation: scoring, contact delivery/source validation and analytics tests; targeted lint and TypeScript checks. Production email delivery, GA4 receipt and browser/device rendering still need verification. No deployment or live enquiry was performed.
