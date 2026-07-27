"use client";

import { useState } from "react";
import Container from "@/components/Container";
import Link from "next/link";
import { packages, annualMonthlyPrice, annualTotalPrice } from "@/content/site";
import MembershipIntakeModal from "@/components/MembershipIntakeModal";
import type { BillingInterval } from "@/lib/payments/paystack";

const DIAGNOSTIC_LINK = "/services/business-structure-diagnostic";

// Features mapped to 4 tiers: Diagnostic | Foundation | Growth | Full Support
// Kept in sync with the deliverables in src/content/site.ts `packages`.
const comparisonFeatures = [
  { label: "Business Structure Diagnostic, then a monthly check in", values: [true, true, true, true] },
  { label: "Startup Cost Calculator and Cashflow Tracker",           values: [true, true, true, true] },
  { label: "Guides on structuring your business",                    values: [true, true, true, true] },
  { label: "Email support",                                          values: [true, true, true, true] },
  { label: "SOP Vault",                                              values: [false, true, true, true] },
  { label: "Go To Market and Offer Playbook",                        values: [false, true, true, true] },
  { label: "Invoice Manager",                                        values: [false, true, true, true] },
  { label: "Financial Tracking and Unit Economics Dashboard",        values: [false, false, true, true] },
  { label: "Inventory Manager and Reach and Growth Planner",         values: [false, false, true, true] },
  { label: "Monthly team training session",                         values: [false, false, true, true] },
  { label: "Bi-weekly check ins",                                    values: [false, false, true, true] },
  { label: "Ongoing mentorship and accountability",                  values: [false, false, false, true] },
  { label: "Priority access",                                        values: [false, false, false, true] },
  { label: "Business reviews",                             values: [false, false, false, true] },
];

const faqItems = [
  {
    q: "Why should I start with the Business Structure Diagnostic?",
    a: "Most business problems look different from the inside. The diagnostic gives you an honest outside perspective on what is really happening, what is holding you back, and what to fix first. Every membership includes it, then a fresh check in every month you stay with us.",
  },
  {
    q: "How does billing work?",
    a: "Every tier is billed monthly by default. Pay yearly instead and you get 20% off the monthly rate, charged once a year.",
  },
  {
    q: "What happens right after I pay?",
    a: "Before payment, you tell us about your business and what you specifically want us to look at. Once payment goes through, you get an email confirming what happens next, and we reach out to you directly within 24 hours to get started.",
  },
  {
    q: "What is the difference between Foundation and Growth?",
    a: "Foundation adds your SOP Vault and your Go To Market and Offer Playbook. Growth adds the Financial Tracking and Unit Economics Dashboard, the full tools suite, and monthly team training. If you are getting organised, start with Foundation. If you have a team and want to grow sustainably, Growth is more appropriate.",
  },
  {
    q: "Can I move from one tier to another?",
    a: "Yes. You can move up whenever your business is ready for more support, and we credit what you have already paid toward the new tier.",
  },
  {
    q: "What if none of the tiers feel right for my situation?",
    a: "Full Support is flexible and can be built entirely around your specific situation. Reach out and we will put something together that makes sense.",
  },
  {
    q: "Where do you work with clients?",
    a: "Everywhere. We started in Nigeria and now work with founders across Africa, the US, UK, Europe, and Latin America. Everything is delivered remotely so location is not a barrier.",
  },
];

function Check() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

function Dash() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border text-xs">
      -
    </span>
  );
}

