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
const LEARN_RESOURCE_KINDS = ["video", "article", "guide", "ebook"];

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

      const [{ data: jobRows }, { data: courseRows }, { data: resourceRows }] =
        allSkillIds.length === 0
          ? [{ data: [] }, { data: [] }, { data: [] }]
          : await Promise.all([
              supabase.from("job_skill_map").select("job_id, skill_id").in("skill_id", allSkillIds),
              supabase.from("course_skill_map").select("course_id, skill_id").in("skill_id", allSkillIds),
              supabase.from("resource_skill_map").select("resource_id, skill_id, resources(resource_type)").in("skill_id", allSkillIds),
            ]);

      const jobsByPath = new Map<string, Set<string>>();
      for (const row of jobRows || []) {
        for (const pathId of skillToPaths.get(row.skill_id) || []) {
          if (!jobsByPath.has(pathId)) jobsByPath.set(pathId, new Set());
          jobsByPath.get(pathId)!.add(row.job_id);
        }
      }

      const learningByPath = new Map<string, Set<string>>();
      for (const row of courseRows || []) {
        for (const pathId of skillToPaths.get(row.skill_id) || []) {
          if (!learningByPath.has(pathId)) learningByPath.set(pathId, new Set());
          learningByPath.get(pathId)!.add(`course:${row.course_id}`);
        }
      }
      for (const row of (resourceRows as unknown as { resource_id: string; skill_id: string; resources: { resource_type: string | null } | null }[]) || []) {
        if (!row.resources?.resource_type || !LEARN_RESOURCE_KINDS.includes(row.resources.resource_type)) continue;
        for (const pathId of skillToPaths.get(row.skill_id) || []) {
          if (!learningByPath.has(pathId)) learningByPath.set(pathId, new Set());
          learningByPath.get(pathId)!.add(`resource:${row.resource_id}`);
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

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="border-b border-border bg-muted py-16 sm:py-20">
        <Container>
          <Reveal>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Find a career path that fits where you want to go.</h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Explore careers, understand the skills they require, and discover the learning resources, jobs and opportunities connected to each one.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-6">
              <input
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
                placeholder="Search career paths..."
                className="w-full rounded-xl border border-border bg-card px-5 py-3.5 text-sm text-foreground shadow-sm sm:max-w-xl"
              />
            </div>
          </Reveal>
          {!loading && popularPaths.length > 0 && (
            <Reveal delay={120}>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Popular:</span>
                {popularPaths.map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => updateSearch(p.title)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </Reveal>
          )}
          <Reveal delay={160}>
            <Link href="/skills" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
              Not sure what to choose? Explore by skill →
            </Link>
          </Reveal>
        </Container>
      </section>

      <section className="py-14">
        <Container>
          <PillTabs tabs={CATEGORY_TABS} active={category} onChange={updateCategory} />

          {loading ? (
            <p className="mt-8 py-16 text-center text-sm text-muted-foreground">Loading…</p>
          ) : paths.length === 0 ? (
            <div className="mx-auto my-16 max-w-lg rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
              <p className="font-semibold text-foreground">No career paths published yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">Check back soon.</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className="mx-auto my-16 max-w-lg rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
              <p className="font-semibold text-foreground">No career paths match these filters.</p>
            </div>
          ) : (
            <>
              <p className="mt-6 text-sm text-muted-foreground">{sorted.length} career path{sorted.length === 1 ? "" : "s"}</p>
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
