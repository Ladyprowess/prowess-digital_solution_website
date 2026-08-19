"use client";

import { useEffect, useMemo, useState } from "react";
import ResourceCard, { ResourceItem } from "@/components/resources/ResourceCard";

const categories = [
  "Getting Started",
  "Business Systems",
  "Strategy & Growth",
  "Business Setup",
  "Marketing",
  "Financial Planning",
  "Customer Experience",
  "Personal Development",
];

const stages = ["Starting Out", "Growing", "Scaling", "All Stages"];

const types = [
  "PDF Guide",
  "PDF Checklist",
  "PDF Workbook",
  "PDF Workshop",
  "Word Template",
  "Excel Template",
];

export default function ResourcesBrowser() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("popular");
  const [category, setCategory] = useState("");
  const [stage, setStage] = useState("");
  const [type, setType] = useState("");

  const [items, setItems] = useState<ResourceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // ✅ Mobile filters collapse
  const [showFilters, setShowFilters] = useState(false);

  // Fetched a page at a time from the server (not the whole table) so this
  // stays fast no matter how many resources exist - "View more" fetches the
  // next page instead of revealing more of an already-fully-loaded list.
  const STEP = 6;
  const [page, setPage] = useState(1);

  async function load(pageToLoad: number, replace: boolean) {
    if (replace) setLoading(true); else setLoadingMore(true);

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);
    if (category) params.set("category", category);
    if (stage) params.set("stage", stage);
    if (type) params.set("type", type);
    params.set("page", String(pageToLoad));
    params.set("pageSize", String(STEP));

    const res = await fetch(`/api/resources?${params.toString()}`, {
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    setItems((prev) => (replace ? data?.items || [] : [...prev, ...(data?.items || [])]));
    setTotal(data?.total || 0);
    setLoading(false);
    setLoadingMore(false);
  }

  // Load on first render + when filters change (small debounce for search)
  useEffect(() => {
    setPage(1);

    const t = setTimeout(() => load(1, true), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sort, category, stage, type]);

  const visibleItems = items;
  const canViewMore = items.length < total;

  function viewMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    load(nextPage, false);
  }

  const clearFilters = () => {
    setCategory("");
    setStage("");
    setType("");
  };

  const activeFilters = useMemo(() => {
    return [category, stage, type].filter(Boolean).length;
  }, [category, stage, type]);

  return (
    <div className="space-y-8">
      {/* ✅ Search bar */}
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="text-slate-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search resources, guides, templates..."
            className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ✅ Mobile: Filters toggle button */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left font-semibold text-slate-900 shadow-sm"
        >
          Filters {showFilters ? "▲" : "▼"}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* ✅ Filters (collapsible on mobile, always visible on desktop) */}
        <aside
          className={[
            "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit",
            "lg:block",
            showFilters ? "block" : "hidden",
          ].join(" ")}
        >
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-slate-900">Filters</p>

            {activeFilters ? (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-[var(--steel-teal)] hover:underline"
                type="button"
              >
                Clear
              </button>
            ) : null}
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"
              >
                <option value="">All</option>
                {categories.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"
              >
                <option value="">All</option>
                {stages.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"
              >
                <option value="">All</option>
                {types.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Mobile: Close filters button */}
            <div className="lg:hidden pt-2">
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                Done
              </button>
            </div>
          </div>
        </aside>

        {/* ✅ List */}
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-700">
              {loading
                ? "Loading resources..."
                : `Showing ${items.length} of ${total} resource${
                    total === 1 ? "" : "s"
                  }`}
            </p>

            {/* ✅ Sort: full width on mobile */}
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
              <span className="text-sm text-slate-500">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[420px] rounded-2xl border border-slate-200 bg-white animate-pulse"
                />
              ))}
            </div>
          ) : total === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">
              No resources found. Try a different search or clear filters.
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                {visibleItems.map((item) => (
                  <ResourceCard key={item.id} item={item} />
                ))}
              </div>

              {canViewMore && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={viewMore}
                    disabled={loadingMore}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                  >
                    {loadingMore ? "Loading..." : "View more"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
