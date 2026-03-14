"use client";

import Link from "next/link";
import Container from "@/components/Container";

// ── Four things PDS does ───────────────────────────────────────────────────
const pillars = [
  {
    number: "01",
    label: "Free Business Toolkit",
    title: "Start here; no cost, no commitment",
    body: "Whether you are about to start a business or already running one, our free toolkit gives you practical resources you can use right now. No payment. No sign-up pressure. Just useful tools that help you think clearly, check your foundations, and take the right next step.",
    services: [
      "Available free to everyone",
      "No access code or payment needed",
      "More tools being added regularly",
    ],
    cta: { label: "Explore Free Toolkit", href: "/tools" },
    free: true,
  },
  {
    number: "02",
    label: "Business Consulting",
    title: "We diagnose, structure, and build a plan with you",
    body: "We work directly with founders and business owners to identify what is holding the business back, fix the foundations, and put the right systems in place. This is hands-on, practical work built around your actual situation; not generic advice.",
    services: [
      "Business Clarity Session",
      "Business Audit and Review",
      "Strategy and Action Plan",
      "Business Structure Setup",
      "Business Training Sessions",
      "Mentorship and Accountability",
    ],
    cta: { label: "Book a Clarity Session", href: "https://prowessdigitalsolutions.com/consultation" },
    free: false,
  },
  {
    number: "03",
    label: "Premium Business Tools",
    title: "We give you the tools to run your business properly",
    body: "We built a suite of practical digital tools specifically for African entrepreneurs. We give our clients access to tools that already work. Each one solves a real operational problem: knowing your numbers, tracking cash, managing invoices, monitoring stock, and planning growth.",
    services: [
      "Startup Cost and Break-Even Calculator",
      "Profit and Cashflow Tracker",
      "Invoice Manager",
      "Inventory Manager",
      "Reach and Growth Planner",
    ],
    cta: { label: "See Premium Tools", href: "/tools" },
    free: false,
  },
  {
    number: "04",
    label: "Training and Mentorship",
    title: "We build the people behind the business",
    body: "Tools and structure only go so far if the people running the business do not have the right knowledge and support. We offer training sessions for founders and teams, and structured mentorship programmes for founders who need consistent, strategic guidance as they grow.",
    services: [
      "Business Training Sessions",
      "Mentorship and Accountability Programme",
    ],
    cta: { label: "Start a Conversation", href: "https://prowessdigitalsolutions.com/consultation" },
    free: false,
  },
];

// ── Who we work with ───────────────────────────────────────────────────────
const whoWeWork = [
  {
    label: "People about to start a business",
    desc: "Not sure where to begin or what to do first. The free toolkit and our clarity session are built exactly for this stage.",
  },
  {
    label: "Early-stage founders",
    desc: "Just launched and need structure from the start, not after the problems pile up.",
  },
  {
    label: "Growing SMEs",
    desc: "Already running but things feel scattered, inconsistent, or too dependent on the founder.",
  },
  {
    label: "Established businesses",
    desc: "Wanting a proper operational review, structured training, or a system overhaul.",
  },
];

// ── How we work ────────────────────────────────────────────────────────────
const process = [
  {
    step: "01",
    title: "Understand before we act",
    desc: "Every engagement starts with a proper conversation. We ask the right questions, listen carefully, and make sure we understand your actual situation before we suggest anything. No templates. No assumptions.",
  },
  {
    step: "02",
    title: "Build the right foundation",
    desc: "Whether it is structure, systems, strategy, or access to the right tools; we focus on what your business actually needs at its current stage, not what sounds impressive.",
  },
  {
    step: "03",
    title: "Stay with you as you grow",
    desc: "Most of our clients come back. Not because we lock them in, but because building a business is an ongoing process and having consistent support makes a real difference.",
  },
];

