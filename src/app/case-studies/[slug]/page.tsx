"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { caseStudies } from "@/data/caseStudies";

export default function CaseStudiesPage() {
  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [category, setCategory] = useState("All");
  const [size, setSize] = useState("All");

  // Build filter options from your data
  const categories = useMemo(() => {
    const set = new Set(caseStudies.map((c) => c.category));
    return ["All", ...Array.from(set)];
  }, []);

  const sizes = useMemo(() => {
    const set = new Set(caseStudies.map((c) => c.size));
    return ["All", ...Array.from(set)];
  }, []);

  // Filtered results
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return caseStudies.filter((cs) => {
      const matchSearch =
        q.length === 0 ||
        cs.title.toLowerCase().includes(q) ||
        cs.challenge.toLowerCase().includes(q) ||
        cs.solution.toLowerCase().includes(q) ||
        cs.category.toLowerCase().includes(q);

      const matchCategory = category === "All" || cs.category === category;
      const matchSize = size === "All" || cs.size === size;

      return matchSearch && matchCategory && matchSize;
    });
  }, [search, category, size]);

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setSize("All");
  };

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
          Real transformations from Nigerian businesses who started with a single Business
          Clarity Session. See how structured thinking and business expertise drive measurable,
          sustainable growth.
        </p>
      </section>

      {/* Filter + Search */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-xl border border-[#dbe9e8] bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Filter Button */}
            <button
              onClick={() => setIsFilterOpen((v) => !v)}
              className="inline-flex items-center gap-3 text-left font-semibold text-[#223433]"
            >
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
              <span className="ml-2 text-[#507c80]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </button>

            {/* Search input */}
            <div className="w-full md:max-w-md">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search case studies..."
                className="w-full rounded-lg border border-[#dbe9e8] bg-[#f9fdfd] px-4 py-3 text-sm text-[#223433] outline-none focus:border-[#507c80]"
              />
            </div>
          </div>

          {/* Filter Panel */}
          {isFilterOpen ? (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {/* Category */}
              <div>
                <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
                  CATEGORY
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#dbe9e8] bg-white px-4 py-3 text-sm text-[#223433] outline-none focus:border-[#507c80]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Size */}
              <div>
                <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
                  BUSINESS SIZE
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#dbe9e8] bg-white px-4 py-3 text-sm text-[#223433] outline-none focus:border-[#507c80]"
                >
                  {sizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-end gap-3">
                <button
                  onClick={clearFilters}
                  className="w-full rounded-lg border border-[#dbe9e8] bg-white px-4 py-3 text-sm font-semibold text-[#223433] transition hover:bg-[#f6fbfb]"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full rounded-lg bg-[#507c80] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3d5f62]"
                >
                  Done
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Result count */}
        <p className="mt-4 text-sm text-[#4d5f5e]">
          Showing <span className="font-semibold">{filtered.length}</span> case
          {filtered.length === 1 ? " study" : " studies"}
        </p>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((cs) => (
            <article
              key={cs.slug}
              className="overflow-hidden rounded-2xl border border-[#dbe9e8] bg-white shadow-sm"
            >
              <div className="relative h-56 w-full">
                <Image src={cs.image} alt={cs.title} fill className="object-cover" />
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
                <h2 className="text-2xl font-semibold text-[#223433]">{cs.title}</h2>

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
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-[#dbe9e8] bg-white p-10 text-center">
            <h3 className="text-xl font-semibold text-[#223433]">No results found</h3>
            <p className="mt-2 text-sm text-[#4d5f5e]">
              Try a different keyword or clear your filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-6 rounded-lg bg-[#507c80] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#3d5f62]"
            >
              Clear Filters
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
