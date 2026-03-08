"use client";

import React from 'react';
import Link from "next/link";
import { ManualGoogleReviews } from "@/components/ManualGoogleReviews";

const values = ["Clarity", "Integrity", "Structure", "Simplicity", "Long-term thinking"];

const services = [
  {
    title: "Business Clarity Sessions",
    description: "Not sure what is wrong, just know something is off? This session helps you see clearly. We ask the right questions and give you an honest picture of where things stand.",
    features: ["60–90 minute focused session", "Clear understanding of your problems", "Simple next steps you can act on", "Honest advice, no pressure to buy anything else"],
  },
  {
    title: "Business Audit & Review",
    description: "You are already running, but something is slowing you down. We go through your current setup and tell you exactly what is working, what is not, and what to fix first.",
    features: ["Full review of your current setup", "Clear gaps and weak points identified", "Simple, prioritised recommendations", "Guidance to help you make better decisions"],
  },
  {
    title: "Business Setup & Structure",
    description: "If you are building from the ground up or restructuring, we help you do it right. Clear roles, clear processes, and a roadmap that actually fits your situation.",
    features: ["3–12 month roadmaps", "Resource and team planning", "Simple systems and processes", "Milestone tracking so you know you are moving"],
  },
];

export default function ModernHomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-20 sm:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#507c80]/10 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-[420px] w-[420px] rounded-full bg-slate-100 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#507c80]/20 bg-[#507c80]/5 px-4 py-2 text-sm font-medium text-[#507c80]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Business Guidance for Africa
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Bringing Structure to{' '}
              <span className="text-[#507c80]">Messy Businesses.</span>
            </h1>

            <p className="mb-10 text-lg leading-relaxed text-slate-600 sm:text-xl">
              Most business problems are not about effort. They are about clarity. We help you understand exactly what is wrong and build a simple path forward.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="https://prowessdigitalsolutions.com/consultation">
                <button className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#507c80] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#507c80]/25 transition hover:bg-[#3d5f62] hover:shadow-xl hover:shadow-[#507c80]/30">
                  Book a Clarity Session
                  <svg className="h-5 w-5 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </Link>
              <Link href="/about">
                <button className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50">
                  Learn Our Approach
                </button>
              </Link>
            </div>

            {/* What happens when you book */}
            <p className="mt-6 text-sm text-slate-500">
              In 60 minutes, you will walk away knowing exactly what is wrong and what to fix first.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600">
              {["No Sales Pressure", "Structured Thinking", "Long-Term Focus"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#507c80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Does This Sound Familiar?
            </h2>
            <p className="text-lg text-slate-600">
              These are the three things we hear most from business owners before they work with us.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                ),
                title: "Too Much Advice, No Clear Direction",
                body: "You have read the books, watched the videos, tried different things. Nothing sticks. That is usually a foundation problem, not an effort problem.",
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                ),
                title: "Busy Every Day, But Not Moving Forward",
                body: "You are working hard but the business still feels scattered. The issue is not how much you are doing. It is that the right things are not being done in the right order.",
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ),
                title: "Every Decision Feels Like a Risk",
                body: "You are not sure which tools to use, who to hire, or where to spend money. That uncertainty is expensive. Clarity removes it.",
              },
            ].map((card, idx) => (
              <div key={idx} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                  <svg className="h-8 w-8 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {card.icon}
                  </svg>
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">{card.title}</h3>
                <p className="text-base leading-relaxed text-slate-600">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUSINESS HELPER — moved up as a lead capture tool */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#507c80] to-[#3d5f62] py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">

            <div>
              <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 ring-1 ring-white/15">
                Free Tools
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Not Sure Where to Start?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
              We have built a set of free and premium tools for African business owners. Diagnose your business, plan your finances, map your structure, and more; all in one place.
              </p>
              <p className="mt-3 text-sm text-white/65">
              No sign-up required for most tools. Start in under 5 minutes.
              </p>
              <div className="mt-8">
                <Link href="/tools">
                  <button className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#507c80] shadow-2xl transition hover:scale-[1.02] hover:bg-white/95">
                  Explore All Tools
                    <svg className="h-5 w-5 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-6">What you get</p>
              {[
                "A Business Health Score from the Business Helper",
"Startup cost and break-even calculations",
"Profit and cashflow tracking for your business",
"Checklists, templates, and guides built for Africa",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 mb-4 last:mb-0">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-white/85 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* HOW WE WORK */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              How We Work
            </h2>
            <p className="text-lg text-slate-600">
              Clarity first. Structure second. Then we grow from there.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {[
              {
                step: "01",
                title: "Business Clarity Session",
                body: "We start by listening. We ask the right questions and help you understand what is actually happening in your business. No selling. No assumptions. Just honest guidance.",
              },
              {
                step: "02",
                title: "Building Proper Structure",
                body: "Once things are clear, we put simple systems in place. Clear roles, clear processes, clear priorities. Everything is written down and easy for your team to follow.",
              },
              {
                step: "03",
                title: "Ongoing Guidance",
                body: "As your business grows, new questions will come up. We stay with you, helping you think clearly and make better decisions at each stage.",
              },
            ].map((step, idx) => (
              <div key={idx} className="relative rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
                <div className="mb-6 text-5xl font-black text-[#507c80]/10">{step.step}</div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">{step.title}</h3>
                <p className="text-base leading-relaxed text-slate-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <ManualGoogleReviews />

      {/* SERVICES */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Our Core Services
            </h2>
            <p className="text-lg text-slate-600">
              Everything you need to build a business that runs properly.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {services.map((service, idx) => (
              <div key={idx} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#507c80] text-white">
                  {idx === 0 && (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )}
                  {idx === 1 && (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  {idx === 2 && (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">{service.title}</h3>
                <p className="mb-6 text-base leading-relaxed text-slate-600">{service.description}</p>
                <ul className="space-y-3">
                  {service.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-3 text-sm text-slate-600">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#507c80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/services">
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#507c80] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#507c80]/25 transition hover:bg-[#3d5f62] hover:shadow-xl">
                Explore All Services
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Our Values
            </h2>
            <p className="text-lg text-slate-600">
              Simple principles that guide every conversation and every decision we make with clients.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {values.map((value, idx) => (
              <div key={idx} className="group inline-flex items-center gap-3 rounded-full border-2 border-[#507c80]/20 bg-white px-8 py-4 shadow-sm transition hover:border-[#507c80] hover:shadow-lg">
                <div className="h-2 w-2 rounded-full bg-[#507c80] transition group-hover:scale-125" />
                <span className="text-base font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>

          {/* Replaced generic "Our Promise" with something specific */}
          <div className="mx-auto mt-16 max-w-3xl rounded-3xl border-2 border-[#507c80]/20 bg-white p-10 text-center shadow-xl">
            <p className="text-lg leading-relaxed text-slate-700 sm:text-xl">
              <span className="font-bold text-slate-900">Our Promise:</span>
            </p>
            <p className="mt-3 text-lg leading-relaxed text-slate-600">
              We do not give advice and walk away. We sit with you, understand your specific situation, and help you build something that actually works for your business. Not a template. Not theory.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Ready to Get Clear?
          </h2>
          <p className="mb-10 text-lg leading-relaxed text-slate-600">
            Book a session and spend 60 minutes getting real answers about your business. No pressure. Just clarity.
          </p>
          <Link href="https://prowessdigitalsolutions.com/consultation">
            <button className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#507c80] px-10 py-5 text-base font-semibold text-white shadow-lg shadow-[#507c80]/25 transition hover:bg-[#3d5f62] hover:shadow-xl hover:shadow-[#507c80]/30">
              Book a Clarity Session
              <svg className="h-5 w-5 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </Link>
          <p className="mt-4 text-sm text-slate-500">
            In 60 minutes, you will know exactly what is wrong and what to fix first.
          </p>
        </div>
      </section>

    </div>
  );
}