export default function ServicesPage() {
  return (
    <div className="page-wrap">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0c1a1b] py-24 sm:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(80,124,128,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(80,124,128,.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 40%, #000 40%, transparent 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #507c80 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        <Container>
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#507c80]/30 bg-[#507c80]/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#507c80]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#6a9ea3]">
                What We Do
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              We help African businesses
              <span className="block text-[#507c80]">scale with structure.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
              Whether you are about to start a business, already running one, or trying to grow
              what you have built; Prowess Digital Solutions has something for you.
              Free tools, hands-on consulting, practical resources, and structured training,
              all built specifically for African entrepreneurs.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl bg-[#507c80] px-8 py-3.5 font-semibold text-white transition hover:bg-[#3a5c60]"
              >
                Start a Conversation
              </Link>
              <Link
                href="#our-services"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                See All Services
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ── THREE PILLARS ─────────────────────────────────────────────────── */}
      <section id="our-services" className="section bg-white">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="h2">Everything we offer, in one place</h2>
            <p className="lead mt-4">
              From free tools you can use today, to consulting, premium tools, and ongoing mentorship;
              there is a starting point here for every stage of your business journey.
            </p>
          </div>

          <div className="mt-16 space-y-5">
            {pillars.map((p) => (
              <div
                key={p.number}
                className={`group relative overflow-hidden rounded-2xl border bg-white p-8 transition hover:shadow-lg sm:p-10 ${
                  p.free
                    ? "border-[#507c80]/30 hover:border-[#507c80]/60"
                    : "border-slate-200 hover:border-[#507c80]/40"
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-0.5 scale-x-0 bg-gradient-to-r from-[#507c80] to-[#6a9ea3] transition-transform duration-500 group-hover:scale-x-100" />

                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
                  {/* Number + label */}
                  <div className="flex-shrink-0 lg:w-48">
                    <div className="text-5xl font-black leading-none text-slate-100">{p.number}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#507c80]">
                        {p.label}
                      </span>
                      {p.free && (
                        <span className="rounded-full bg-[#507c80]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#507c80] border border-[#507c80]/20">
                          Free
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title + body + optional CTA */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">{p.title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-slate-600">{p.body}</p>
                    {p.cta && (
                      <Link
                        href={p.cta.href}
                        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#507c80] hover:text-[#3a5c60]"
                      >
                        {p.cta.label} →
                      </Link>
                    )}
                  </div>

                  {/* Services list */}
                  <div className="flex-shrink-0 lg:w-52">
                    <div className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                      {p.free ? "Available now" : "Includes"}
                    </div>
                    <ul className="space-y-2">
                      {p.services.map((s) => (
                        <li key={s} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#507c80]" />
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
      <section className="section bg-white">
        <Container>
          <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[#507c80]/20 shadow-sm">
            <div className="grid lg:grid-cols-2">
              <div className="bg-[#0c1a1b] p-10 lg:p-14">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#507c80]">
                  Premium Business Tools
                </p>
                <h3 className="text-2xl font-bold leading-snug text-white sm:text-3xl">
                  Tools built for African businesses. Yours to use.
                </h3>
                <p className="mt-5 text-sm leading-relaxed text-white/60">
                  We built these tools ourselves; specifically for how African entrepreneurs
                  run their businesses. We give our clients access to them as part of our service.
                  You do not hire us to build you tools. You use the tools we have already built
                  so you can run your business with better information and less guesswork.
                </p>
                <Link
                  href="/tools"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#507c80] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3a5c60]"
                >
                  See the tools →
                </Link>
              </div>

              <div className="bg-white p-10 lg:p-14">
                <div className="space-y-6">
                  {[
                    {
                      name: "Startup Cost and Break-Even Calculator",
                      desc: "Know exactly what it costs to launch. Price correctly from day one. Find your break-even point before you commit a single naira.",
                    },
                    {
                      name: "Profit and Cashflow Tracker",
                      desc: "Track every naira in and out, monthly and annually. See your real profit, not just your revenue.",
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
                      desc: "Plan your content, track ad campaigns, and manage your social calendar; all in one organised place.",
                    },
                  ].map((tool) => (
                    <div key={tool.name} className="flex items-start gap-4">
                      <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#507c80]/15">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#507c80]" />
                      </span>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{tool.name}</div>
                        <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{tool.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-8 text-xs text-slate-400">
                  Tools are available to Prowess Digital Solutions clients with a valid access code.{" "}
                  <Link href="/tools" className="font-semibold text-[#507c80] hover:underline">
                    Learn more →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── WHO WE WORK WITH ──────────────────────────────────────────────── */}
      <section className="section bg-[#f5f9f9]">
        <Container>
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#507c80]">
                  Who This Is For
                </p>
                <h2 className="text-3xl font-bold leading-snug text-slate-900 sm:text-4xl">
                  For founders who are serious about building properly.
                </h2>
                <p className="mt-5 text-base leading-relaxed text-slate-600">
                  We work with people at every stage; from someone who has not started yet
                  and does not know where to begin, all the way to an established business that
                  needs a proper structural overhaul. If you are building a business in Africa
                  and want real support, this is for you.
                </p>
                <Link
                  href="/contact"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#507c80] px-6 py-3 font-semibold text-white transition hover:bg-[#3a5c60]"
                >
                  Talk to us →
                </Link>
              </div>

              <div className="space-y-4">
                {whoWeWork.map((w) => (
                  <div
                    key={w.label}
                    className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#507c80]/15">
                      <span className="h-2 w-2 rounded-full bg-[#507c80]" />
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{w.label}</div>
                      <div className="mt-0.5 text-sm leading-relaxed text-slate-600">{w.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── HOW WE WORK ───────────────────────────────────────────────────── */}
      <section className="section bg-[#0c1a1b]">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">How we work</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/60">
              The same three principles apply to every engagement, regardless of the service.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {process.map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-8"
              >
                <div className="text-4xl font-black leading-none text-white/10">{item.step}</div>
                <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="section bg-[#3a5c60]">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Not sure where to start?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
              Start with a Business Clarity Session. In 60 minutes we will look at your current
              situation, identify what is actually holding you back, and map out the clearest
              path forward. No pressure. No sales pitch. Just honest, structured guidance.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="https://prowessdigitalsolutions.com/consultation">
                <button className="w-full rounded-xl bg-white px-10 py-4 text-base font-semibold text-[#2e5659] shadow-lg transition hover:scale-[1.02] sm:w-auto">
                  Book a Clarity Session
                </button>
              </Link>
              <Link href="/pricing">
                <button className="w-full rounded-xl border-2 border-white/40 bg-transparent px-10 py-4 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto">
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