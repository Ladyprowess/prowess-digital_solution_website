import Container from "@/components/Container";
import Link from "next/link";
import { packages } from "@/content/site";

const CLARITY_LINK = "https://prowessdigitalsolutions.com/consultation";

// Features mapped to 4 packages: Clarity | Foundation | Growth | Full Support
const comparisonFeatures = [
  { label: "Business Clarity Session",        values: [true,  true,  true,  true]  },
  { label: "Business Audit and Review",        values: [false, true,  true,  true]  },
  { label: "Strategy and Action Plan",         values: [false, true,  true,  true]  },
  { label: "Business Structure Setup",         values: [false, true,  true,  true]  },
  { label: "Access to Premium Business Tools", values: [false, true,  true,  true]  },
  { label: "Email support",                    values: [false, true,  true,  true]  },
  { label: "Customised growth and strategy plan", values: [false, false, true, true] },
  { label: "Team structure and role clarity",  values: [false, false, true,  true]  },
  { label: "Business Training Sessions",       values: [false, false, true,  true]  },
  { label: "3-month Mentorship Programme",     values: [false, false, true,  true]  },
  { label: "Bi-weekly accountability check-ins", values: [false, false, true, true] },
  { label: "Extended mentorship",              values: [false, false, false, true]  },
  { label: "Custom advisory support",          values: [false, false, false, true]  },
  { label: "Priority access",                  values: [false, false, false, true]  },
  { label: "Quarterly business reviews",       values: [false, false, false, true]  },
];

const faqItems = [
  {
    q: "Why should I start with a Business Clarity Session?",
    a: "Most business problems look different from the inside. The clarity session gives you an honest outside perspective on what is really happening, what is holding you back, and what to fix first. You leave with clear next steps, not guesswork.",
  },
  {
    q: "What is the difference between Foundation and Growth?",
    a: "Foundation fixes your structure and operations. Growth adds training, mentorship, and a longer-term strategy for scaling. If you are getting organised, start with Foundation. If you have a team and want to grow sustainably, Growth is more appropriate.",
  },
  {
    q: "What are the Premium Business Tools?",
    a: "These are practical digital tools we built specifically for African entrepreneurs — a startup cost calculator, profit and cashflow tracker, invoice manager, inventory manager, and reach and growth planner. Clients on Foundation and above get access to all of them.",
  },
  {
    q: "Can I move from one package to another?",
    a: "Yes. If you start with Clarity and want to go deeper, you can move into Foundation or Growth. We credit what you have already paid toward the next package.",
  },
  {
    q: "Do you offer payment plans?",
    a: "Yes, for Foundation and above. We agree on a simple split before we begin and work with you to make sure the investment is manageable.",
  },
  {
    q: "What if none of the packages feel right for my situation?",
    a: "The Full Support package is flexible and can be built entirely around your specific situation. Reach out and we will put something together that makes sense.",
  },
  {
    q: "How quickly will I see results?",
    a: "You will feel clearer after the first session. Real operational results typically show within the first 4 to 6 weeks when you apply the plan consistently.",
  },
  {
    q: "Do you work with businesses outside Nigeria?",
    a: "Yes. We work with founders across Africa and beyond. Everything is delivered remotely so location is not a barrier.",
  },
];

function Check() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 text-xs">
      ✓
    </span>
  );
}

function Dash() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-200 text-xs">
      —
    </span>
  );
}

