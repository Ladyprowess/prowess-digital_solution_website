"use client";

import { useState } from "react";
import Container from "@/components/Container";
import Link from "next/link";
import AgencyPageHeader from "@/components/AgencyPageHeader";
import { Reveal } from "@/components/Reveal";
import { packages, addOns, annualMonthlyPrice, annualTotalPrice } from "@/content/site";
import { serviceAddOns } from "@/content/businessServices";
import MembershipIntakeModal from "@/components/MembershipIntakeModal";
import type { BillingInterval } from "@/lib/payments/flutterwave";
import { formatMoney } from "@/lib/formatMoney";
import { CurrencyToggle } from "@/components/CurrencyToggle";

// The page-wide currency toggle only makes sense once every tier actually
// has an NGN price set - a partial rollout would let a customer pick NGN
// then hit a tier with no NGN amount at all.
const ALL_TIERS_HAVE_NGN = packages.every((p) => p.monthlyPriceNGN != null);

const DIAGNOSTIC_LINK = "/services";

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

export default function PricingPageClient() {
  const popularIdx = 1; // Foundation
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [currency, setCurrency] = useState<"USD" | "NGN">("USD");
  const [modalPlan, setModalPlan] = useState<(typeof packages)[number] | null>(null);

  function monthlyPriceFor(p: (typeof packages)[number]) {
    return currency === "USD" ? p.monthlyPrice : (p.monthlyPriceNGN as number);
  }

  return (
    <div className="pb-16">

      <div className="mx-auto max-w-7xl px-6 pt-8 text-sm text-muted-foreground">
        Looking for the one-time Business Structure Diagnostic? $60 - $120, delivered in five business days after payment confirmation and receipt of all required information. <Link href={DIAGNOSTIC_LINK} className="text-primary underline">Explore the diagnostic and enquire about a one-time engagement</Link>. The plans below are recurring business support, separate from premium learning and career-tool access.
      </div>
      <AgencyPageHeader
        eyebrow="Pricing"
        title={
          <>
            Ongoing business support. <span className="text-primary">Recurring memberships.</span>
          </>
        }
        description="Fixed monthly membership tiers. No hidden charges, no vague promises. Pay yearly and save 20%."
        primaryAction={{ label: "See All Tiers", href: "#packages" }}
        secondaryAction={{ label: "What is the Diagnostic?", href: DIAGNOSTIC_LINK }}
        proof={[
          "Clear scope before we start",
          "Every tier starts with a diagnostic",
          "Move up when your business is ready",
        ]}
      />

      {/* ── TRUST STRIP ───────────────────────────────────────────────────── */}
      <section className="bg-background pb-24 pt-2 sm:pb-32">
        <Container>
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
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
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 90}>
                <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] ring-1 ring-primary/10">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      {item.icon}
                    </svg>
                  </div>
                  <div className="mt-4 font-bold text-foreground">{item.title}</div>
                  <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── PACKAGES ──────────────────────────────────────────────────────── */}
      <section id="packages" className="section bg-muted/60">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="h2">Choose your starting point</h2>
              <p className="lead mt-4">
                Each tier is a level of ongoing support. Start with what your business needs
                right now. You can always upgrade.
              </p>
            </div>
          </Reveal>

          {/* Currency toggle - only once every tier actually has an NGN price */}
          {ALL_TIERS_HAVE_NGN && (
            <Reveal delay={60}>
              <div className="mx-auto mt-8 flex justify-center">
                <CurrencyToggle value={currency} onChange={setCurrency} />
              </div>
            </Reveal>
          )}

          {/* Monthly / Yearly toggle */}
          <Reveal delay={80}>
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
          </Reveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            {packages.map((p, idx) => {
              const isPopular = idx === popularIdx;
              const monthlyPrice = monthlyPriceFor(p);
              const priceLabel =
                interval === "monthly"
                  ? `${formatMoney(monthlyPrice, currency)}/mo`
                  : `${formatMoney(annualMonthlyPrice(monthlyPrice), currency)}/mo`;

              return (
                <Reveal key={p.slug} delay={idx * 100} className="h-full">
                <div
                  id={p.slug}
                  className={`relative flex h-full scroll-mt-24 flex-col rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                    isPopular ? "border-primary" : "border-border"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                      Most Popular
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">{p.title} membership</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.purpose}</p>

                    <div className="mt-5">
                      <span className="text-2xl font-bold text-foreground">{priceLabel}</span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {interval === "monthly"
                          ? "billed monthly"
                          : `billed yearly (${formatMoney(annualTotalPrice(monthlyPrice), currency)}/yr)`}
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
                    Choose recurring membership
                  </button>
                </div>
                </Reveal>
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
        currency={currency}
        displayPrice={
          modalPlan
            ? interval === "monthly"
              ? `${formatMoney(monthlyPriceFor(modalPlan), currency)}/mo`
              : `${formatMoney(annualTotalPrice(monthlyPriceFor(modalPlan)), currency)}/yr`
            : ""
        }
      />

      {/* ── COMPARISON TABLE ──────────────────────────────────────────────── */}
      <section className="section bg-card">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="h2">What is in each tier</h2>
              <p className="lead mt-4">
                A full breakdown so you can see exactly what you are getting at each level.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
          <div className="mt-12 overflow-hidden rounded-2xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="bg-muted">
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
          </Reveal>
        </Container>
      </section>

      {/* ── ADD-ONS ───────────────────────────────────────────────────────── */}
      <section className="section bg-card">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="h2">Need something extra?</h2>
              <p className="lead mt-4">
                A few one-off items that come up alongside a membership. Ask us and we will
                add them to your setup.
              </p>
            </div>
          </Reveal>

          <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2">
            {[
              {
                title: addOns[0],
                desc: "Get your business properly registered and named so you can operate, invoice, and open accounts with confidence.",
                icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
              },
              {
                title: addOns[1],
                desc: "A professional domain and business email set up and connected, so you look established from day one.",
                icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
              },
              {
                title: addOns[2],
                desc: "A full custom website built and launched for your business, beyond what a template can do, designed around how you actually sell.",
                icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5",
              },
              {
                title: addOns[3],
                desc: "Ongoing search visibility and content management, so your site keeps attracting the right people long after launch.",
                icon: "M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z",
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 90}>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-background p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] ring-1 ring-primary/10">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                  </div>
                  <div className="mt-4 font-bold text-foreground">{item.title}</div>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                  <Link
                    href={serviceAddOns[i].href}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80"
                  >
                    Ask about this →
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="section bg-muted">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="h2">Questions we get asked</h2>
              <p className="lead mt-4">
                Straight answers to the things most people want to know before they start.
              </p>
            </div>
          </Reveal>
          <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border border-border">
            {faqItems.map((item, i) => (
              <Reveal key={item.q} delay={i * 50} as="div">
                <details
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
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="section bg-primary">
        <Container>
          <Reveal>
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
          </Reveal>
        </Container>
      </section>

    </div>
  );
}
