"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Pagination } from "@/components/Pagination";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { JobFiltersSidebar } from "@/components/jobs/JobFiltersSidebar";
import { ActiveFilterChips } from "@/components/jobs/ActiveFilterChips";
import { JobsEmptyState } from "@/components/jobs/JobsEmptyState";
import { JobAlertsSection } from "@/components/jobs/JobAlertsSection";
import { supabase } from "@/lib/supabase";
import { SORT_OPTIONS, CLOSING_SOON_DAYS } from "@/lib/jobs/constants";
import { DEFAULT_FILTERS, filtersFromSearchParams, searchParamsFromFilters, hasActiveFilters, type JobFilters } from "@/lib/jobs/filters";

const PAGE_SIZE = 12;

type Lookup = { id: string; slug: string; name: string };
type SkillLookup = { id: string; slug: string; name: string };

type JobQueryRow = {
  id: string; slug: string; title: string;
  location_type: "remote" | "hybrid" | "on_site";
  country: string | null; city: string | null;
  salary_min: number | null; salary_max: number | null; salary_currency: string | null; salary_period: string | null;
  experience_level: string | null;
  deadline_at: string | null; published_at: string | null; featured: boolean;
  companies: { name: string; logo_url: string | null; verified: boolean } | null;
  job_categories: { name: string } | null;
  job_types: { name: string } | null;
  job_skill_map: { skills: { slug: string; name: string } | null }[];
};

function toCardData(j: JobQueryRow): JobCardData {
  return {
    id: j.id, slug: j.slug, title: j.title,
    company: j.companies,
    category: j.job_categories?.name || null,
    location_type: j.location_type, country: j.country, city: j.city,
    job_type: j.job_types?.name || null,
    experience_level: j.experience_level,
    salary_min: j.salary_min, salary_max: j.salary_max, salary_currency: j.salary_currency, salary_period: j.salary_period,
    skills: j.job_skill_map.map((m) => m.skills).filter((s): s is { slug: string; name: string } => Boolean(s)),
    published_at: j.published_at, deadline_at: j.deadline_at, featured: j.featured,
  };
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <JobsPageContent />
    </Suspense>
  );
}

function JobsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);

  const [categories, setCategories] = useState<Lookup[]>([]);
  const [types, setTypes] = useState<Lookup[]>([]);
  const [skills, setSkills] = useState<SkillLookup[]>([]);
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("job_categories").select("id, slug, name").order("name"),
      supabase.from("job_types").select("id, slug, name").order("name"),
      supabase.from("skills").select("id, slug, name").order("name"),
    ]).then(([cats, jobTypes, skillRows]) => {
      setCategories(cats.data || []);
      setTypes(jobTypes.data || []);
      setSkills(skillRows.data || []);
    });
  }, []);

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

  const loadJobs = useCallback(async () => {
    setLoading(true);

    // Skill filtering is resolved as a separate id lookup rather than an
    // inner join on job_skill_map, so a job matching 2 of 3 selected
    // skills doesn't come back as 2 duplicate rows that would then need
    // deduping before pagination/count means anything.
    let skillJobIds: string[] | null = null;
    if (filters.skills.length > 0) {
      const skillIds = skills.filter((s) => filters.skills.includes(s.slug)).map((s) => s.id);
      if (skillIds.length === 0) {
        setJobs([]); setTotal(0); setLoading(false);
        return;
      }
      const { data: mapRows } = await supabase.from("job_skill_map").select("job_id").in("skill_id", skillIds);
      skillJobIds = Array.from(new Set((mapRows || []).map((r) => r.job_id)));
      if (skillJobIds.length === 0) {
        setJobs([]); setTotal(0); setLoading(false);
        return;
      }
    }

    let query = supabase
      .from("jobs")
      .select(
        "id, slug, title, location_type, country, city, salary_min, salary_max, salary_currency, salary_period, experience_level, deadline_at, published_at, featured, companies!inner(name, logo_url, verified), job_categories(name), job_types(name), job_skill_map(skills(slug, name))",
        { count: "exact" }
      )
      .eq("status", "published")
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`);

    if (skillJobIds) query = query.in("id", skillJobIds);
    if (filters.q.trim()) query = query.ilike("title", `%${filters.q.trim()}%`);
    if (filters.category) {
      const cat = categories.find((c) => c.slug === filters.category);
      if (cat) query = query.eq("category_id", cat.id);
    }
    if (filters.type) {
      const t = types.find((x) => x.slug === filters.type);
      if (t) query = query.eq("type_id", t.id);
    }
    if (filters.locationType) query = query.eq("location_type", filters.locationType);
    if (filters.country.trim()) query = query.ilike("country", `%${filters.country.trim()}%`);
    if (filters.experience) query = query.eq("experience_level", filters.experience);
    if (filters.salaryMin) query = query.gte("salary_max", Number(filters.salaryMin));
    if (filters.salaryMax) query = query.lte("salary_min", Number(filters.salaryMax));
    if (filters.currency.trim()) query = query.eq("salary_currency", filters.currency.trim().toUpperCase());
    if (filters.datePosted) {
      const since = new Date(Date.now() - Number(filters.datePosted) * 86_400_000).toISOString();
      query = query.gte("published_at", since);
    }
    if (filters.closingSoon) {
      const soon = new Date(Date.now() + CLOSING_SOON_DAYS * 86_400_000).toISOString();
      query = query.gte("deadline_at", new Date().toISOString()).lte("deadline_at", soon);
    }
    if (filters.company.trim()) query = query.ilike("companies.name", `%${filters.company.trim()}%`);

    if (filters.sort === "newest") {
      query = query.order("published_at", { ascending: false, nullsFirst: false });
    } else if (filters.sort === "deadline") {
      query = query.order("deadline_at", { ascending: true, nullsFirst: false });
    } else if (filters.sort === "salary_high") {
      query = query.order("salary_max", { ascending: false, nullsFirst: false });
    } else if (filters.sort === "salary_low") {
      query = query.order("salary_min", { ascending: true, nullsFirst: false });
    } else {
      query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
    }

    const from = (filters.page - 1) * PAGE_SIZE;
    const { data, count } = await query.range(from, from + PAGE_SIZE - 1);

    setJobs(((data as unknown as JobQueryRow[]) || []).map(toCardData));
    setTotal(count || 0);
    setLoading(false);
  }, [filters, categories, types, skills]);

  useEffect(() => {
    const t = setTimeout(loadJobs, 150);
    return () => clearTimeout(t);
  }, [loadJobs]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
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
