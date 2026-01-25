import Container from "@/components/Container";
import Button from "@/components/Button";
import SectionTitle from "@/components/SectionTitle";
import { packages } from "@/content/site";

const CLARITY_LINK = "https://calendar.app.google/QS8oHmyyCtSiRTen9";

const comparisonFeatures = [
  { label: "Clarity call", values: [true, true, true, true] },
  { label: "Business review", values: [true, true, true, true] },
  { label: "Action plan", values: [true, true, true, true] },
  { label: "Email support", values: [false, true, true, true] },
  { label: "Systems setup", values: [false, true, true, true] },
  { label: "Process documentation", values: [false, true, true, true] },
  { label: "Growth plan", values: [false, false, true, true] },
  { label: "Team structure", values: [false, false, true, true] },
  { label: "Training sessions", values: [false, false, true, true] },
  { label: "Custom support", values: [false, false, false, true] },
  { label: "On-site sessions (if needed)", values: [false, false, false, true] },
  { label: "Priority support", values: [false, false, false, true] },
];

const faqItems = [
  {
    q: "Why should I start with a Business Clarity Session?",
    a: "Because it helps you see what is wrong, what is missing, and what to fix first. You leave with clear next steps, not guesswork.",
  },
  {
    q: "What makes your pricing different?",
    a: "You are paying for structure, guidance, and practical direction. We focus on what will help you run your business properly, not empty motivation.",
  },
  {
    q: "Can I move from one package to another?",
    a: "Yes. If you start small and later need more support, you can upgrade based on what your business needs at that time.",
  },
  {
    q: "Do you offer payment plans?",
    a: "Yes, for some packages. We can agree on a simple plan that works for you before we begin.",
  },
  {
    q: "What if I am not sure what package fits me?",
    a: "Start with the Clarity Session. If you already know you need deeper support, you can also request a custom package.",
  },
  {
    q: "How quickly will I see results?",
    a: "You will feel clearer after the first session. Results show faster when you apply the plan and stay consistent.",
  },
  {
    q: "What happens after my package ends?",
    a: "You can continue with ongoing support, or we can hand over a clear plan you can run with your team.",
  },
  {
    q: "Do you work with businesses outside Nigeria?",
    a: "Yes. We work with clients inside and outside Nigeria, depending on the support you need.",
  },
];

function CheckIcon() {
  return (
    <span
      aria-hidden
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
    >
      ✓
    </span>
  );
}

function XIcon() {
  return (
    <span
      aria-hidden
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-50 text-slate-500 ring-1 ring-slate-200"
    >
      —
    </span>
  );
}

