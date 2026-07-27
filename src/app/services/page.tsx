"use client";

import Link from "next/link";
import Container from "@/components/Container";
import AgencyPageHeader from "@/components/AgencyPageHeader";
import { services } from "@/content/site";

// ── Four things Prowess does ────────────────────────────────────────────────
const pillars = [
  {
    number: "01",
    label: "Free Business Toolkit",
    title: "Start here, no cost and no commitment",
    body: "Whether you are about to start a business or already running one, our free toolkit gives you practical resources you can use right now. No payment, no sign up pressure, just useful tools that help you think clearly, check your foundations, and take the right next step.",
    items: [
      "Available free to everyone",
      "No access code or payment needed",
      "More tools being added regularly",
    ],
    cta: { label: "Explore Free Toolkit", href: "/tools" },
    free: true,
  },
  {
    number: "02",
    label: "Productized Offers",
    title: "Fixed scope, fixed timeline, built around your business",
    body: "We work directly with founders and business owners to diagnose what is holding the business back, document the systems it needs, and build a clear plan for growth. Each offer has a defined deliverable and turnaround, not an open ended engagement.",
    items: services.map((s) => s.title),
    cta: { label: "Start the Diagnostic", href: "/services/business-structure-diagnostic" },
    free: false,
  },
  {
    number: "03",
    label: "Practical Tools",
    title: "We give you the tools to run your business properly",
    body: "We built a suite of practical digital tools ourselves. We give clients access to tools that already work, each one solving a real operational problem: knowing your numbers, tracking cash, managing invoices, monitoring stock, and planning growth.",
    items: [
      "Startup Cost and Break Even Calculator",
      "Profit and Cashflow Tracker",
      "Invoice Manager",
      "Inventory Manager",
      "Reach and Growth Planner",
    ],
    cta: { label: "See the Tools", href: "/tools" },
    free: false,
  },
  {
    number: "04",
    label: "Ongoing Support",
    title: "We stay with you as the business grows",
    body: "Tools and structure only go so far if there is no one to talk decisions through with. Our Full Support package includes team training and ongoing mentorship for founders who want consistent, strategic guidance as they grow.",
    items: [
      "Team training sessions",
      "Ongoing mentorship and accountability check ins",
      "Business reviews",
    ],
    cta: { label: "See Pricing", href: "/pricing" },
    free: false,
  },
];

// ── Who we work with ───────────────────────────────────────────────────────
const whoWeWork = [
  {
    label: "Solopreneurs and local service businesses",
    desc: "Coaches, technicians, and boutique owners in the US and UK who built the business on skill and now need the structure to match.",
  },
  {
    label: "Tech and B2B founders",
    desc: "Founders across Western Europe who need clear systems, pricing, and a go to market plan they can actually execute.",
  },
  {
    label: "Cross border entrepreneurs",
    desc: "Founders across Latin America building borderless, digital first businesses who need operational clarity as they expand.",
  },
  {
    label: "African SMEs",
    desc: "Where Prowess started. Business owners building properly, with real support and no shortcuts.",
  },
];

// ── How we work ────────────────────────────────────────────────────────────
const process = [
  {
    step: "01",
    title: "Understand before we act",
    desc: "Every engagement starts with a proper look at your actual situation. We ask the right questions and make sure we understand what is really happening before we suggest anything. No templates, no assumptions.",
  },
  {
    step: "02",
    title: "Build the right foundation",
    desc: "Whether it is structure, systems, pricing, or the numbers, we focus on what your business actually needs at its current stage, not what sounds impressive.",
  },
  {
    step: "03",
    title: "Stay with you as you grow",
    desc: "Most of our clients come back. Not because they are locked in, but because building a business is an ongoing process and consistent support makes a real difference.",
  },
];

