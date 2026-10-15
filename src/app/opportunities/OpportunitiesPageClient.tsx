"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Pagination } from "@/components/Pagination";
import { OpportunityCard, type OpportunityCardData } from "@/components/opportunities/OpportunityCard";
import { OpportunityTypeTabs } from "@/components/opportunities/OpportunityTypeTabs";
import { OpportunityFiltersSidebar } from "@/components/opportunities/OpportunityFiltersSidebar";
import { ActiveFilterChips } from "@/components/opportunities/ActiveFilterChips";
import { OpportunitiesEmptyState } from "@/components/opportunities/OpportunitiesEmptyState";
import { OpportunityAlertsSection } from "@/components/opportunities/OpportunityAlertsSection";
import { supabase } from "@/lib/supabase";
import { SORT_OPTIONS } from "@/lib/opportunities/constants";
import { DEFAULT_FILTERS, filtersFromSearchParams, searchParamsFromFilters, hasActiveFilters, type OpportunityFilters } from "@/lib/opportunities/filters";
import {
  OPPORTUNITIES_PAGE_SIZE, fetchOpportunitiesPage, fetchOpportunityHighlights, fetchOpportunityLookups,
  type OpportunitiesPage, type OpportunityHighlights, type OpportunityLookups,
} from "@/lib/opportunities/search";

export type OpportunitiesInitialData = {
  lookups: OpportunityLookups;
  results: OpportunitiesPage;
  highlights: OpportunityHighlights;
  queryKey: string;
};

export default function OpportunitiesPageClient({ initial }: { initial?: OpportunitiesInitialData }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <OpportunitiesPageContent initial={initial} />
    </Suspense>
  );
}

