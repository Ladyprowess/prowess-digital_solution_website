"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Pagination } from "@/components/Pagination";
import { PillTabs, type PillTab } from "@/components/PillTabs";
import { CareerPathCard, type CareerPathCardData } from "@/components/careerPaths/CareerPathCard";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 12;

const CATEGORY_TABS: PillTab<string>[] = [
  { value: "", label: "All" },
  { value: "technology", label: "Technology" },
  { value: "business", label: "Business" },
  { value: "marketing", label: "Marketing" },
  { value: "creative", label: "Creative" },
  { value: "data", label: "Data" },
];

type PathRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: "beginner" | "intermediate" | "advanced" | null;
  category: string | null;
  featured: boolean;
  icon_key: string;
};

type PathWithCounts = CareerPathCardData & { category: string | null };

export default function CareerPathsPage() {
  const [paths, setPaths] = useState<PathWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const [{ data: pathRows }, { data: pathSkillRows }] = await Promise.all([
        supabase
          .from("career_paths")
          .select("id, slug, title, description, level, category, featured, icon_key")
          .eq("status", "published")
          .order("title"),
        supabase.from("career_path_skill_map").select("career_path_id, skill_id"),
      ]);

      const pathSkillIds = new Map<string, Set<string>>();
      for (const row of pathSkillRows || []) {
        if (!pathSkillIds.has(row.career_path_id)) pathSkillIds.set(row.career_path_id, new Set());
        pathSkillIds.get(row.career_path_id)!.add(row.skill_id);
      }

      // Reverse index: which career paths does a given skill belong to?
      // Counts below are built as per-path Sets of content ids (not
      // incrementing counters), so a single job/course/resource tagged
      // with two of the same path's skills only counts once.
      const skillToPaths = new Map<string, string[]>();
      for (const [pathId, skillSet] of pathSkillIds) {
        for (const skillId of skillSet) {
          if (!skillToPaths.has(skillId)) skillToPaths.set(skillId, []);
          skillToPaths.get(skillId)!.push(pathId);
        }
      }
      const allSkillIds = Array.from(skillToPaths.keys());

      const [{ data: jobRows }, { data: courseMapRows }, { data: resourceMapRows }, { data: careerContentRows }] =
        await Promise.all([
          allSkillIds.length === 0
            ? Promise.resolve({ data: [] })
            : supabase.from("job_skill_map").select("job_id, skill_id").in("skill_id", allSkillIds),
          // Learning counts from two sources: explicit curation
          // (career_path_course_map/career_path_resource_map, an admin
          // attaching a specific course/resource to a specific path via the
          // "Learning for this career" picker) and, additively, any
          // published resource an admin flagged "Career content" that
          // shares a skill tag with this path (queried just below) - so
          // checking that box is enough on its own, without also requiring
          // the admin to separately attach it per-path.
          supabase.from("career_path_course_map").select("career_path_id, course_id"),
          supabase.from("career_path_resource_map").select("career_path_id, resource_id"),
          supabase.from("resources").select("id, resource_skill_map(skill_id)").eq("status", "published").eq("show_in_learn", true).eq("show_in_career", true),
        ]);

      const jobsByPath = new Map<string, Set<string>>();
      for (const row of jobRows || []) {
        for (const pathId of skillToPaths.get(row.skill_id) || []) {
          if (!jobsByPath.has(pathId)) jobsByPath.set(pathId, new Set());
          jobsByPath.get(pathId)!.add(row.job_id);
        }
      }

      const learningByPath = new Map<string, Set<string>>();
      for (const row of courseMapRows || []) {
        if (!learningByPath.has(row.career_path_id)) learningByPath.set(row.career_path_id, new Set());
        learningByPath.get(row.career_path_id)!.add(`course:${row.course_id}`);
      }
      for (const row of resourceMapRows || []) {
        if (!learningByPath.has(row.career_path_id)) learningByPath.set(row.career_path_id, new Set());
        learningByPath.get(row.career_path_id)!.add(`resource:${row.resource_id}`);
      }
      // Same key format ("resource:<id>") as the explicit resource curation
      // above, so a resource that's both explicitly attached AND flagged
      // "Career content" still only counts once per path (Set, not a list).
      for (const row of careerContentRows || []) {
        const matchedPaths = new Set<string>();
        for (const m of row.resource_skill_map || []) {
          for (const pathId of skillToPaths.get(m.skill_id) || []) matchedPaths.add(pathId);
        }
        for (const pathId of matchedPaths) {
          if (!learningByPath.has(pathId)) learningByPath.set(pathId, new Set());
          learningByPath.get(pathId)!.add(`resource:${row.id}`);
        }
      }

      const withCounts: PathWithCounts[] = ((pathRows as PathRow[]) || []).map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        level: p.level,
        category: p.category,
        featured: p.featured,
        iconKey: p.icon_key,
        skillsCount: pathSkillIds.get(p.id)?.size || 0,
        learningCount: learningByPath.get(p.id)?.size || 0,
        jobsCount: jobsByPath.get(p.id)?.size || 0,
      }));

      setPaths(withCounts);
      setLoading(false);
    })();
  }, []);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateCategory(value: string) {
    setCategory(value);
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return paths.filter((p) => {
      if (q && !p.title.toLowerCase().includes(q)) return false;
      if (category && p.category !== category) return false;
      return true;
    });
  }, [paths, search, category]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      const totalA = a.skillsCount + a.learningCount + a.jobsCount;
      const totalB = b.skillsCount + b.learningCount + b.jobsCount;
      if (totalA !== totalB) return totalB - totalA;
      return a.title.localeCompare(b.title);
    });
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return sorted.slice(from, from + PAGE_SIZE);
  }, [sorted, page]);

  const popularPaths = useMemo(() => {
    return [...paths]
      .filter((p) => p.featured || p.skillsCount + p.learningCount + p.jobsCount > 0)
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return (b.skillsCount + b.learningCount + b.jobsCount) - (a.skillsCount + a.learningCount + a.jobsCount);
      })
      .slice(0, 5);
  }, [paths]);

  const totals = useMemo(() => {
    return paths.reduce(
      (acc, path) => ({
        skills: acc.skills + path.skillsCount,
        learning: acc.learning + path.learningCount,
        jobs: acc.jobs + path.jobsCount,
      }),
      { skills: 0, learning: 0, jobs: 0 }
    );
  }, [paths]);

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-brand-bg py-12 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <Reveal>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Career Path Explorer</p>
                <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                  Choose a path, then build the skills to enter it.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  Explore structured career paths with the skills, learning, jobs, opportunities and tools connected to each direction.
                </p>
                <div className="mt-7 max-w-2xl">
                  <label htmlFor="career-path-search" className="sr-only">Search career paths</label>
                  <input
                    id="career-path-search"
                    value={search}
                    onChange={(e) => updateSearch(e.target.value)}
                    placeholder="Search by career name"
                    className="min-h-12 w-full rounded-lg border border-border bg-card px-5 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <p className="text-sm font-bold text-foreground">What you get in each path</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "Skills", value: totals.skills },
                    { label: "Learning", value: totals.learning },
                    { label: "Jobs", value: totals.jobs },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-lg font-bold text-foreground">{stat.value}</p>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Start with the path that matches your interest. The guide shows what to learn, what to practise and where to apply.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Popular</span>
              {!loading && popularPaths.length > 0 ? (
                popularPaths.map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => updateSearch(p.title)}
                    className="min-h-10 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {p.title}
                  </button>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Loading paths</span>
              )}
            </div>
          </Reveal>

          <Reveal delay={160}>
            <Link href="/skills" className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Not sure what to choose? Explore by skill
            </Link>
          </Reveal>
        </Container>
      </section>

      <section className="py-10 sm:py-14">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Browse paths</p>
              <h2 className="mt-2 text-2xl font-bold text-foreground">Find your next direction</h2>
            </div>
            <PillTabs tabs={CATEGORY_TABS} active={category} onChange={updateCategory} />
          </div>

          {loading ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="min-h-[320px] rounded-lg border border-border bg-card p-5">
                  <div className="h-12 w-12 rounded-lg bg-muted" />
                  <div className="mt-6 h-4 w-24 rounded bg-muted" />
                  <div className="mt-3 h-7 w-3/5 rounded bg-muted" />
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-5/6 rounded bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : paths.length === 0 ? (
            <div className="mx-auto my-16 max-w-lg rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
              <p className="font-semibold text-foreground">No career paths published yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">Check back soon.</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className="mx-auto my-16 max-w-lg rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
              <p className="font-semibold text-foreground">No career paths match these filters.</p>
              <button
                type="button"
                onClick={() => {
                  updateSearch("");
                  updateCategory("");
                }}
                className="mt-4 min-h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <p className="mt-6 text-sm font-semibold text-muted-foreground">{sorted.length} career path{sorted.length === 1 ? "" : "s"} available</p>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paged.map((p) => <CareerPathCard key={p.id} path={p} />)}
              </div>
              <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
            </>
          )}
        </Container>
      </section>
    </div>
  );
}
