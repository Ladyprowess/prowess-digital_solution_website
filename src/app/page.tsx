"use client";

import React, { useRef } from 'react';
import Image from "next/image";
import Link from "next/link";
import { ManualGoogleReviews } from "@/components/ManualGoogleReviews";
import { HeroSection } from "@/components/HeroSection";
import { Reveal } from "@/components/Reveal";
import { clientLogos } from "@/content/site";

const trustStats = [
  {
    value: "60–90 min",
    label: "Clarity Session Length",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    value: "4.7★",
    label: "Rating on Google",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    ),
  },
  {
    value: "7",
    label: "Core Services Offered",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
    ),
  },
  {
    value: "100%",
    label: "Built for African Businesses",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
];

const howWeHelp = [
  {
    title: "Business Clarity Sessions",
    description: "A focused one-on-one session to identify what is really holding your business back and leave with a clear, prioritised direction.",
    href: "/services#clarity-session",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    ),
  },
  {
    title: "Business Audit & Review",
    description: "A structured review of how your business actually operates today, with specific recommendations and a prioritised roadmap.",
    href: "/services#audit-review",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
  },
  {
    title: "Strategy & Action Plans",
    description: "A practical, step-by-step growth roadmap that turns clarity into a real plan, with milestones and clear sequencing.",
    href: "/services#strategy-action-plan",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    ),
  },
  {
    title: "Business Structure Setup",
    description: "Clear roles, responsibilities, and a decision hierarchy so your business can run without depending on you for everything.",
    href: "/services#business-structure-setup",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2M5 21H3m8-14h1m-1 4h1m-4-4h1m-1 4h1m4-4h1m-1 4h1M9 21v-4a1 1 0 011-1h4a1 1 0 011 1v4" />
    ),
  },
];

const impactSteps = [
  {
    step: "01",
    title: "Clarity Session",
    body: "Understand what is actually happening in your business.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
    ),
  },
  {
    step: "02",
    title: "Audit & Strategy",
    body: "A clear picture of what's working, and a prioritised plan.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    ),
  },
  {
    step: "03",
    title: "Structure & Systems",
    body: "Clear roles, processes, and priorities put in place.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    ),
  },
  {
    step: "04",
    title: "Ongoing Guidance",
    body: "Support as you grow, so you never figure it out alone.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    ),
  },
];

export default function ModernHomePage() {
  const helpStripRef = useRef<HTMLDivElement>(null);

  const scrollHelp = (dir: 1 | -1) => {
    const el = helpStripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">

      {/* HERO SECTION */}
      <HeroSection />

      {/* TRUST BAR - honest, no invented numbers */}
      <section className="border-y border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <p className="max-w-[190px] text-sm font-bold uppercase leading-snug tracking-wide text-slate-900">
                Trusted by entrepreneurs and businesses across Africa
              </p>

              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:flex lg:gap-10">
                {trustStats.map((stat) => (
                  <div key={stat.label} className="flex items-start gap-2.5">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#507c80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {stat.icon}
                    </svg>
                    <div>
                      <div className="text-lg font-extrabold text-slate-900">{stat.value}</div>
                      <div className="text-xs leading-tight text-slate-500">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {clientLogos.length > 0 && (
                <div className="flex items-center gap-6 opacity-70 grayscale">
                  {clientLogos.map((logo) => (
                    <Image key={logo.name} src={logo.src} alt={logo.name} width={100} height={28} className="h-6 w-auto object-contain" />
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW WE HELP - carousel */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-[#507c80]">How We Help</div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Clear strategies. Structured systems. Real growth.
              </h2>
              <p className="text-lg text-slate-600">
                We provide the guidance, tools, and support you need to build a business that lasts.
              </p>
            </div>
          </Reveal>

          <div className="relative mt-16">
            <button
              type="button"
              onClick={() => scrollHelp(-1)}
              aria-label="Scroll left"
              className="absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:text-slate-900 sm:flex lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollHelp(1)}
              aria-label="Scroll right"
              className="absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:text-slate-900 sm:flex lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div
              ref={helpStripRef}
              className="grid snap-x snap-mandatory auto-cols-[80%] grid-flow-col gap-5 overflow-x-auto pb-2 sm:auto-cols-[45%] lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-4 lg:overflow-visible"
              style={{ scrollbarWidth: "none" }}
            >
              {howWeHelp.map((item, idx) => (
                <Reveal key={item.title} delay={(idx % 3) * 90} className="snap-start">
                  <Link
                    href={item.href}
                    className="group block h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-[#507c80]/30 hover:shadow-xl"
                  >
                    <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#507c80]/10 text-[#507c80] transition group-hover:bg-[#507c80] group-hover:text-white">
                      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {item.icon}
                      </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-slate-900">{item.title}</h3>
                    <p className="mb-4 text-sm leading-relaxed text-slate-600">{item.description}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#507c80]">
                      Learn more
                      <svg className="h-4 w-4 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* OUR IMPACT */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">

            <Reveal>
              <div className="text-center lg:text-left">
                <div className="mb-3 text-xs font-bold uppercase tracking-widest text-[#507c80]">Our Impact</div>
                <h2 className="mb-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  From confusion to <span className="italic text-[#507c80]">clarity</span>.<br />
                  From stuck to <span className="italic text-[#507c80]">scalable</span>.
                </h2>
                <p className="mb-8 text-base leading-relaxed text-slate-600">
                  We work with you to identify what is not working, build the right systems, and position your business for long-term growth.
                </p>
                <Link
                  href="/about#our-story"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#507c80] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#507c80]/25 transition hover:bg-[#3d5f62]"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  See How We Work
                </Link>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="relative">
                <div className="absolute left-0 right-0 top-8 hidden h-px bg-[#507c80]/25 [background-image:repeating-linear-gradient(90deg,#507c80_0,#507c80_6px,transparent_6px,transparent_14px)] sm:block" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
                  {impactSteps.map((s) => (
                    <div key={s.step} className="relative text-center">
                      <div className="relative z-10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#507c80]/20 bg-white text-[#507c80] shadow-sm">
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {s.icon}
                        </svg>
                      </div>
                      <div className="mb-1 text-xs font-bold text-[#507c80]">{s.step}</div>
                      <h3 className="mb-1 text-sm font-bold text-slate-900">{s.title}</h3>
                      <p className="text-xs leading-relaxed text-slate-500">{s.body}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-10 flex justify-center gap-2 sm:justify-start">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all ${i === 0 ? "w-6 bg-[#507c80]" : "w-1.5 bg-slate-300"}`} />
                  ))}
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* TESTIMONIALS - real Google reviews */}
      <ManualGoogleReviews />

      {/* FINAL CTA */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <div className="text-center lg:text-left">
                <div className="mb-3 text-xs font-bold uppercase tracking-widest text-[#507c80]">Ready to Build a Business That Lasts?</div>
                <h2 className="mb-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                  Let&rsquo;s build your business the right way. Together.
                </h2>
                <p className="mb-8 text-lg leading-relaxed text-slate-600">
                  Book a free clarity session and take the first step towards sustainable growth.
                </p>
                <Link href="https://prowessdigitalsolutions.com/consultation">
                  <button className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#507c80] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#507c80]/25 transition hover:bg-[#3d5f62] hover:shadow-xl">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book Your Clarity Session Now
                  </button>
                </Link>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                <Image
                  src="/images/prowess-clarity-framework.png"
                  alt="Prowess Digital Solutions clarity framework"
                  width={1000}
                  height={1000}
                  className="h-auto w-full rounded-2xl"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

    </div>
  );
}
