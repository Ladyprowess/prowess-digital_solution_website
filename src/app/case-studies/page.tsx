"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { caseStudies } from "@/data/caseStudies";

export default function CaseStudiesPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#f6fbfb]">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-10 text-center">
        <div className="mx-auto mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f2f2] text-[#507c80]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 19V10M10 19V5M16 19V13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-[#223433] md:text-5xl">
          Client Success Stories
        </h1>

        <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-[#4d5f5e] md:text-lg">
          Real transformations from Nigerian businesses who started with a single
          Business Clarity Session. See how structured thinking and business
          expertise drive measurable, sustainable growth.
        </p>
      </section>

      {/* Filter (collapsed by default like Resources) */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-2xl border border-[#dbe9e8] bg-white shadow-sm">
          <button
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-6 py-5 text-left font-semibold text-[#223433]"
          >
            <span className="flex items-center gap-3">
              <span className="text-[#507c80]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 5h16l-6 7v6l-4 2v-8L4 5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Filter Case Studies
            </span>

            <svg
              className={`h-5 w-5 transition-transform ${
                isFilterOpen ? "rotate-180" : ""
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 9l6 6 6-6"
              />
            </svg>
          </button>

          {isFilterOpen && (
            <div className="border-t border-[#dbe9e8] px-6 py-5 text-sm text-[#4d5f5e]">
              Filtering options will go here.
            </div>
          )}
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          {caseStudies.map((cs) => (
            <article
              key={cs.slug}
              className="overflow-hidden rounded-2xl border border-[#dbe9e8] bg-white shadow-sm"
            >
              <div className="relative h-56 w-full">
                <Image
                  src={cs.image}
                  alt={cs.title}
                  fill
                  className="object-cover"
                />

                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="rounded-full bg-[#507c80] px-4 py-1 text-xs font-semibold text-white">
                    {cs.category}
                  </span>
                  <span className="rounded-full bg-[#223433] px-4 py-1 text-xs font-semibold text-white">
                    {cs.size}
                  </span>
                </div>
              </div>

              <div className="p-8">
                <h2 className="text-2xl font-semibold text-[#223433]">
                  {cs.title}
                </h2>

                <p className="mt-5 text-xs font-semibold tracking-widest text-[#6b7d7b]">
                  CHALLENGE
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#4d5f5e]">
                  {cs.challenge}
                </p>

                <div className="mt-8">
                  <Link
                    href={`/case-studies/${cs.slug}`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#eaf6f6] px-6 py-4 text-sm font-semibold text-[#223433] transition hover:bg-[#def0f0]"
                  >
                    View Full Case Study
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 9l6 6 6-6"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mx-auto mt-24 max-w-3xl text-center">
          <h3 className="text-4xl font-semibold text-[#223433] md:text-5xl">
            Ready to Write Your Success Story?
          </h3>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#4d5f5e] md:text-lg">
            Every transformation begins with clarity. Start with a Business
            Clarity Session and discover what&apos;s possible for your business.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/book"
              className="inline-flex items-center justify-center rounded-lg bg-[#2f5e60] px-10 py-4 text-base font-semibold text-white shadow-lg shadow-[#507c80]/20 transition hover:bg-[#244b4c]"
            >
              Book Clarity Session
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-[#dbe9e8] bg-white px-10 py-4 text-base font-semibold text-[#223433] transition hover:bg-[#f6fbfb]"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
