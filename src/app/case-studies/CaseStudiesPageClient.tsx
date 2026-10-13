"use client";

import { useEffect, useMemo, useState } from "react";
import AgencyPageHeader from "@/components/AgencyPageHeader";
import { LoadError } from "@/components/LoadError";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";

type ResultItem = { label: string; value: string };

type CaseStudy = {
  id: string;
  title: string;
  slug: string;
  category: string;
  business_size: string;
  challenge: string;
  solution?: string | null;
  image_url?: string | null;
  is_published: boolean;
  created_at: string;

  results?: ResultItem[] | string | null;
  testimonial?: string | null;
  timeline_months?: number | null;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default function CaseStudiesPageClient() {
  const PAGE_SIZE = 6;

  const [items, setItems] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [requestedPage, setRequestedPage] = useState(1);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [category, setCategory] = useState("All");
  const [size, setSize] = useState("All");

  const normaliseResults = (input: CaseStudy["results"]): ResultItem[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input;

    if (typeof input === "string") {
      try {
        const parsed = JSON.parse(input);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return [];
  };

  const load = async (page: number) => {
    setRequestedPage(page);
    setLoading(true);
    setLoadError(false);

    try {
      const res = await fetch(
        `/api/case-studies?published=true&page=${page}&pageSize=${PAGE_SIZE}`,
        { cache: "no-store" }
      );

      const text = await res.text();
      let json: { ok?: boolean; error?: string; items?: CaseStudy[]; pagination?: Pagination } | null = null;

      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        throw new Error(`Request failed (${res.status}).`);
      }

      if (!json?.ok) {
        throw new Error(json?.error || "Failed to load");
      }

      setItems((json.items || []) as CaseStudy[]);

      const p = (json.pagination || null) as Pagination | null;
      if (p && typeof p.page === "number") {
        setPagination(p);
      } else {
        setPagination({ page, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
      }
    } catch (e) {
      console.error(e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const categories = useMemo(() => {
    const set = new Set(items.map((c) => c.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [items]);

  const sizes = useMemo(() => {
    const set = new Set(items.map((c) => c.business_size).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((c) => {
      return (
        (category === "All" || c.category === category) &&
        (size === "All" || c.business_size === size)
      );
    });
  }, [items, category, size]);

  const goToPage = (p: number) => {
    const next = Math.min(Math.max(1, p), pagination.totalPages);
    load(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageButtons = useMemo(() => {
    const total = pagination.totalPages;
    const current = pagination.page;

    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);

    const nums: number[] = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [pagination.page, pagination.totalPages]);

  return (
    <div className="pb-16">
      <AgencyPageHeader
        eyebrow="Case Studies"
        title={
          <>
            Client success <span className="text-primary">stories.</span>
          </>
        }
        description="Real transformations from businesses who started with a single Business Structure Diagnostic. See how clear thinking and simple systems lead to steady, measurable growth."
        primaryAction={{ label: "See Success Stories", href: "#results" }}
        secondaryAction={{ label: "Start the Diagnostic", href: "/contact?service=business-structure-diagnostic" }}
        proof={[
          "Real client challenges and solutions",
          "Measured results, not vague promises",
          "Across categories and business sizes",
        ]}
      />

      {/* CONTENT */}
      <section id="results" className="py-12 sm:py-16">
        <Container>
          {/* Filter */}
          <Reveal>
            <div className="mb-8 rounded-2xl border border-border bg-card shadow-sm">
              <button
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-6 py-5 text-left font-semibold text-foreground"
              >
                <span className="flex items-center gap-3">
                  <span className="text-primary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 5h16l-6 7v6l-4 2v-8L4 5z"
                        stroke="currentColor"
                        strokeWidth="2"
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
                <div className="border-t border-border px-6 py-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-xs font-semibold tracking-widest text-muted-foreground">
                        CATEGORY
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold tracking-widest text-muted-foreground">
                        BUSINESS SIZE
                      </label>
                      <select
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground"
                      >
                        {sizes.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setCategory("All");
                          setSize("All");
                        }}
                        className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                      >
                        Clear
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Reveal>

          {/* Grid + Accordion */}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading case studies…</p>
          ) : loadError ? (
            <LoadError message="We couldn’t load the case studies. Please try again." onRetry={() => load(requestedPage)} />
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <h3 className="text-xl font-semibold text-foreground">
                No case studies found
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try changing the filters or clear them.
              </p>
            </div>
          ) : (
            <>
              <section className="grid gap-6 md:grid-cols-2">
                {filtered.map((cs, i) => {
                  const results = normaliseResults(cs.results);

                  return (
                    <Reveal key={cs.id} delay={i * 80}>
                      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                        <div className="relative h-56 w-full bg-muted">
                          {cs.image_url ? (
                            <img
                              src={cs.image_url}
                              alt={cs.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : null}

                          <div className="absolute left-4 top-4 flex gap-2">
                            <span className="rounded-full bg-foreground/90 px-3 py-1 text-xs font-semibold text-background">
                              {cs.category}
                            </span>
                            <span className="rounded-full bg-foreground/90 px-3 py-1 text-xs font-semibold text-background">
                              {cs.business_size}
                            </span>
                          </div>
                        </div>

                        <div className="p-6">
                          <h2 className="text-2xl font-semibold text-foreground">
                            {cs.title}
                          </h2>

                          <div className="mt-6">
                            <h3 className="text-sm font-semibold tracking-widest text-muted-foreground">
                              CHALLENGE
                            </h3>
                            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                              {cs.challenge}
                            </p>
                          </div>

                          <details className="group mt-6">
                            <summary className="flex cursor-pointer list-none items-center justify-center gap-3 rounded-xl bg-primary/10 px-5 py-4 text-sm font-semibold text-foreground transition hover:bg-primary/15">
                              <span className="group-open:hidden">
                                View Full Case Study
                              </span>
                              <span className="hidden group-open:inline">
                                Hide Case Study
                              </span>

                              <svg
                                className="h-5 w-5 transition-transform group-open:rotate-180"
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
                            </summary>

                            <div className="mt-6 space-y-8">
                              {cs.solution ? (
                                <div>
                                  <h3 className="text-sm font-semibold tracking-widest text-muted-foreground">
                                    SOLUTION
                                  </h3>
                                  <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                                    {cs.solution}
                                  </p>
                                </div>
                              ) : null}

                              {results.length > 0 ? (
                                <div>
                                  <h3 className="text-sm font-semibold tracking-widest text-muted-foreground">
                                    RESULTS ACHIEVED
                                  </h3>

                                  <div className="mt-4 grid gap-3">
                                    {results.map((r, idx) => (
                                      <div
                                        key={`${r.label}-${idx}`}
                                        className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-4"
                                      >
                                        <span className="text-sm text-foreground">
                                          {r.label}
                                        </span>
                                        <span className="text-sm font-semibold text-primary">
                                          {r.value}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              {cs.testimonial ? (
                                <div className="rounded-xl border border-border bg-background p-5">
                                  <p className="italic leading-relaxed text-foreground">
                                    “{cs.testimonial}”
                                  </p>
                                </div>
                              ) : null}

                              {typeof cs.timeline_months === "number" ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>
                                    Timeline: {cs.timeline_months} months
                                  </span>
                                </div>
                              ) : null}

                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    const details = e.currentTarget.closest(
                                      "details"
                                    ) as HTMLDetailsElement | null;
                                    if (details) details.open = false;
                                  }}
                                  className="text-sm font-semibold text-primary hover:underline"
                                >
                                  Show Less
                                </button>
                              </div>
                            </div>
                          </details>
                        </div>
                      </article>
                    </Reveal>
                  );
                })}
              </section>

              {/* Pagination (6 per page) */}
              <div className="mt-10 flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} •{" "}
                  {pagination.total} total
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
                  >
                    Prev
                  </button>

                  {pageButtons.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => goToPage(p)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        p === pagination.page
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card text-foreground hover:bg-muted"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </Container>
      </section>
    </div>
  );
}
