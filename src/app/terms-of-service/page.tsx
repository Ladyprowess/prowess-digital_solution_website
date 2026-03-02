"use client";

import Container from "@/components/Container";

export default function TermsOfServicePage() {
  return (
    <div className="page-wrap">
      {/* HEADER */}
      <section className="section">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <p className="pill mx-auto w-fit">
              <span className="text-sm uppercase tracking-wider text-slate-600">
                Legal
              </span>
            </p>

            <h1 className="h1 mt-6">Terms of Service</h1>

            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              These terms outline the conditions under which you use our website
              and services. By engaging with Prowess Digital Solutions, you agree
              to the terms described below.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Last updated: March 2, 2026
            </p>
          </div>
        </Container>
      </section>

      {/* CONTENT */}
      <section className="section">
        <Container>
          <div className="mx-auto max-w-3xl space-y-12">
            {/* OVERVIEW */}
            <TermsSection title="Overview">
              <p>
                Prowess Digital Solutions provides business consulting services
                including clarity sessions, business audits, strategy planning,
                business structure setup, workflow mapping, SOP documentation,
                training, mentorship, and structured support packages. These
                Terms of Service apply to all services we provide and to your use
                of our website at{" "}
                <a
                  href="https://prowessdigitalsolutions.com"
                  className="text-[#507c80] underline"
                >
                  prowessdigitalsolutions.com
                </a>
                .
              </p>
              <p className="mt-3">
                By booking a session, purchasing a service, or using our website,
                you agree to these terms. If you do not agree, please do not use
                our services.
              </p>
            </TermsSection>

            {/* SERVICES */}
            <TermsSection title="Our Services">
              <p>
                We provide business consulting and advisory services designed to
                help entrepreneurs and business owners gain clarity, build
                structure, and grow sustainably. Our services are advisory in
                nature. We provide guidance, frameworks, recommendations, and
                structured thinking to support your decision making.
              </p>
              <p className="mt-3">
                We do not guarantee specific business outcomes, revenue targets,
                or financial results. The success of any recommendation depends
                on your implementation, market conditions, and other factors
                outside our control. Our role is to give you the clearest
                possible foundation for making better decisions.
              </p>
            </TermsSection>

            {/* BOOKINGS AND PAYMENTS */}
            <TermsSection title="Bookings and Payments">
              <p>
                All services are booked through our website or through direct
                communication with our team. Pricing for each service is listed
                on our website and may vary depending on scope and complexity.
              </p>

              <div className="mt-4 space-y-3">
                <TermsItem
                  label="Payment Terms"
                  text="Payment is required before or at the time of service delivery unless otherwise agreed in writing. We accept payments through the methods specified during booking."
                />
                <TermsItem
                  label="Pricing"
                  text="Prices listed on our website are subject to change. Any changes will not affect services already booked and confirmed at the previous price."
                />
                <TermsItem
                  label="Custom Pricing"
                  text="For services where pricing depends on scope (such as structured support packages or business structure setup), we will agree on the final price after an initial assessment before any work begins."
                />
              </div>
            </TermsSection>

            {/* CANCELLATIONS AND RESCHEDULING */}
            <TermsSection title="Cancellations and Rescheduling">
              <p>
                We understand that plans change. If you need to cancel or
                reschedule a session, please notify us at least 24 hours in
                advance. This allows us to offer the slot to another client.
              </p>

              <div className="mt-4 space-y-3">
                <TermsItem
                  label="Cancellations with 24+ hours notice"
                  text="You may reschedule at no extra cost or request a full refund."
                />
                <TermsItem
                  label="Cancellations with less than 24 hours notice"
                  text="We reserve the right to retain the session fee. In some cases, we may offer rescheduling at our discretion."
                />
                <TermsItem
                  label="No shows"
                  text="If you do not attend a booked session without prior notice, the session fee is non refundable."
                />
              </div>
            </TermsSection>

            {/* REFUND POLICY */}
            <TermsSection title="Refund Policy">
              <p>
                Refunds are handled on a case by case basis. If you are
                unsatisfied with a service, please contact us within 7 days of
                delivery and we will work to resolve the issue. Our goal is
                always to provide value, and we take client satisfaction
                seriously.
              </p>
              <p className="mt-3">
                Refunds are not available for completed services where the
                deliverables have been provided (such as audit reports, strategy
                documents, or SOP documentation), unless the work was
                significantly different from what was agreed.
              </p>
            </TermsSection>

            {/* CONFIDENTIALITY */}
            <TermsSection title="Confidentiality">
              <p>
                We treat all business information shared during our engagements
                as confidential. We will not share your business details,
                strategies, financials, or any other sensitive information with
                third parties without your explicit written consent.
              </p>
              <p className="mt-3">
                If we wish to reference your business in case studies,
                testimonials, or marketing materials, we will always ask for your
                permission first. You have the right to decline, and your
                decision will not affect the quality of service you receive.
              </p>
            </TermsSection>

            {/* CLIENT RESPONSIBILITIES */}
            <TermsSection title="Client Responsibilities">
              <p>
                To get the most out of our services, we ask that you:
              </p>

              <div className="mt-4 space-y-2">
                <TermsListItem text="Provide accurate and honest information about your business during sessions and engagements" />
                <TermsListItem text="Attend booked sessions on time and come prepared where applicable" />
                <TermsListItem text="Communicate openly about your goals, concerns, and any changes in your situation" />
                <TermsListItem text="Respect the advisory nature of our services and understand that implementation is your responsibility unless otherwise agreed" />
              </div>
            </TermsSection>

            {/* INTELLECTUAL PROPERTY */}
            <TermsSection title="Intellectual Property">
              <p>
                All content on our website, including text, graphics, logos,
                images, and design elements, is the property of Prowess Digital
                Solutions and is protected by applicable intellectual property
                laws. You may not copy, reproduce, distribute, or use our
                content without written permission.
              </p>
              <p className="mt-3">
                Deliverables created specifically for your business (such as
                audit reports, strategy documents, SOPs, and workflow maps) are
                yours to use for your internal business purposes once payment is
                complete. However, the underlying frameworks, templates, and
                methodologies remain the intellectual property of Prowess Digital
                Solutions.
              </p>
            </TermsSection>

            {/* LIMITATION OF LIABILITY */}
            <TermsSection title="Limitation of Liability">
              <p>
                Prowess Digital Solutions provides advisory and consulting
                services in good faith. We are not liable for any direct,
                indirect, incidental, or consequential losses or damages arising
                from the use of our services, website, or any recommendations we
                provide.
              </p>
              <p className="mt-3">
                Our services do not constitute legal, financial, or tax advice.
                For matters requiring specialised professional advice, we
                recommend consulting a qualified professional in the relevant
                field.
              </p>
            </TermsSection>

            {/* WEBSITE USE */}
            <TermsSection title="Website Use">
              <p>
                Our website is provided on an &quot;as is&quot; basis. We do our
                best to keep the information on our website accurate and up to
                date, but we do not guarantee that all content is free of errors
                at all times.
              </p>
              <p className="mt-3">
                You agree not to use our website for any unlawful purpose, to
                attempt to gain unauthorised access to our systems, or to
                interfere with the proper functioning of the site.
              </p>
            </TermsSection>

            {/* THIRD PARTY LINKS */}
            <TermsSection title="Third Party Links">
              <p>
                Our website may contain links to third party websites or
                services. These links are provided for convenience and do not
                imply endorsement. We are not responsible for the content,
                privacy practices, or availability of any third party sites.
              </p>
            </TermsSection>

            {/* GOVERNING LAW */}
            <TermsSection title="Governing Law">
              <p>
                These Terms of Service are governed by and construed in
                accordance with the laws of the Federal Republic of Nigeria. Any
                disputes arising from these terms or your use of our services
                will be subject to the jurisdiction of the courts in Lagos,
                Nigeria.
              </p>
            </TermsSection>

            {/* CHANGES TO TERMS */}
            <TermsSection title="Changes to These Terms">
              <p>
                We may update these Terms of Service from time to time. Any
                changes will be posted on this page with a revised date.
                Continued use of our website or services after changes have been
                posted constitutes your acceptance of the updated terms.
              </p>
            </TermsSection>

            {/* CONTACT */}
            <TermsSection title="Contact Us">
              <p>
                If you have any questions about these Terms of Service, please
                contact us:
              </p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="font-semibold text-slate-900">
                  Prowess Digital Solutions
                </p>
                <p className="mt-2 text-slate-600">
                  Email:{" "}
                  <a
                    href="mailto:info@prowessdigitalsolutions.com"
                    className="text-[#507c80] underline"
                  >
                    info@prowessdigitalsolutions.com
                  </a>
                </p>
                <p className="text-slate-600">
                  WhatsApp:{" "}
                  <a
                    href="https://wa.me/2348162174443"
                    className="text-[#507c80] underline"
                  >
                    +234 816 217 4443
                  </a>
                </p>
                <p className="text-slate-600">Location: Lagos, Nigeria (Remote friendly)</p>
              </div>
            </TermsSection>
          </div>
        </Container>
      </section>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function TermsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 leading-relaxed text-slate-600">{children}</div>
    </div>
  );
}

function TermsItem({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="font-medium text-slate-900">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
    </div>
  );
}

function TermsListItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#507c80]" />
      <p className="text-slate-600">{text}</p>
    </div>
  );
}

