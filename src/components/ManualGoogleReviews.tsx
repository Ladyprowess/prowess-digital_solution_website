"use client";

import React, { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";

const reviews = [
  {
    name: "Stanley Williams",
    initials: "SW",
    rating: 4,
    text: "Working with Lady prowess is an absolute delight and easy going... I will strongly recommend for guaranteed satisfaction.",
    timeAgo: "1 year ago",
  },
  {
    name: "Testers Connect",
    initials: "TC",
    rating: 5,
    text: "We had a great experience working with Prowess Digital Solutions. Their team delivered a modern, high-quality website that perfectly reflects our company and brand. Professional, responsive and easy to work with. We highly recommend their services.",
    timeAgo: "2 weeks ago",
  },
  {
    name: "Mondesconigerialtd",
    initials: "MN",
    rating: 5,
    text: "I got maximum satisfaction from the work Ngozi did for me. She is honest in dealing with people. Her work is excellent. I was doubtful and sceptical before, but she did an excellent job for me. I recommend her to the public.",
    timeAgo: "2 years ago",
  },
];

const AUTO_ADVANCE_MS = 6000;

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < count ? "text-yellow-400" : "text-slate-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function ManualGoogleReviews() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = reviews.length;

  const goTo = (i: number) => setIndex(((i % total) + total) % total);
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, total]);

  return (
    <section className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">

        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-[#507c80]">Success Stories</div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Real businesses. Real results.
            </h2>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#507c80]/20 bg-white px-4 py-2 text-sm font-medium text-[#507c80] shadow-sm">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              4.7 on Google
            </div>
          </div>
        </Reveal>

        <div
          className="relative mt-16"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Carousel arrows */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous review"
            className="absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:text-slate-900 sm:flex"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next review"
            className="absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:text-slate-900 sm:flex"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="overflow-hidden rounded-3xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {reviews.map((review, idx) => (
                <div key={idx} className="w-full flex-shrink-0 px-1">
                  <div className="flex min-h-[280px] flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
                    <div>
                      <svg className="mb-3 h-7 w-7 text-[#507c80]/25" fill="currentColor" viewBox="0 0 32 32">
                        <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H6.5C6.8 11.5 8.7 9.6 11 9.2V8h-1zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-7.5c.3-2.5 2.2-4.4 4.5-4.8V8h-1z" />
                      </svg>
                      <StarRating count={review.rating} />
                      <p className="mt-4 line-clamp-5 text-base leading-relaxed text-slate-700 sm:text-lg">
                        &ldquo;{review.text}&rdquo;
                      </p>
                    </div>

                    <div className="mt-8 flex items-center gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#507c80] text-sm font-bold text-white">
                        {review.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{review.name}</p>
                        <p className="text-xs text-slate-400">{review.timeAgo}</p>
                      </div>
                      <div className="ml-auto">
                        <svg className="h-5 w-5 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dot indicators */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {reviews.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to review ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-[#507c80]" : "w-2 bg-slate-300"}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <a
            href="https://share.google/r6YQDMKKrZyPCHReu"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#507c80] underline-offset-4 hover:underline"
          >
            Read all reviews on Google
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

      </div>
    </section>
  );
}
