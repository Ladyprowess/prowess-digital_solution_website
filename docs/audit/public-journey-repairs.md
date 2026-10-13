# Public journey repairs

Checked 13 October 2026. These are local changes; no deployment or production content edits were made.

| Reported issue | Evidence and action |
| --- | --- |
| Conflicting diagnostic price/delivery | Fresh HTTP response from `/services` already contains ₦180,000 and $120, not the reported $180 or 48–72-hour copy. Local detail content specifies five business days. Added delivery conditions to the service card and one-time terms to Pricing. Existing membership prices remain unchanged. |
| Career tools described as forthcoming | Confirmed stale sentence on homepage; replaced with the named career tools and access guidance. |
| Unclear business next step | Pricing cards explicitly say membership; buttons say “Choose recurring membership”. Services links identify scope/enquiry details. Consultation explains that an appointment is separate from a diagnostic enquiry or membership. |
| Resources appear empty | Public `/api/resources` returns `ok: true, total: 5`, including with the exact library audience/type filters. This disproves an empty current inventory, but is not a browser-rendering check. Empty states now offer learning/videos; hide topic shelves when an unfiltered library is genuinely empty or loading fails. Search splits multiword topics so the Tech shelf does not require the exact phrase “technology tech digital web3”. |
| Recruitment status/terms | Public careers API currently publishes Operations Manager, Content Writer Intern and Sales Intern (Commission-Based). Publication alone is not proof that hiring is active. Owner confirmation requested; no roles closed or compensation terms invented. Loading failures now display a retry action instead of looking like no openings. |
| Contact versus consultation | Contact now describes an enquiry and its next step without promising an unconfirmed 24-hour response. Booking explains service/price review and confirmation after verification rather than unconditional instant confirmation. Existing paid-membership response commitments remain unchanged. |

Still required: owner confirmation of active roles and supported response time; real browser verification; designated-recipient form/booking delivery checks; deployment. Earlier mocked contact/payment tests cover backend routing and payment integrity, not delivery to a live inbox.