export default function PricingPage() {
  // Expecting 4 packages from your content:
  // 0: Clarity, 1: Foundation, 2: Growth, 3: Enterprise
  const cols = [
    packages?.[0]?.title ?? "Clarity Session",
    packages?.[1]?.title ?? "Foundation",
    packages?.[2]?.title ?? "Growth",
    packages?.[3]?.title ?? "Enterprise",
  ];

  return (
    <div className="pb-16">
      {/* HERO */}
      <section className="py-14 sm:py-20">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
              PRICING
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
              A Clear Pricing Structure
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
              Simple pricing, clear outcomes, and support that helps you run your
              business properly. No hidden charges. No pressure.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                  <span aria-hidden>🛡️</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Clear scope
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  You know what is included before we start. No surprise add-ons.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                  <span aria-hidden>📈</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Practical value
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  We focus on useful structure and decisions, not empty advice.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                  <span aria-hidden>🤝</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Grow in stages
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Start where you are, then move up when you are ready.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* PACKAGES */}
      <section className="py-12 sm:py-16">
        <Container>
          <SectionTitle
            title="Investment Packages"
            desc="Pick the level of support that matches your current needs. You can always upgrade as your business grows."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            {packages.map((p, idx) => {
              const isPopular = idx === 1; // Foundation as “Most Popular” (structure only)
              return (
                <div
                  key={p.title}
                  className={[
                    "relative rounded-2xl border bg-white p-6 shadow-sm",
                    isPopular ? "border-[var(--steel-teal)]" : "border-slate-200",
                  ].join(" ")}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--steel-teal)] px-4 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-xl font-semibold text-slate-900">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">{p.purpose}</p>

                  <div className="mt-6">
  <h4 className="text-2xl font-semibold text-slate-900">
    {p.investment}
  </h4>
  <p className="mt-1 text-xs text-slate-500">Investment range</p>
</div>


                  {/* NOTE: This is your content, not copied from the sample page */}
                  <div className="mt-6">
                    <p className="text-sm font-semibold text-slate-900">
                      What you get
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {(p.deliverables ?? []).slice(0, 6).map((x) => (
                        <li key={x} className="flex gap-2">
                          <CheckIcon />
                          <span>{x}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6">
  <a
    href={idx === 0 ? CLARITY_LINK : "/contact"}
    className={[
      "block w-full rounded-xl px-4 py-3 text-center text-sm font-medium transition",
      isPopular
        ? "bg-[var(--steel-teal)] text-white hover:opacity-90"
        : "border border-slate-300 text-slate-800 hover:bg-slate-50",
    ].join(" ")}
  >
    {idx === 0
      ? "Book Clarity Session"
      : idx === 3
      ? "Request Custom Package"
      : "Discuss this Package"}
  </a>
</div>


                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* DETAILED COMPARISON */}
      <section className="py-12 sm:py-16">
        <Container>
          <SectionTitle
            title="Detailed Comparison"
            desc="Compare what is included across each package to find what fits your business stage."
          />

          <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-sm text-slate-700">
                    <th className="px-6 py-4 font-semibold">Feature</th>
                    {cols.map((c) => (
                      <th key={c} className="px-6 py-4 font-semibold">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {comparisonFeatures.map((row) => (
                    <tr key={row.label} className="text-sm">
                      <td className="px-6 py-5 text-slate-700">{row.label}</td>
                      {row.values.map((v, i) => (
                        <td key={row.label + i} className="px-6 py-5">
                          {v ? <CheckIcon /> : <XIcon />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </section>

      {/* PAYMENT OPTIONS */}
      <section className="py-12 sm:py-16">
        <Container>
          <SectionTitle
            title="Payment Options"
            desc="Choose a payment option that is simple and convenient."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                <span aria-hidden>🏦</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Bank transfer</h3>
              <p className="mt-2 text-sm text-slate-600">
                Pay via bank transfer. We confirm payment and send a receipt.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                <span aria-hidden>📱</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Card or mobile payment</h3>
              <p className="mt-2 text-sm text-slate-600">
                Pay using a supported card or mobile option where available.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                <span aria-hidden>🗓️</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Installment plan</h3>
              <p className="mt-2 text-sm text-slate-600">
                For selected packages, you can split payment into agreed parts.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                <span aria-hidden>🧾</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Invoice</h3>
              <p className="mt-2 text-sm text-slate-600">
                For registered businesses, we can issue an invoice where needed.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16">
        <Container>
          <SectionTitle
            title="Frequently Asked Questions"
            desc="Simple answers to common questions about pricing and support."
          />

          <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group border-b border-slate-200 last:border-b-0"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
                  <span className="text-sm font-semibold text-slate-900">
                    {item.q}
                  </span>
                  <span className="text-slate-500 transition group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <div className="px-6 pb-6 text-sm text-slate-600">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="py-14 sm:py-20">
        <Container>
          <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center sm:px-10">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Ready to build your business properly?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              Start with a Business Clarity Session and get a clear plan for what
              to fix, what to do next, and how to move forward without confusion.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href={CLARITY_LINK} className="justify-center">
                Book Clarity Session
              </Button>
              <Button href={CLARITY_LINK} variant="outline" className="justify-center">
                Discuss Custom Package
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
