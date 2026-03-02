"use client";

import Container from "@/components/Container";

export default function PrivacyPolicyPage() {
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

            <h1 className="h1 mt-6">Privacy Policy</h1>

            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              Your privacy matters to us. This policy explains what information
              we collect, how we use it, and how we protect it.
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
            {/* WHO WE ARE */}
            <PolicySection title="Who We Are">
              <p>
                Prowess Digital Solutions is a business consulting company that
                helps entrepreneurs and business owners build structured,
                sustainable businesses. Our website address is{" "}
                <a
                  href="https://prowessdigitalsolutions.com"
                  className="text-[#507c80] underline"
                >
                  https://prowessdigitalsolutions.com
                </a>
                . We are based in Lagos, Nigeria, and operate remotely across
                Africa.
              </p>
            </PolicySection>

            {/* INFORMATION WE COLLECT */}
            <PolicySection title="Information We Collect">
              <p>
                We collect information you provide directly to us when you use
                our services or interact with our website. This includes:
              </p>

              <div className="mt-4 space-y-3">
                <PolicyItem
                  label="Contact Information"
                  text="Your name, email address, phone number, and business name when you book a consultation, fill out a contact form, or send us a message via WhatsApp."
                />
                <PolicyItem
                  label="Business Information"
                  text="Details about your business that you share during clarity sessions, audits, or other engagements. This is used solely to provide the service you have requested."
                />
                <PolicyItem
                  label="Website Usage Data"
                  text="We may collect basic analytics data such as pages visited, time spent on the site, and general location (country or region). This helps us understand how visitors use our site and improve the experience."
                />
                <PolicyItem
                  label="Cookies"
                  text="Our website may use cookies to improve functionality and user experience. You can control cookie settings through your browser. We do not use cookies to track you across other websites."
                />
              </div>
            </PolicySection>

            {/* HOW WE USE YOUR INFORMATION */}
            <PolicySection title="How We Use Your Information">
              <p>We use the information we collect to:</p>

              <div className="mt-4 space-y-2">
                <PolicyListItem text="Provide and deliver the services you have requested" />
                <PolicyListItem text="Communicate with you about your consultation, audit, or engagement" />
                <PolicyListItem text="Respond to your enquiries and provide customer support" />
                <PolicyListItem text="Send you relevant updates or resources, but only if you have opted in" />
                <PolicyListItem text="Improve our website, services, and overall client experience" />
                <PolicyListItem text="Comply with legal obligations where applicable" />
              </div>

              <p className="mt-4">
                We do not sell, rent, or trade your personal information to third
                parties. We do not use your information for purposes other than
                what is described in this policy.
              </p>
            </PolicySection>

            {/* DATA PROTECTION */}
            <PolicySection title="How We Protect Your Information">
              <p>
                We take reasonable steps to protect the information you share
                with us. This includes using secure communication channels,
                limiting access to personal data to authorised personnel only,
                and storing sensitive business information securely.
              </p>
              <p className="mt-3">
                However, no method of electronic transmission or storage is
                completely secure. While we do our best to protect your
                information, we cannot guarantee absolute security.
              </p>
            </PolicySection>

            {/* THIRD PARTY SERVICES */}
            <PolicySection title="Third Party Services">
              <p>
                Our website may use third party services for analytics, hosting,
                or communication (such as Google Analytics, Vercel, or WhatsApp).
                These services may collect data in accordance with their own
                privacy policies. We encourage you to review their policies
                separately.
              </p>
              <p className="mt-3">
                We do not control how third party services handle your data, and
                we are not responsible for their practices.
              </p>
            </PolicySection>

            {/* YOUR RIGHTS */}
            <PolicySection title="Your Rights">
              <p>You have the right to:</p>

              <div className="mt-4 space-y-2">
                <PolicyListItem text="Request access to the personal information we hold about you" />
                <PolicyListItem text="Request correction of any inaccurate information" />
                <PolicyListItem text="Request deletion of your personal data, subject to any legal obligations we may have" />
                <PolicyListItem text="Withdraw consent for any communications you have previously opted into" />
                <PolicyListItem text="Ask questions about how your data is being used" />
              </div>

              <p className="mt-4">
                To exercise any of these rights, contact us at{" "}
                <a
                  href="mailto:info@prowessdigitalsolutions.com"
                  className="text-[#507c80] underline"
                >
                  info@prowessdigitalsolutions.com
                </a>
                .
              </p>
            </PolicySection>

            {/* DATA RETENTION */}
            <PolicySection title="Data Retention">
              <p>
                We retain your personal information only for as long as it is
                needed to provide our services or as required by law. If you
                request deletion of your data and there is no legal requirement
                for us to keep it, we will remove it within a reasonable
                timeframe.
              </p>
              <p className="mt-3">
                Business information shared during consulting engagements is
                treated as confidential and is not shared with anyone outside
                the engagement unless you give explicit permission.
              </p>
            </PolicySection>

            {/* CHILDREN */}
            <PolicySection title="Children&apos;s Privacy">
              <p>
                Our services are not directed at individuals under the age of
                18. We do not knowingly collect personal information from
                children. If we become aware that we have collected data from a
                minor, we will take steps to delete it promptly.
              </p>
            </PolicySection>

            {/* CHANGES */}
            <PolicySection title="Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time to reflect
                changes in our practices or for legal and regulatory reasons. Any
                updates will be posted on this page with a revised date. We
                encourage you to review this page periodically.
              </p>
            </PolicySection>

            {/* CONTACT */}
            <PolicySection title="Contact Us">
              <p>
                If you have any questions about this Privacy Policy or how we
                handle your information, please contact us:
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
            </PolicySection>
          </div>
        </Container>
      </section>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function PolicySection({
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

function PolicyItem({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="font-medium text-slate-900">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
    </div>
  );
}

function PolicyListItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#507c80]" />
      <p className="text-slate-600">{text}</p>
    </div>
  );
}