export default function ServicesPage() {
  return (
    <div className="page-wrap">

      <AgencyPageHeader
        eyebrow="What We Do"
        title={
          <>
            We teach businesses how to run with <span className="text-primary">structure.</span>
          </>
        }
        description="Whether you are about to start a business, already running one, or trying to grow what you have built, Prowess Digital Solutions has something for you. Free tools, fixed scope diagnostics, practical systems, and ongoing support, wherever you are building."
        primaryAction={{ label: "Start a Conversation", href: "/contact" }}
        secondaryAction={{ label: "See Everything We Offer", href: "#our-services" }}
        proof={[
          "Free business toolkit",
          "Fixed scope offers with clear timelines",
          "Tools and support for daily operations",
        ]}
      />

      {/* ── FOUR PILLARS ──────────────────────────────────────────────────── */}
      <section id="our-services" className="section bg-background">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="h2">Everything we offer, in one place</h2>
            <p className="lead mt-4">
              From free tools you can use today, to fixed scope offers, practical tools, and
              ongoing support, there is a starting point here for every stage of your business.
            </p>
          </div>

          <div className="mt-16 space-y-5">
            {pillars.map((p) => (
              <div
                key={p.number}
                className={`group relative overflow-hidden rounded-2xl border bg-card p-8 transition hover:shadow-lg sm:p-10 ${
                  p.free ? "border-primary/30 hover:border-primary/60" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-0.5 scale-x-0 bg-gradient-to-r from-primary to-primary/50 transition-transform duration-500 group-hover:scale-x-100" />

                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
                  <div className="flex-shrink-0 lg:w-48">
                    <div className="text-5xl font-black leading-none text-muted">{p.number}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-primary">
                        {p.label}
                      </span>
                      {p.free && (
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                          Free
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground sm:text-2xl">{p.title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground">{p.body}</p>
                    {p.cta && (
                      <Link
                        href={p.cta.href}
                        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80"
                      >
                        {p.cta.label} →
                      </Link>
                    )}
                  </div>

                  <div className="flex-shrink-0 lg:w-56">
                    <div className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {p.free ? "Available now" : "Includes"}
                    </div>
                    <ul className="space-y-2">
                      {p.items.map((s) => (
                        <li key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── TOOLS CALLOUT ─────────────────────────────────────────────────── */}
      <section className="section bg-background">
        <Container>
          <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-primary/20 shadow-sm">
            <div className="grid lg:grid-cols-2">
              <div className="dark bg-background p-10 lg:p-14">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">
                  Practical Tools
                </p>
                <h3 className="text-2xl font-bold leading-snug text-foreground sm:text-3xl">
                  Tools built to be used, not admired.
                </h3>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  We built these tools ourselves and use them with our own clients. You get access
                  to tools that already work, so you can run your business on real information
                  instead of guesswork.
                </p>
                <Link
                  href="/tools"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  See the tools →
                </Link>
              </div>

              <div className="bg-card p-10 lg:p-14">
                <div className="space-y-6">
                  {[
                    {
                      name: "Startup Cost and Break Even Calculator",
                      desc: "Know exactly what it costs to launch. Price correctly from day one. Find your break even point before you commit a single dollar.",
                    },
                    {
                      name: "Profit and Cashflow Tracker",
                      desc: "Track income and expenses monthly and annually. See your real profit, not just your revenue.",
                    },
                    {
                      name: "Invoice Manager",
                      desc: "Create professional invoices, track who has paid and who has not, and send reminders directly from the tool.",
                    },
                    {
                      name: "Inventory Manager",
                      desc: "Monitor your stock levels in real time and get alerts before you run out. Works for product and service businesses.",
                    },
                    {
                      name: "Reach and Growth Planner",
                      desc: "Plan your content, track ad campaigns, and manage your social calendar, all in one organised place.",
                    },
                  ].map((tool) => (
                    <div key={tool.name} className="flex items-start gap-4">
                      <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>
                      <div>
                        <div className="text-sm font-bold text-foreground">{tool.name}</div>
                        <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{tool.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-8 text-xs text-muted-foreground">
                  Tools are available to Prowess clients with a valid access code.{" "}
                  <Link href="/tools" className="font-semibold text-primary hover:underline">
                    Learn more →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── WHO WE WORK WITH ──────────────────────────────────────────────── */}
      <section className="section bg-muted">
        <Container>
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
                  Who This Is For
                </p>
                <h2 className="text-3xl font-bold leading-snug text-foreground sm:text-4xl">
                  For founders who are serious about building properly.
                </h2>
                <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                  We work with people at every stage, from someone who has not started yet and
                  does not know where to begin, to an established business that needs a proper
                  structural overhaul. Wherever you are building, if you want real support, this
                  is for you.
                </p>
                <Link
                  href="/contact"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Talk to us →
                </Link>
              </div>

              <div className="space-y-4">
                {whoWeWork.map((w) => (
                  <div
                    key={w.label}
                    className="flex items-start gap-4 rounded-xl border border-border bg-card p-5"
                  >
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </span>
                    <div>
                      <div className="font-bold text-foreground">{w.label}</div>
                      <div className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{w.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── HOW WE WORK ───────────────────────────────────────────────────── */}
      <div>
        <section className="section bg-muted">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">How we work</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                The same three principles apply to every engagement, regardless of the offer.
              </p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-3">
              {process.map((item) => (
                <div key={item.step} className="relative rounded-2xl border border-border bg-card p-8">
                  <div className="text-4xl font-black leading-none text-muted-foreground/30">{item.step}</div>
                  <h3 className="mt-4 text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="section bg-primary">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">
              Not sure where to start?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-primary-foreground/80">
              Start with the Business Structure Diagnostic. In 48 to 72 hours we will look at your
              current situation, identify what is actually holding you back, and map out the
              clearest path forward. No pressure, no sales pitch, just honest, structured guidance.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/services/business-structure-diagnostic">
                <button className="w-full rounded-xl bg-primary-foreground px-10 py-4 text-base font-semibold text-primary shadow-lg transition hover:scale-[1.02] sm:w-auto">
                  Start the Diagnostic
                </button>
              </Link>
              <Link href="/pricing">
                <button className="w-full rounded-xl border-2 border-primary-foreground/40 bg-transparent px-10 py-4 text-base font-semibold text-primary-foreground transition hover:bg-primary-foreground/10 sm:w-auto">
                  View Pricing
                </button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

    </div>
  );
}
