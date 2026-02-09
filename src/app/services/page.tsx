"use client";

import Link from "next/link";
import Container from "@/components/Container";
import ServiceModalGrid from "@/components/ServiceModal";
import { services } from "@/content/site";

export default function ServicesPage() {
  const howWeWork = [
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
      ),
    },
  ];

  return (
    <div className="page-wrap">
      {/* HERO */}
      <section className="section bg-[#eef6f6]">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
              <svg className="h-6 w-6 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 2l3 6 6 .9-4.5 4.4 1.1 6.4L12 17.8 6.4 19.9l1.1-6.4L3 8.9 9 8z"
                />
              </svg>
            </div>

            <h1 className="h1">Business Guidance Services</h1>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              Comprehensive, structured support for every stage of your business journey. From initial clarity to
              sustainable growth, we provide the guidance and systems you need to build a business that works.
            </p>
          </div>
        </Container>
      </section>

      {/* SERVICES (screenshot structure) */}
      <section className="section bg-white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="h2">Our Service Offerings</h2>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            We believe in clarity before action, strong foundations before growth, and simple systems that last.
            </p>
          </div>

          <div className="mt-12">
            <ServiceModalGrid services={services} />
          </div>
        </Container>
      </section>

      {/* HOW WE WORK */}
      <section className="section bg-white">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="h2 mb-4">How We Work</h2>
            <p className="lead">
              Our approach is simple: clarity before execution, foundations before scaling, and long-term thinking for
              lasting success.
            </p>
          </div>

          <div className="mt-12 space-y-8">
            {howWeWork.map((item, idx) => (
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
                    <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#507c80]">{item.step}</div>
                    <h3 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">{item.title}</h3>
                    <p className="text-base leading-relaxed text-slate-600 sm:text-lg">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="section bg-[#3f6f73]">
        <Container>
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-5xl">Start with a Business Clarity Session</h2>

            <p className="mx-auto mt-6 max-w-4xl text-lg leading-relaxed text-white/90 sm:text-xl">
              Not sure which service is right for you? Begin with a Business Clarity Session. In 90 minutes, we&apos;ll
              help you understand your current situation, identify your priorities, and determine the best path forward.
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="https://calendly.com/lady-prowess/30min">
                <button className="w-full rounded-xl bg-white px-10 py-4 text-lg font-semibold text-[#2e5659] shadow-lg transition hover:scale-[1.02] sm:w-auto">
                  Book Clarity Session
                </button>
              </Link>

              <Link href="/pricing">
                <button className="w-full rounded-xl border-2 border-white bg-transparent px-10 py-4 text-lg font-semibold text-white transition hover:bg-white/10 sm:w-auto">
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