function formatUSD(amount: number) {
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function PricingPage() {
  const popularIdx = 1; // Foundation
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [modalPlan, setModalPlan] = useState<(typeof packages)[number] | null>(null);

  return (
    <div className="pb-16">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="dark">
        <section className="relative overflow-hidden bg-background py-20 sm:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(color-mix(in oklch, var(--primary) 7%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--primary) 7%, transparent) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, #000 40%, transparent 100%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
          <Container>
            <div className="relative mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Pricing
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
                Simple pricing.
                <span className="block text-primary">Clear outcomes.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Fixed monthly membership tiers. No hidden charges, no vague promises.
                Pay yearly and save 20%.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="#packages"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3.5 font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  See All Tiers
                </Link>
                <Link
                  href={DIAGNOSTIC_LINK}
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-card/40 px-8 py-3.5 font-semibold text-foreground transition hover:bg-card/70"
                >
                  What is the Diagnostic?
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </div>

      {/* ── TRUST STRIP ───────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-card py-10">
        <Container>
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
            {[
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                ),
                title: "Clear scope upfront",
                desc: "You know exactly what is included before we start. No surprise additions.",
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />,
                title: "Real, practical value",
                desc: "We focus on structure and decisions that actually help you run your business.",
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />,
                title: "Start where you are",
                desc: "Every tier has a clear entry point. Move up when your business is ready.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    {item.icon}
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-foreground">{item.title}</div>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── PACKAGES ──────────────────────────────────────────────────────── */}
      <section id="packages" className="section bg-muted">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="h2">Choose your starting point</h2>
            <p className="lead mt-4">
              Each tier is a level of ongoing support. Start with what your business needs
              right now. You can always upgrade.
            </p>
          </div>

          {/* Monthly / Yearly toggle */}
          <div className="mx-auto mt-8 flex w-fit items-center gap-1 rounded-full border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                interval === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("annually")}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
                interval === "annually" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Yearly
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                Save 20%
              </span>
            </button>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            {packages.map((p, idx) => {
              const isPopular = idx === popularIdx;
              const priceLabel =
                interval === "monthly"
                  ? `${formatUSD(p.monthlyPrice)}/mo`
                  : `${formatUSD(annualMonthlyPrice(p.monthlyPrice))}/mo`;

              return (
                <div
                  key={p.slug}
                  id={p.slug}
                  className={`relative flex scroll-mt-24 flex-col rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md ${
                    isPopular ? "border-primary" : "border-border"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                      Most Popular
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">{p.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.purpose}</p>

                    <div className="mt-5">
                      <span className="text-2xl font-bold text-foreground">{priceLabel}</span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {interval === "monthly"
                          ? "billed monthly"
                          : `billed yearly (${formatUSD(annualTotalPrice(p.monthlyPrice))}/yr)`}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-border pt-5">
                      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        What is included
                      </p>
                      <ul className="space-y-2.5">
                        {p.deliverables.map((d) => (
                          <li key={d} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5 border-t border-border pt-5">
                      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        You will have
                      </p>
                      <ul className="space-y-1.5">
                        {p.outcomes.map((o) => (
                          <li key={o} className="text-sm text-muted-foreground">{o}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalPlan(p)}
                    className={`mt-6 block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                      isPopular
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "border border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <MembershipIntakeModal
        open={!!modalPlan}
        onClose={() => setModalPlan(null)}
        plan={modalPlan}
        interval={interval}
        displayPrice={
          modalPlan
            ? interval === "monthly"
              ? `${formatUSD(modalPlan.monthlyPrice)}/mo`
              : `${formatUSD(annualTotalPrice(modalPlan.monthlyPrice))}/yr`
            : ""
        }
      />

      {/* ── COMPARISON TABLE ──────────────────────────────────────────────── */}
      <section className="section bg-card">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="h2">What is in each tier</h2>
            <p className="lead mt-4">
              A full breakdown so you can see exactly what you are getting at each level.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-2xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="dark">
                  <tr className="bg-background">
                    <th className="w-[36%] px-6 py-4 text-sm font-semibold text-muted-foreground">
                      Feature
                    </th>
                    {packages.map((p, i) => (
                      <th
                        key={p.slug}
                        className={`px-6 py-4 text-sm font-bold text-center ${
                          i === popularIdx ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {p.title}
                        {i === popularIdx && (
                          <span className="ml-2 rounded-full bg-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary">
                            Popular
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {comparisonFeatures.map((row, ri) => (
                    <tr key={row.label} className={ri % 2 === 0 ? "bg-card" : "bg-muted/50"}>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{row.label}</td>
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

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="section bg-muted">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="h2">Questions we get asked</h2>
            <p className="lead mt-4">
              Straight answers to the things most people want to know before they start.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border border-border">
            {faqItems.map((item, i) => (
              <details
                key={item.q}
                className={`group bg-card ${i !== faqItems.length - 1 ? "border-b border-border" : ""}`}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
                  <span className="text-sm font-semibold text-foreground">{item.q}</span>
                  <span className="flex-shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <div className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">{item.a}</div>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="section bg-primary">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">
              Ready to build your business properly?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-primary-foreground/80">
              Every membership starts with the Business Structure Diagnostic, so you know
              exactly what is holding your business back before anything else happens.
              No pressure. No sales pitch. Just honest, structured guidance.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="#packages">
                <button className="w-full rounded-xl bg-card px-10 py-4 text-base font-semibold text-primary shadow-lg transition hover:scale-[1.02] sm:w-auto">
                  Choose Your Tier
                </button>
              </Link>
              <Link href="/contact">
                <button className="w-full rounded-xl border-2 border-primary-foreground/40 bg-transparent px-10 py-4 text-base font-semibold text-primary-foreground transition hover:bg-primary-foreground/10 sm:w-auto">
                  Talk to Us First
                </button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

    </div>
  );
}
