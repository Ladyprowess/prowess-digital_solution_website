"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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
import { SORT_OPTIONS, CLOSING_SOON_DAYS } from "@/lib/opportunities/constants";
import { DEFAULT_FILTERS, filtersFromSearchParams, searchParamsFromFilters, hasActiveFilters, type OpportunityFilters } from "@/lib/opportunities/filters";

const PAGE_SIZE = 24;

type Lookup = { id: string; slug: string; name: string };
type SkillLookup = { id: string; slug: string; name: string };

type OpportunityQueryRow = {
  id: string; slug: string; title: string;
  organisation_name: string | null; organisation_logo_url: string | null;
  location_type: "remote" | "hybrid" | "on_site" | "any";
  country: string | null; city: string | null;
  eligibility_summary: string | null; eligible_locations: string[] | null; benefit_tags: string[] | null;
  deadline_at: string | null; published_at: string | null; featured: boolean;
  opportunity_types: { name: string } | null;
  opportunity_skill_map: { skills: { slug: string; name: string } | null }[];
};

function toCardData(o: OpportunityQueryRow): OpportunityCardData {
  return {
    id: o.id, slug: o.slug, title: o.title,
    organisation_name: o.organisation_name, organisation_logo_url: o.organisation_logo_url,
    type: o.opportunity_types?.name || null,
    location_type: o.location_type, country: o.country, city: o.city,
    eligibility_summary: o.eligibility_summary, eligible_locations: o.eligible_locations, benefit_tags: o.benefit_tags,
    skills: o.opportunity_skill_map.map((m) => m.skills).filter((s): s is { slug: string; name: string } => Boolean(s)),
    deadline_at: o.deadline_at, featured: o.featured,
  };
}

const BASE_SELECT = "id, slug, title, organisation_name, organisation_logo_url, location_type, country, city, eligibility_summary, eligible_locations, benefit_tags, deadline_at, published_at, featured, opportunity_types(name), opportunity_skill_map(skills(slug, name))";

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <OpportunitiesPageContent />
    </Suspense>
  );
}

function OpportunitiesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);

  const [types, setTypes] = useState<Lookup[]>([]);
  const [skills, setSkills] = useState<SkillLookup[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [featured, setFeatured] = useState<OpportunityCardData[]>([]);
  const [closingSoon, setClosingSoon] = useState<OpportunityCardData[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("opportunity_types").select("id, slug, name").order("name"),
      supabase.from("skills").select("id, slug, name").order("name"),
    ]).then(([typeRows, skillRows]) => {
      setTypes(typeRows.data || []);
      setSkills(skillRows.data || []);
    });
  }, []);

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

  // Featured and Closing Soon strips only make sense on the default,
  // unfiltered view - once someone is actually searching, these would just
  // duplicate or confuse the main results list.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (activeFiltersPresent || filters.page > 1) {
        if (!cancelled) { setFeatured([]); setClosingSoon([]); }
        return;
      }
      const nowIso = new Date().toISOString();
      const soonIso = new Date(Date.now() + CLOSING_SOON_DAYS * 86_400_000).toISOString();
      const [f, c] = await Promise.all([
        supabase.from("opportunities").select(BASE_SELECT).eq("status", "published").eq("featured", true)
          .or(`expires_at.is.null,expires_at.gte.${nowIso}`).order("created_at", { ascending: false }).limit(6),
        supabase.from("opportunities").select(BASE_SELECT).eq("status", "published")
          .gte("deadline_at", nowIso).lte("deadline_at", soonIso)
          .or(`expires_at.is.null,expires_at.gte.${nowIso}`).order("deadline_at", { ascending: true }).limit(6),
      ]);
      if (cancelled) return;
      setFeatured(((f.data as unknown as OpportunityQueryRow[]) || []).map(toCardData));
      setClosingSoon(((c.data as unknown as OpportunityQueryRow[]) || []).map(toCardData));
    })();
    return () => { cancelled = true; };
  }, [activeFiltersPresent, filters.page]);

  const loadOpportunities = useCallback(async () => {
    setLoading(true);

    let skillOppIds: string[] | null = null;
    if (filters.skills.length > 0) {
      const skillIds = skills.filter((s) => filters.skills.includes(s.slug)).map((s) => s.id);
      if (skillIds.length === 0) {
        setOpportunities([]); setTotal(0); setLoading(false);
        return;
      }
      const { data: mapRows } = await supabase.from("opportunity_skill_map").select("opportunity_id").in("skill_id", skillIds);
      skillOppIds = Array.from(new Set((mapRows || []).map((r) => r.opportunity_id)));
      if (skillOppIds.length === 0) {
        setOpportunities([]); setTotal(0); setLoading(false);
        return;
      }
    }

    let query = supabase
      .from("opportunities")
      .select(BASE_SELECT, { count: "exact" })
      .eq("status", "published")
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`);

    if (skillOppIds) query = query.in("id", skillOppIds);
    if (filters.q.trim()) query = query.ilike("title", `%${filters.q.trim()}%`);
    if (filters.type) {
      const t = types.find((x) => x.slug === filters.type);
      if (t) query = query.eq("type_id", t.id);
    }
    if (filters.locationType) query = query.eq("location_type", filters.locationType);
    if (filters.eligibleLocation.trim()) query = query.contains("eligible_locations", [filters.eligibleLocation.trim()]);
    if (filters.fundingType) query = query.eq("funding_type", filters.fundingType);
    if (filters.applicationCost) query = query.eq("application_cost", filters.applicationCost);

    if (filters.deadlineWindow === "no_deadline") {
      query = query.is("deadline_at", null);
    } else if (filters.deadlineWindow) {
      const now = new Date();
      const days = filters.deadlineWindow === "today" ? 1 : filters.deadlineWindow === "week" ? 7 : 30;
      const until = new Date(now.getTime() + days * 86_400_000);
      query = query.gte("deadline_at", now.toISOString()).lte("deadline_at", until.toISOString());
    }

    if (filters.sort === "newest") {
      query = query.order("published_at", { ascending: false, nullsFirst: false });
    } else if (filters.sort === "deadline") {
      query = query.order("deadline_at", { ascending: true, nullsFirst: false });
    } else if (filters.sort === "featured") {
      query = query.order("featured", { ascending: false }).order("deadline_at", { ascending: true, nullsFirst: false });
    } else {
      query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
    }

    const from = (filters.page - 1) * PAGE_SIZE;
    const { data, count } = await query.range(from, from + PAGE_SIZE - 1);

    setOpportunities(((data as unknown as OpportunityQueryRow[]) || []).map(toCardData));
    setTotal(count || 0);
    setLoading(false);
  }, [filters, types, skills]);

  useEffect(() => {
    const t = setTimeout(loadOpportunities, 150);
    return () => clearTimeout(t);
  }, [loadOpportunities]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
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
              Find internships, scholarships, grants, fellowships, competitions, accelerators and other opportunities designed to help you learn, grow and build your career.
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
