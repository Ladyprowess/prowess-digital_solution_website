"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Pagination } from "@/components/Pagination";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFiltersSidebar } from "@/components/jobs/JobFiltersSidebar";
import { ActiveFilterChips } from "@/components/jobs/ActiveFilterChips";
import { JobsEmptyState } from "@/components/jobs/JobsEmptyState";
import { JobAlertsSection } from "@/components/jobs/JobAlertsSection";
import { supabase } from "@/lib/supabase";
import { SORT_OPTIONS } from "@/lib/jobs/constants";
import { DEFAULT_FILTERS, filtersFromSearchParams, searchParamsFromFilters, hasActiveFilters, type JobFilters } from "@/lib/jobs/filters";
import { JOBS_PAGE_SIZE, fetchJobLookups, fetchJobsPage, type JobLookups, type JobsPage } from "@/lib/jobs/search";

export type JobsInitialData = { lookups: JobLookups; results: JobsPage; queryKey: string };

export default function JobsPageClient({ initial }: { initial?: JobsInitialData }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <JobsPageContent initial={initial} />
    </Suspense>
  );
}

function JobsPageContent({ initial }: { initial?: JobsInitialData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);
  const queryKey = searchParamsFromFilters(filters).toString();

  const [lookups, setLookups] = useState<JobLookups>(initial?.lookups || { categories: [], types: [], skills: [] });
  const { categories, types, skills } = lookups;
  const [jobs, setJobs] = useState(initial?.results.jobs || []);
  const [total, setTotal] = useState(initial?.results.total || 0);
  const [loading, setLoading] = useState(!initial);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  // The server already rendered results for this exact query - skip the
  // first client fetch so the list doesn't flash back to "Loading…".
  const serverRenderedKey = useRef(initial?.queryKey ?? null);

  const hasServerLookups = Boolean(initial && (initial.lookups.categories.length || initial.lookups.types.length || initial.lookups.skills.length));
  useEffect(() => {
    if (hasServerLookups) return;
    fetchJobLookups(supabase).then(setLookups);
  }, [hasServerLookups]);

  function updateFilters(patch: Partial<JobFilters>) {
    const next: JobFilters = { ...filters, ...patch };
    // Any real filter change re-starts from page 1 - staying on page 4 of a
    // now-different result set would show a confusing, possibly-empty page.
    if (!("page" in patch)) next.page = 1;
    const qs = searchParamsFromFilters(next).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function clearAllFilters() {
    router.replace(pathname, { scroll: false });
  }

  useEffect(() => {
    if (serverRenderedKey.current === queryKey) return;
    serverRenderedKey.current = null;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      const page = await fetchJobsPage(supabase, filters, lookups);
      if (cancelled) return;
      setJobs(page.jobs);
      setTotal(page.total);
      setLoading(false);
    }, 150);
    return () => { cancelled = true; clearTimeout(t); };
  }, [filters, queryKey, lookups]);

  const totalPages = Math.max(1, Math.ceil(total / JOBS_PAGE_SIZE));
  const activeFiltersPresent = hasActiveFilters(filters);
  const categoryLabel = filters.category ? categories.find((c) => c.slug === filters.category)?.name || null : null;

  const quickFilters: { label: string; patch: Partial<JobFilters> }[] = [
    { label: "Remote", patch: { locationType: filters.locationType === "remote" ? "" : "remote" } },
    { label: "Entry Level", patch: { experience: filters.experience === "entry" ? "" : "entry" } },
    { label: "Recently Added", patch: { datePosted: filters.datePosted === "7" ? "" : "7" } },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="border-b border-border bg-muted py-16 sm:py-20">
        <Container>
          <Reveal>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Find your next opportunity.</h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Explore jobs from different companies, industries and locations. Search by role, skill, location or career path and find opportunities that match where you want to go.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                value={filters.q}
                onChange={(e) => updateFilters({ q: e.target.value })}
                placeholder="What job are you looking for?"
                className="w-full rounded-xl border border-border bg-card px-5 py-3.5 text-sm text-foreground shadow-sm"
              />
              <input
                value={filters.country}
                onChange={(e) => updateFilters({ country: e.target.value })}
                placeholder="Where? e.g. Lagos, Remote"
                className="w-full rounded-xl border border-border bg-card px-5 py-3.5 text-sm text-foreground shadow-sm sm:max-w-xs"
              />
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="mt-4 flex flex-wrap gap-2">
              {quickFilters.map((qf) => {
                const active = Object.entries(qf.patch).every(([k, v]) => filters[k as keyof JobFilters] === v);
                return (
                  <button
                    key={qf.label}
                    type="button"
                    onClick={() => updateFilters(qf.patch)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                      active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {qf.label}
                  </button>
                );
              })}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* RESULTS */}
      <section className="py-12 sm:py-16">
        <Container>
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((v) => !v)}
              className="mb-4 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground"
            >
              {mobileFiltersOpen ? "Hide Filters" : "Filter Jobs"}
            </button>
            {mobileFiltersOpen && (
              <div className="mb-6">
                <JobFiltersSidebar filters={filters} onChange={updateFilters} categories={categories} types={types} skills={skills} />
              </div>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="hidden lg:block">
              <JobFiltersSidebar filters={filters} onChange={updateFilters} categories={categories} types={types} skills={skills} />
            </div>

            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Jobs</h2>
                  <p className="text-sm text-muted-foreground">{loading ? "Searching…" : `${total} opportunit${total === 1 ? "y" : "ies"} found`}</p>
                </div>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilters({ sort: e.target.value as JobFilters["sort"] })}
                  className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {(filters.sort === "salary_high" || filters.sort === "salary_low") && (
                <p className="mb-4 text-xs text-muted-foreground">Salaries are shown in their original currency - this sort compares the numbers as listed, not converted values.</p>
              )}

              <ActiveFilterChips filters={filters} categories={categories} types={types} skills={skills} onChange={updateFilters} onClearAll={clearAllFilters} />

              {loading ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
              ) : jobs.length === 0 ? (
                <JobsEmptyState
                  hasActiveFilters={activeFiltersPresent}
                  categoryLabel={categoryLabel}
                  onClearFilters={clearAllFilters}
                  onExploreCategory={() => updateFilters({ ...DEFAULT_FILTERS, category: filters.category })}
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {jobs.map((j) => <JobCard key={j.id} job={j} />)}
                </div>
              )}

              <Pagination page={filters.page} totalPages={totalPages} onPageChange={(p) => updateFilters({ page: p })} />

              <JobAlertsSection currentFilters={filters} categories={categories} skills={skills} />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
