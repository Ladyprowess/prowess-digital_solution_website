"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowRight, BookOpen, BriefcaseBusiness, GraduationCap, Layers, Search } from "lucide-react";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Pagination } from "@/components/Pagination";
import { LearnCard } from "@/components/learn/LearnCard";
import { LearnFiltersSidebar } from "@/components/learn/LearnFiltersSidebar";
import { supabase } from "@/lib/supabase";
import { SORT_OPTIONS } from "@/lib/learn/constants";
import { filtersFromSearchParams, searchParamsFromFilters, hasActiveFilters, type LearnFilters } from "@/lib/learn/filters";
import { stripHtmlForMeta } from "@/lib/stripHtml";
import {
  courseToLearnItem, COURSE_SELECT,
  type LearnItem, type CourseRow,
} from "@/lib/learn/types";

const PAGE_SIZE = 12;

type SkillLookup = { id: string; slug: string; name: string; description: string | null };
type CareerPathLookup = { slug: string; title: string; description: string | null };

export default function LearnPageClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LearnPageContent />
    </Suspense>
  );
}

function LearnPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);

  const [skills, setSkills] = useState<SkillLookup[]>([]);
  const [careerPaths, setCareerPaths] = useState<CareerPathLookup[]>([]);
  const [skillUsage, setSkillUsage] = useState<Record<string, number>>({});
  const [items, setItems] = useState<LearnItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [featured, setFeatured] = useState<LearnItem[]>([]);

  useEffect(() => {
    (async () => {
      const [skillRows, pathRows, courseMapRows] = await Promise.all([
        supabase.from("skills").select("id, slug, name, description").order("name"),
        supabase.from("career_paths").select("slug, title, description").eq("status", "published").order("title"),
        supabase.from("course_skill_map").select("skill_id"),
      ]);
      setSkills(skillRows.data || []);
      setCareerPaths(pathRows.data || []);

      const usage: Record<string, number> = {};
      for (const row of courseMapRows.data || []) usage[row.skill_id] = (usage[row.skill_id] || 0) + 1;
      setSkillUsage(usage);
    })();
  }, []);

  function updateFilters(patch: Partial<LearnFilters>) {
    const next: LearnFilters = { ...filters, ...patch };
    if (!("page" in patch)) next.page = 1;
    const qs = searchParamsFromFilters(next).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function clearAllFilters() {
    router.replace(pathname, { scroll: false });
  }

  const activeFiltersPresent = hasActiveFilters(filters);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (activeFiltersPresent || filters.page > 1) {
        if (!cancelled) setFeatured([]);
        return;
      }
      const { data } = await supabase.from("courses").select(COURSE_SELECT).eq("status", "published").eq("featured", true).order("created_at", { ascending: false }).limit(6);
      if (cancelled) return;
      setFeatured(((data as unknown as CourseRow[]) || []).map(courseToLearnItem));
    })();
    return () => { cancelled = true; };
  }, [activeFiltersPresent, filters.page]);

  const loadItems = useCallback(async () => {
    setLoading(true);

    const skillIds = filters.skills.length > 0 ? skills.filter((s) => filters.skills.includes(s.slug)).map((s) => s.id) : null;
    if (filters.skills.length > 0 && (!skillIds || skillIds.length === 0)) {
      setItems([]); setTotal(0); setLoading(false);
      return;
    }

    let ids: string[] | null = null;
    if (skillIds) {
      const { data } = await supabase.from("course_skill_map").select("course_id").in("skill_id", skillIds);
      ids = Array.from(new Set((data || []).map((r) => r.course_id)));
      if (ids.length === 0) {
        setItems([]); setTotal(0); setLoading(false);
        return;
      }
    }
    let q = supabase.from("courses").select(COURSE_SELECT).eq("status", "published");
    if (ids) q = q.in("id", ids);
    if (filters.q.trim()) q = q.ilike("title", `%${filters.q.trim()}%`);
    if (filters.level) q = q.eq("level", filters.level);
    if (filters.access) q = q.eq("access", filters.access);
    const { data } = await q;
    let merged = ((data as unknown as CourseRow[]) || []).map(courseToLearnItem);

    if (filters.sort === "newest") {
      merged = merged.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    } else {
      merged = merged.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });
    }

    setTotal(merged.length);
    const from = (filters.page - 1) * PAGE_SIZE;
    setItems(merged.slice(from, from + PAGE_SIZE));
    setLoading(false);
  }, [filters, skills]);

  useEffect(() => {
    const t = setTimeout(loadItems, 150);
    return () => clearTimeout(t);
  }, [loadItems]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const popularSkills = useMemo(() => {
    return [...skills]
      .filter((s) => skillUsage[s.id] > 0)
      .sort((a, b) => (skillUsage[b.id] || 0) - (skillUsage[a.id] || 0))
      .slice(0, 10);
  }, [skills, skillUsage]);

  const learningTotals = useMemo(() => {
    return [
      { label: "Results", value: total },
      { label: "Courses", value: total },
      { label: "Skills", value: popularSkills.length },
    ];
  }, [popularSkills.length, total]);

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-brand-bg py-12 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <Reveal>
              <div>
                <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                  <GraduationCap size={14} aria-hidden="true" />
                  Learn
                </div>
                <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                  Build practical skills through structured courses.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  Find focused courses for career growth, business skills, digital work and personal development.
                </p>
                <div className="relative mt-7 max-w-2xl">
                  <label htmlFor="learn-search" className="sr-only">Search courses</label>
                  <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="learn-search"
                    value={filters.q}
                    onChange={(e) => updateFilters({ q: e.target.value })}
                    placeholder="Search courses or skills"
                    className="min-h-12 w-full rounded-lg border border-border bg-card pl-11 pr-4 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <p className="text-sm font-bold text-foreground">Your learning workspace</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Everything you&apos;re learning, in one place.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {learningTotals.map((stat) => (
                    <div key={stat.label} className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-lg font-bold text-foreground">{loading ? "..." : stat.value}</p>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <Link href="/account/learning" className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  Open saved learning
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          </div>

          {popularSkills.length > 0 && (
            <Reveal delay={160}>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Popular</span>
                {popularSkills.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => updateFilters({ skills: [s.slug] })}
                    className="min-h-10 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </Reveal>
          )}
        </Container>
      </section>

      {/* LEARN BY SKILL */}
      {!activeFiltersPresent && popularSkills.length > 0 && (
        <section className="border-b border-border py-14">
          <Container>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Skills</p>
                <h2 className="mt-2 text-xl font-bold text-foreground">What do you want to get better at?</h2>
              </div>
              <Link href="/skills" className="inline-flex min-h-10 flex-shrink-0 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                View all skills
              </Link>
            </div>
            {/* Fixed to one row that scrolls sideways - however many skills exist,
                this section never grows the page's height. */}
            <div className="mt-5 -mx-4 flex flex-nowrap gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {popularSkills.map((s) => (
                <Link
                  key={s.slug}
                  href={`/skills/${s.slug}`}
                  className="group flex min-h-11 flex-shrink-0 items-center gap-2 rounded-full border border-border bg-card pl-4 pr-2.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {s.name}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground group-hover:bg-card">
                    {skillUsage[s.id] || 0}
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* LEARN FOR A CAREER */}
      {!activeFiltersPresent && careerPaths.length > 0 && (
        <section className="border-b border-border bg-muted py-14">
          <Container>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Career paths</p>
                <h2 className="mt-2 text-xl font-bold text-foreground">Learn for a career direction</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Explore a path and see the skills, courses, jobs and opportunities connected to it.</p>
              </div>
              <Link href="/career-paths" className="inline-flex min-h-10 flex-shrink-0 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                View all
              </Link>
            </div>
            {/* Same fixed-height, horizontal-scroll pattern as the skills row
                above - a growing list of career paths widens the scroll area
                instead of pushing the rest of the page down. */}
            <div className="mt-5 -mx-4 flex flex-nowrap gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {careerPaths.slice(0, 12).map((p) => (
                <Link
                  key={p.slug}
                  href={`/career-paths/${p.slug}`}
                  className="w-64 flex-shrink-0 rounded-lg border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BriefcaseBusiness size={18} aria-hidden="true" />
                  </div>
                  <p className="mt-4 font-semibold text-foreground">{p.title}</p>
                  {p.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{stripHtmlForMeta(p.description, 120)}</p>}
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* FEATURED LEARNING */}
      {featured.length > 0 && (
        <section className="border-b border-border py-14">
          <Container>
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-primary" aria-hidden="true" />
              <h2 className="text-xl font-bold text-foreground">Featured learning</h2>
            </div>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {featured.map((item) => <LearnCard key={`${item.kind}-${item.id}`} item={item} />)}
            </div>
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
              className="mb-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Layers size={16} aria-hidden="true" />
              {mobileFiltersOpen ? "Hide Filters" : "Filter Learning"}
            </button>
            {mobileFiltersOpen && (
              <div className="mb-6">
                <LearnFiltersSidebar filters={filters} onChange={updateFilters} skills={skills} />
              </div>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="hidden lg:block">
              <LearnFiltersSidebar filters={filters} onChange={updateFilters} skills={skills} />
            </div>

            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">Explore</p>
                  <h2 className="mt-2 text-xl font-bold text-foreground">Course library</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{loading ? "Searching…" : `${total} item${total === 1 ? "" : "s"} found`}</p>
                </div>
                <label className="sr-only" htmlFor="learn-sort">Sort learning items</label>
                <select
                  id="learn-sort"
                  value={filters.sort}
                  onChange={(e) => updateFilters({ sort: e.target.value as LearnFilters["sort"] })}
                  className="min-h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="min-h-[360px] rounded-lg border border-border bg-card">
                      <div className="h-40 rounded-t-lg bg-muted" />
                      <div className="p-6">
                        <div className="h-4 w-24 rounded bg-muted" />
                        <div className="mt-5 h-5 w-4/5 rounded bg-muted" />
                        <div className="mt-3 h-3 w-full rounded bg-muted" />
                        <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center">
                  <BookOpen size={34} className="mx-auto text-primary" aria-hidden="true" />
                  <p className="text-lg font-semibold text-foreground">No courses found</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    {activeFiltersPresent ? "No course matches your current search or filters." : "No courses are published yet. When a course goes live, it will appear here."}
                  </p>
                  {activeFiltersPresent && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="mt-6 min-h-10 rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => <LearnCard key={`${item.kind}-${item.id}`} item={item} />)}
                </div>
              )}

              <Pagination page={filters.page} totalPages={totalPages} onPageChange={(p) => updateFilters({ page: p })} />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
