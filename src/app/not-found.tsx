// src/app/not-found.tsx
"use client";

import Link from "next/link";
import Container from "@/components/Container";

export default function NotFound() {
  return (
    <div className="page-wrap">
      <section className="section bg-[#eef6f6]">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
              <svg
                className="h-7 w-7 text-[#507c80]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.3 7.7a1 1 0 011.4 0l1.3 1.3 1.3-1.3a1 1 0 011.4 1.4L15.4 10.4l1.3 1.3a1 1 0 01-1.4 1.4l-1.3-1.3-1.3 1.3a1 1 0 01-1.4-1.4l1.3-1.3-1.3-1.3a1 1 0 010-1.4z"
                />
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 22a10 10 0 110-20 10 10 0 010 20z"
                />
              </svg>
            </div>

            <p className="text-sm font-semibold uppercase tracking-wide text-[#507c80]">404</p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-5xl">
              This page does not exist
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              It looks like the link is wrong, the page was moved, or it was removed. No stress — you can go back home
              or choose one of the options below.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/" className="w-full sm:w-auto">
                <button className="w-full rounded-xl bg-[#507c80] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#507c80]/20 transition hover:opacity-95 sm:w-auto">
                  Go to Home
                </button>
              </Link>

              <Link href="/services" className="w-full sm:w-auto">
                <button className="w-full rounded-xl border border-[#507c80] bg-white px-8 py-4 text-base font-semibold text-[#507c80] shadow-sm transition hover:bg-[#507c80]/5 sm:w-auto">
                  View Services
                </button>
              </Link>

              <Link href="/contact" className="w-full sm:w-auto">
                <button className="w-full rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto">
                  Contact Us
                </button>
              </Link>
            </div>

            <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Quick links</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Link className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50" href="/about">
                  About Us
                </Link>
                <Link className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50" href="/resources">
                  Resources
                </Link>
                <Link className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50" href="/case-studies">
                  Case Studies
                </Link>
                <Link className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50" href="/blog">
                  Blog
                </Link>
              </div>
            </div>

            <p className="mt-8 text-sm text-slate-500">
              If you typed the address yourself, please check the spelling.
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}