export default function PricingPage() {
  const popularIdx = 1; // Foundation

  return (
    <div className="pb-16">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0c1a1b] py-20 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(80,124,128,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(80,124,128,.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, #000 40%, transparent 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #507c80 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <Container>
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#507c80]/30 bg-[#507c80]/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#507c80]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#6a9ea3]">
                Pricing
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Simple pricing.
              <span className="block text-[#507c80]">Clear outcomes.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/60">
              No hidden charges. No vague promises. You know exactly what you are
              getting before we start. Begin where you are and move up when you are ready.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={CLARITY_LINK}
                className="inline-flex items-center justify-center rounded-xl bg-[#507c80] px-8 py-3.5 font-semibold text-white transition hover:bg-[#3a5c60]"
              >
                Book a Clarity Session
              </Link>
              <Link
                href="#packages"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                See All Packages
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ── TRUST STRIP ───────────────────────────────────────────────────── */}
      <section className="border-b border-slate-100 bg-white py-10">
        <Container>
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
            {[
              { icon: "🛡️", title: "Clear scope upfront", desc: "You know exactly what is included before we start. No surprise additions." },
              { icon: "📈", title: "Real, practical value", desc: "We focus on structure and decisions that actually help you run your business." },
              { icon: "🤝", title: "Start where you are", desc: "Every package has a clear entry point. Move up when your business is ready." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#507c80]/10 text-lg">
                  {item.icon}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{item.title}</div>
                  <div className="mt-1 text-sm leading-relaxed text-slate-600">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── PACKAGES ──────────────────────────────────────────────────────── */}
      <section id="packages" className="section bg-[#f5f9f9]">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="h2">Choose your starting point</h2>
            <p className="lead mt-4">
              Each package is a level of support. Start with what your business
              needs right now. You can always upgrade.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-4">
            {packages.map((p, idx) => {
              const isPopular = idx === popularIdx;
              const ctaLabel =
                idx === 0 ? "Book Clarity Session" :
                idx === 3 ? "Request Custom Package" :
                "Discuss this Package";
              const ctaHref = idx === 0 ? CLARITY_LINK : "/contact";

              return (
                <div
                  key={p.title}
                  className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
                    isPopular ? "border-[#507c80]" : "border-slate-200"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#507c80] px-4 py-1 text-xs font-bold text-white">
                      Most Popular
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">{p.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{p.purpose}</p>

                    <div className="mt-5">
                      <span className="text-2xl font-bold text-slate-900">{p.investment}</span>
                      <p className="mt-0.5 text-xs text-slate-400">investment range</p>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                        What is included
                      </p>
                      <ul className="space-y-2.5">
                        {p.deliverables.map((d) => (
                          <li key={d} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#507c80]/15 text-[10px] font-bold text-[#507c80]">
                              ✓
                            </span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                        You will have
                      </p>
                      <ul className="space-y-1.5">
                        {p.outcomes.map((o) => (
                          <li key={o} className="text-sm text-slate-600">{o}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Link
                    href={ctaHref}
                    className={`mt-6 block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                      isPopular
                        ? "bg-[#507c80] text-white hover:bg-[#3a5c60]"
                        : "border border-slate-300 text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {ctaLabel}
                  </Link>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── COMPARISON TABLE ──────────────────────────────────────────────── */}
      <section className="section bg-white">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="h2">What is in each package</h2>
            <p className="lead mt-4">
              A full breakdown so you can see exactly what you are getting at each level.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="bg-[#0c1a1b]">
                    <th className="w-[36%] px-6 py-4 text-sm font-semibold text-white/50">
                      Feature
                    </th>
                    {packages.map((p, i) => (
                      <th
                        key={p.title}
                        className={`px-6 py-4 text-sm font-bold text-center ${
                          i === popularIdx ? "text-[#6a9ea3]" : "text-white"
                        }`}
                      >
                        {p.title}
                        {i === popularIdx && (
                          <span className="ml-2 rounded-full bg-[#507c80]/30 px-2 py-0.5 text-[10px] font-bold text-[#6a9ea3]">
                            Popular
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonFeatures.map((row, ri) => (
                    <tr key={row.label} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">{row.label}</td>
                      {row.values.map((v, ci) => (
                        <td key={ci} className="px-6 py-4 text-center">
                          {v ? <Check /> : <Dash />}
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

      {/* ── PAYMENT OPTIONS ───────────────────────────────────────────────── */}
      <section className="section bg-[#f5f9f9]">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="h2">Payment Options</h2>
            <p className="lead mt-4">
              We keep payment simple and flexible. Choose what works for you.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "🏦", title: "Bank Transfer", desc: "Pay via bank transfer. We confirm receipt and send an invoice immediately." },
              { icon: "📱", title: "Card or Mobile Payment", desc: "Pay using a card or mobile option where available." },
              { icon: "🗓️", title: "Installment Plan", desc: "For Foundation and above, split your payment into agreed parts before we begin." },
              { icon: "🧾", title: "Invoice", desc: "For registered businesses that need a formal invoice, we issue one on request." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#507c80]/10 text-lg">
                  {item.icon}
                </div>
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="section bg-white">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="h2">Questions we get asked</h2>
            <p className="lead mt-4">
              Straight answers to the things most people want to know before they start.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border border-slate-200">
            {faqItems.map((item, i) => (
              <details
                key={item.q}
                className={`group ${i !== faqItems.length - 1 ? "border-b border-slate-200" : ""}`}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
                  <span className="text-sm font-semibold text-slate-900">{item.q}</span>
                  <span className="flex-shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <div className="px-6 pb-6 text-sm leading-relaxed text-slate-600">{item.a}</div>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="section bg-[#3a5c60]">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Ready to build your business properly?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
              Start with a Business Clarity Session. In 90 minutes you will know
              exactly what is holding your business back and what to do about it.
              No pressure. No sales pitch. Just honest, structured guidance.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={CLARITY_LINK}>
                <button className="w-full rounded-xl bg-white px-10 py-4 text-base font-semibold text-[#2e5659] shadow-lg transition hover:scale-[1.02] sm:w-auto">
                  Book a Clarity Session
                </button>
              </Link>
              <Link href="/contact">
                <button className="w-full rounded-xl border-2 border-white/40 bg-transparent px-10 py-4 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto">
                  Discuss a Custom Package
                </button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

    </div>
  );
}