function OpportunitiesPageContent({ initial }: { initial?: OpportunitiesInitialData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);
  const queryKey = searchParamsFromFilters(filters).toString();

  const [lookups, setLookups] = useState<OpportunityLookups>(initial?.lookups || { types: [], skills: [] });
  const { types, skills } = lookups;
  const [opportunities, setOpportunities] = useState<OpportunityCardData[]>(initial?.results.opportunities || []);
  const [total, setTotal] = useState(initial?.results.total || 0);
  const [loading, setLoading] = useState(!initial);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [featured, setFeatured] = useState<OpportunityCardData[]>(initial?.highlights.featured || []);
  const [closingSoon, setClosingSoon] = useState<OpportunityCardData[]>(initial?.highlights.closingSoon || []);
  // The server already rendered this exact query - skip the first client
  // fetches so the page doesn't flash back to "Loading…".
  const serverRenderedKey = useRef(initial?.queryKey ?? null);
  const serverRenderedHighlights = useRef(Boolean(initial));

  const hasServerLookups = Boolean(initial && (initial.lookups.types.length || initial.lookups.skills.length));
  useEffect(() => {
    if (hasServerLookups) return;
    fetchOpportunityLookups(supabase).then(setLookups);
  }, [hasServerLookups]);

  function updateFilters(patch: Partial<OpportunityFilters>) {
    const next: OpportunityFilters = { ...filters, ...patch };
    if (!("page" in patch)) next.page = 1;
    const qs = searchParamsFromFilters(next).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function clearAllFilters() {
    router.replace(pathname, { scroll: false });
  }

  const activeFiltersPresent = hasActiveFilters(filters);
  const showHighlights = !activeFiltersPresent && filters.page === 1;

  // Featured and Closing Soon strips only make sense on the default,
  // unfiltered view - once someone is actually searching, these would just
  // duplicate or confuse the main results list.
  useEffect(() => {
    if (serverRenderedHighlights.current) {
      serverRenderedHighlights.current = false;
      return;
    }
    let cancelled = false;
    (async () => {
      if (!showHighlights) {
        if (!cancelled) { setFeatured([]); setClosingSoon([]); }
        return;
      }
      const highlights = await fetchOpportunityHighlights(supabase);
      if (cancelled) return;
      setFeatured(highlights.featured);
      setClosingSoon(highlights.closingSoon);
    })();
    return () => { cancelled = true; };
  }, [showHighlights]);

  useEffect(() => {
    if (serverRenderedKey.current === queryKey) return;
    serverRenderedKey.current = null;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      const page = await fetchOpportunitiesPage(supabase, filters, lookups);
      if (cancelled) return;
      setOpportunities(page.opportunities);
      setTotal(page.total);
      setLoading(false);
    }, 150);
    return () => { cancelled = true; clearTimeout(t); };
  }, [filters, queryKey, lookups]);

  const totalPages = Math.max(1, Math.ceil(total / OPPORTUNITIES_PAGE_SIZE));
  const typeLabel = filters.type ? types.find((t) => t.slug === filters.type)?.name || null : null;

  const quickFilters: { label: string; patch: Partial<OpportunityFilters> }[] = [
    { label: "Remote", patch: { locationType: filters.locationType === "remote" ? "" : "remote" } },
    { label: "Global", patch: { locationType: filters.locationType === "any" ? "" : "any" } },
    { label: "Fully Funded", patch: { fundingType: filters.fundingType === "fully_funded" ? "" : "fully_funded" } },
    { label: "Closing Soon", patch: { deadlineWindow: filters.deadlineWindow === "week" ? "" : "week" } },
    { label: "Africa", patch: { eligibleLocation: filters.eligibleLocation === "Africa" ? "" : "Africa" } },
    { label: "Nigeria", patch: { eligibleLocation: filters.eligibleLocation === "Nigeria" ? "" : "Nigeria" } },
    { label: "International", patch: { eligibleLocation: filters.eligibleLocation === "International" ? "" : "International" } },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="border-b border-border bg-muted py-16 sm:py-20">
        <Container>
          <Reveal>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Discover opportunities that can move you forward.</h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Find internships, scholarships, grants, fellowships, competitions, accelerators and other opportunities designed to help you learn, grow and move forward.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-6">
              <input
                value={filters.q}
                onChange={(e) => updateFilters({ q: e.target.value })}
                placeholder="What opportunity are you looking for?"
                className="w-full rounded-xl border border-border bg-card px-5 py-3.5 text-sm text-foreground shadow-sm sm:max-w-xl"
              />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-6">
              <OpportunityTypeTabs types={types} active={filters.type} onChange={(slug) => updateFilters({ type: slug })} />
            </div>
          </Reveal>
          <Reveal delay={160}>
            <div className="mt-4 flex flex-wrap gap-2">
              {quickFilters.map((qf) => {
                const active = Object.entries(qf.patch).every(([k, v]) => filters[k as keyof OpportunityFilters] === v);
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

      {/* FEATURED + CLOSING SOON (default view only) */}
      {(featured.length > 0 || closingSoon.length > 0) && (
        <section className="border-b border-border py-12">
          <Container>
            {featured.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-bold text-foreground">Featured Opportunities</h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {featured.map((o) => <OpportunityCard key={o.id} opportunity={o} />)}
                </div>
              </div>
            )}
            {closingSoon.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-foreground">Closing Soon</h2>
                <p className="text-sm text-muted-foreground">Don&rsquo;t miss these opportunities.</p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {closingSoon.map((o) => <OpportunityCard key={o.id} opportunity={o} />)}
                </div>
              </div>
            )}
          </Container>
        </section>
      )}

      {/* RESULTS */}
      <section className="py-12 sm:py-16">
        <Container>
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((v) => !v)}
              className="mb-4 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground"
            >
              {mobileFiltersOpen ? "Hide Filters" : "Filter Opportunities"}
            </button>
            {mobileFiltersOpen && (
              <div className="mb-6">
                <OpportunityFiltersSidebar filters={filters} onChange={updateFilters} skills={skills} />
              </div>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="hidden lg:block">
              <OpportunityFiltersSidebar filters={filters} onChange={updateFilters} skills={skills} />
            </div>

            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Opportunities</h2>
                  <p className="text-sm text-muted-foreground">{loading ? "Searching…" : `${total} opportunit${total === 1 ? "y" : "ies"} found`}</p>
                </div>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilters({ sort: e.target.value as OpportunityFilters["sort"] })}
                  className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <ActiveFilterChips filters={filters} types={types} skills={skills} onChange={updateFilters} onClearAll={clearAllFilters} />

              {loading ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
              ) : opportunities.length === 0 ? (
                <OpportunitiesEmptyState
                  hasActiveFilters={activeFiltersPresent}
                  typeLabel={typeLabel}
                  onClearFilters={clearAllFilters}
                  onExploreType={() => updateFilters({ ...DEFAULT_FILTERS, type: filters.type })}
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {opportunities.map((o) => <OpportunityCard key={o.id} opportunity={o} />)}
                </div>
              )}

              <Pagination page={filters.page} totalPages={totalPages} onPageChange={(p) => updateFilters({ page: p })} />

              <OpportunityAlertsSection currentFilters={filters} types={types} skills={skills} />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
