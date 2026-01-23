"use client";

import React from 'react';
import Link from "next/link";


export default function ModernHomePage() {
  const values = ["Clarity", "Integrity", "Structure", "Simplicity", "Long-term thinking"];

  const services = [
    {
      title: "Business Clarity Sessions",
      description: "The essential first conversation. We help you understand what your business really need.",
      features: ["60–90 minute focused session", "Clear understanding of your problems", "Simple next steps", "Honest advice no pressure"]
    },
    {
      title: "Business Audit & Review",
      description: "A structured review of what is working, what is not, and what to fix first.",
      features: ["Review of your current setup", "Clear gaps and weak points", "Simple recommendations", "Guidance for better decisions"]
    },
    {
      title: "Business Setup & Structure",
      description: "Direction, operations, tools, and structure for a business that can run properly.",
      features: ["3-12 month roadmaps", "Resource planning", "Simple systems and processes", "Milestone tracking"]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-20 sm:py-32">
        {/* Soft background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#507c80]/10 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-[420px] w-[420px] rounded-full bg-slate-100 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#507c80]/20 bg-[#507c80]/5 px-4 py-2 text-sm font-medium text-[#507c80]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              The First Conversation Every Business Owner Should Have
            </div>

            {/* Main Heading */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Build Your Business on{' '}
              <span className="text-[#507c80]">Solid Foundations</span>
            </h1>

            {/* Subheading */}
            <p className="mb-10 text-lg leading-relaxed text-slate-600 sm:text-xl">
            Finally, a place that understands business properly.
            We help business owners get clear before they take action, so they stop wasting time, money, and energy.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#507c80] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#507c80]/25 transition hover:bg-[#3d5f62] hover:shadow-xl hover:shadow-[#507c80]/30">
                Book Clarity Session
                <svg className="h-5 w-5 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <Link href="/about">
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50">
                Learn Our Approach
              </button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-[#507c80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No Sales Pressure
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-[#507c80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Structured Thinking
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-[#507c80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Long-Term Focus
              </div>
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
            You are not alone. Many business owners struggle because they are building without clear foundations.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                <svg className="h-8 w-8 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">Confused by Too Much Advice</h3>
              <p className="text-base leading-relaxed text-slate-600">
              Everyone gives different tips. You try many things, but nothing feels clear. You are busy, but not moving forward.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                <svg className="h-8 w-8 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">Working Hard With No Clear Direction</h3>
              <p className="text-base leading-relaxed text-slate-600">
              You put in effort every day, yet progress feels slow. Your business feels scattered and unfinished.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                <svg className="h-8 w-8 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">Afraid of Costly Mistakes</h3>
              <p className="text-base leading-relaxed text-slate-600">
              Every decision feels risky. You worry about wasting money on the wrong tools, people, or ideas.
              </p>
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
            We believe in clarity before action, strong foundations before growth, and simple systems that last.
            </p>
          </div>

          <div className="mt-16 space-y-8">
            {[
              {
                step: "Step 1",
                title: "Business Clarity Session",
                desc: "We start with a focused conversation. We listen, ask the right questions, and help you understand what is really happening in your business. No selling. Just honest guidance.",
                icon: (
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )
              },
              {
                step: "Step 2",
                title: "Building Proper Structure",
                desc: "Once things are clear, we help you put simple systems in place. Clear roles, clear processes, and clear priorities. Everything is written down and easy to follow.",
                icon: (
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )
              },
              {
                step: "Step 3",
                title: "Ongoing Guidance",
                desc: "As your business grows, new questions will come up. We stay with you, helping you think clearly and make better decisions at each stage.",
                icon: (
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-8 shadow-sm transition hover:shadow-2xl sm:p-12"
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                  <div className="flex-shrink-0">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#507c80] text-3xl shadow-lg shadow-[#507c80]/25 transition group-hover:scale-110">
                      {item.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#507c80]">
                      {item.step}
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                      {item.title}
                    </h3>
                    <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Our Core Services
            </h2>
            <p className="text-lg text-slate-600">
              Everything you need to build a business that lasts.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
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
                <p className="mb-6 text-base leading-relaxed text-slate-600">
                  {service.description}
                </p>
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
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Our Values
            </h2>
            <p className="text-lg text-slate-600">
              We prefer simple thinking, clear steps, and long-term business decisions.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {values.map((value, idx) => (
              <div
                key={idx}
                className="group inline-flex items-center gap-3 rounded-full border-2 border-[#507c80]/20 bg-white px-8 py-4 shadow-sm transition hover:border-[#507c80] hover:shadow-lg"
              >
                <div className="h-2 w-2 rounded-full bg-[#507c80] transition group-hover:scale-125" />
                <span className="text-base font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-16 max-w-3xl rounded-3xl border-2 border-[#507c80]/20 bg-gradient-to-br from-[#507c80]/5 to-white p-10 text-center shadow-xl">
            <p className="text-lg leading-relaxed text-slate-700 sm:text-xl">
              <span className="font-bold text-slate-900">The feeling we aim for:</span>
              <br />
              <em>This place understands business properly.</em>
            </p>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#507c80] to-[#3d5f62] py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 text-center lg:px-8">
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-5xl lg:text-6xl">
            Ready to Build Your Business Properly?
          </h2>
          <p className="mx-auto mb-12 max-w-3xl text-lg text-white/90 sm:text-xl">
          Start with a Business Clarity Session. No pressure, no long commitment. Just an honest conversation about what your business truly needs.
          </p>
          
          <button className="group mb-16 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-10 py-5 text-lg font-semibold text-[#507c80] shadow-2xl transition hover:scale-105 hover:shadow-white/25">
            Book Your Clarity Session
            <svg className="h-6 w-6 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>

          <div className="grid gap-12 sm:grid-cols-3">
            <div className="text-center">
              <div className="mb-3 text-3xl font-semibold text-white sm:text-4xl">₦25,000</div>
              <div className="text-base text-white/80 sm:text-lg">Investment</div>
            </div>
            <div className="text-center">
              <div className="mb-3 text-3xl font-semibold text-white sm:text-4xl">60-90 mins</div>
              <div className="text-base text-white/80 sm:text-lg">Focused Session</div>
            </div>
            <div className="text-center">
              <div className="mb-3 text-3xl font-semibold text-white sm:text-4xl">100%</div>
              <div className="text-base text-white/80 sm:text-lg">Honest, Pratical Guidance</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}