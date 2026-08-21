"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Pagination } from "@/components/Pagination";
import { LearnCard } from "@/components/learn/LearnCard";
import { LearnTypeTabs } from "@/components/learn/LearnTypeTabs";
import { LearnFiltersSidebar } from "@/components/learn/LearnFiltersSidebar";
import { supabase } from "@/lib/supabase";
import { SORT_OPTIONS } from "@/lib/learn/constants";
import { filtersFromSearchParams, searchParamsFromFilters, hasActiveFilters, type LearnFilters } from "@/lib/learn/filters";
import {
  courseToLearnItem, resourceToLearnItem, COURSE_SELECT, RESOURCE_SELECT, LEARN_RESOURCE_KINDS,
  type LearnItem, type CourseRow, type ResourceRow,
} from "@/lib/learn/types";

const PAGE_SIZE = 24;
const RESOURCE_KINDS = LEARN_RESOURCE_KINDS;

type SkillLookup = { id: string; slug: string; name: string; description: string | null };
type CareerPathLookup = { slug: string; title: string; description: string | null };

export default function LearnPage() {
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
      const [skillRows, pathRows, courseMapRows, learnResourceIds] = await Promise.all([
        supabase.from("skills").select("id, slug, name, description").order("name"),
        supabase.from("career_paths").select("slug, title, description").eq("status", "published").order("title"),
        supabase.from("course_skill_map").select("skill_id"),
        supabase.from("resources").select("id").eq("status", "published").in("resource_type", RESOURCE_KINDS),
      ]);
      setSkills(skillRows.data || []);
      setCareerPaths(pathRows.data || []);

      const resourceIds = (learnResourceIds.data || []).map((r) => r.id);
      const { data: resourceMapRows } = resourceIds.length
        ? await supabase.from("resource_skill_map").select("skill_id").in("resource_id", resourceIds)
        : { data: [] as { skill_id: string }[] };

      const usage: Record<string, number> = {};
      for (const row of courseMapRows.data || []) usage[row.skill_id] = (usage[row.skill_id] || 0) + 1;
      for (const row of resourceMapRows || []) usage[row.skill_id] = (usage[row.skill_id] || 0) + 1;
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
      const [c, r] = await Promise.all([
        supabase.from("courses").select(COURSE_SELECT).eq("status", "published").eq("featured", true).order("created_at", { ascending: false }).limit(6),
        supabase.from("resources").select(RESOURCE_SELECT).eq("status", "published").eq("featured", true).in("resource_type", RESOURCE_KINDS).order("created_at", { ascending: false }).limit(6),
      ]);
      if (cancelled) return;
      const merged = [
        ...((c.data as unknown as CourseRow[]) || []).map(courseToLearnItem),
        ...((r.data as unknown as ResourceRow[]) || []).map(resourceToLearnItem),
      ].slice(0, 6);
      setFeatured(merged);
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

    const wantsCourses = !filters.kind || filters.kind === "course";
    const wantsResources = !filters.kind || RESOURCE_KINDS.includes(filters.kind);

    const queries: Promise<LearnItem[]>[] = [];

    if (wantsCourses) {
      queries.push((async () => {
        let ids: string[] | null = null;
        if (skillIds) {
          const { data } = await supabase.from("course_skill_map").select("course_id").in("skill_id", skillIds);
          ids = Array.from(new Set((data || []).map((r) => r.course_id)));
          if (ids.length === 0) return [];
        }
        let q = supabase.from("courses").select(COURSE_SELECT).eq("status", "published");
        if (ids) q = q.in("id", ids);
        if (filters.q.trim()) q = q.ilike("title", `%${filters.q.trim()}%`);
        if (filters.level) q = q.eq("level", filters.level);
        if (filters.access) q = q.eq("access", filters.access);
        const { data } = await q;
        return ((data as unknown as CourseRow[]) || []).map(courseToLearnItem);
      })());
    }

    if (wantsResources) {
      queries.push((async () => {
        let ids: string[] | null = null;
        if (skillIds) {
          const { data } = await supabase.from("resource_skill_map").select("resource_id").in("skill_id", skillIds);
          ids = Array.from(new Set((data || []).map((r) => r.resource_id)));
          if (ids.length === 0) return [];
        }
        let q = supabase.from("resources").select(RESOURCE_SELECT).eq("status", "published");
        q = q.in("resource_type", filters.kind && RESOURCE_KINDS.includes(filters.kind) ? [filters.kind] : RESOURCE_KINDS);
        if (ids) q = q.in("id", ids);
        if (filters.q.trim()) q = q.ilike("title", `%${filters.q.trim()}%`);
        if (filters.level) q = q.eq("level", filters.level);
        if (filters.access) q = q.eq("access", filters.access);
        const { data } = await q;
        return ((data as unknown as ResourceRow[]) || []).map(resourceToLearnItem);
      })());
    }

    const results = await Promise.all(queries);
    let merged = results.flat();

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

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="border-b border-border bg-muted py-16 sm:py-20">
        <Container>
          <Reveal>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Learn something useful. Build something real.</h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Explore courses, guides, videos, ebooks and other learning resources designed to help you build practical skills and move forward in your career.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-6">
              <input
                value={filters.q}
                onChange={(e) => updateFilters({ q: e.target.value })}
                placeholder="What do you want to learn?"
                className="w-full rounded-xl border border-border bg-card px-5 py-3.5 text-sm text-foreground shadow-sm sm:max-w-xl"
              />
            </div>
          </Reveal>
          {popularSkills.length > 0 && (
            <Reveal delay={120}>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Popular:</span>
                {popularSkills.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => updateFilters({ skills: [s.slug] })}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </Reveal>
          )}
          <Reveal delay={160}>
            <div className="mt-6">
              <LearnTypeTabs active={filters.kind} onChange={(kind) => updateFilters({ kind })} />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* LEARN BY SKILL */}
      {!activeFiltersPresent && popularSkills.length > 0 && (
        <section className="border-b border-border py-14">
          <Container>
            <h2 className="text-lg font-bold text-foreground">What do you want to get better at?</h2>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {popularSkills.map((s) => (
                <Link
                  key={s.slug}
                  href={`/skills/${s.slug}`}
                  className="group flex items-center gap-2 rounded-full border border-border bg-card py-2 pl-4 pr-2.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-muted"
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
            <h2 className="text-lg font-bold text-foreground">Learn for a Career</h2>
            <p className="mt-1 text-sm text-muted-foreground">Not sure what to learn? Explore a career path and see the skills and learning resources connected to it.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {careerPaths.slice(0, 6).map((p) => (
                <Link
                  key={p.slug}
                  href={`/career-paths/${p.slug}`}
                  className="rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <p className="font-semibold text-foreground">{p.title}</p>
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
            <h2 className="text-lg font-bold text-foreground">Featured Learning</h2>
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
              className="mb-4 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground"
            >
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
                  <h2 className="text-lg font-bold text-foreground">All Learning</h2>
                  <p className="text-sm text-muted-foreground">{loading ? "Searching…" : `${total} item${total === 1 ? "" : "s"} found`}</p>
                </div>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilters({ sort: e.target.value as LearnFilters["sort"] })}
                  className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {loading ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
              ) : items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
                  <p className="text-lg font-semibold text-foreground">No learning material found</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    {activeFiltersPresent ? "We couldn't find anything matching your current filters." : "Nothing published yet. Check back soon."}
                  </p>
                  {activeFiltersPresent && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="mt-6 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
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
