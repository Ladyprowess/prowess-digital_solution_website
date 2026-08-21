"use client";

import { useEffect, useMemo, useState } from "react";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Pagination } from "@/components/Pagination";
import { SkillCard, type SkillCardData } from "@/components/skills/SkillCard";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 24;
const POPULAR_COUNT = 10;
const LEARN_RESOURCE_KINDS = ["video", "article", "guide", "ebook"];

type SkillRow = { id: string; slug: string; name: string; description: string | null; featured: boolean };

export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasContentOnly, setHasContentOnly] = useState(false);
  const [sort, setSort] = useState<"name" | "connected">("name");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: skillRows }, { data: jobRows }, { data: oppRows }, { data: courseRows }, { data: resourceRows }] = await Promise.all([
        supabase.from("skills").select("id, slug, name, description, featured").eq("status", "published").order("name"),
        supabase.from("job_skill_map").select("skill_id"),
        supabase.from("opportunity_skill_map").select("skill_id"),
        supabase.from("course_skill_map").select("skill_id"),
        supabase.from("resource_skill_map").select("skill_id, resources(resource_type)"),
      ]);

      const jobCounts = new Map<string, number>();
      for (const r of jobRows || []) jobCounts.set(r.skill_id, (jobCounts.get(r.skill_id) || 0) + 1);

      const oppCounts = new Map<string, number>();
      for (const r of oppRows || []) oppCounts.set(r.skill_id, (oppCounts.get(r.skill_id) || 0) + 1);

      const learningCounts = new Map<string, number>();
      for (const r of courseRows || []) learningCounts.set(r.skill_id, (learningCounts.get(r.skill_id) || 0) + 1);
      for (const r of (resourceRows as unknown as { skill_id: string; resources: { resource_type: string | null } | null }[]) || []) {
        if (r.resources?.resource_type && LEARN_RESOURCE_KINDS.includes(r.resources.resource_type)) {
          learningCounts.set(r.skill_id, (learningCounts.get(r.skill_id) || 0) + 1);
        }
      }

      const withCounts: SkillCardData[] = ((skillRows as SkillRow[]) || []).map((s) => ({
        id: s.id, slug: s.slug, name: s.name, description: s.description, featured: s.featured,
        learningCount: learningCounts.get(s.id) || 0,
        jobsCount: jobCounts.get(s.id) || 0,
        opportunitiesCount: oppCounts.get(s.id) || 0,
      }));

      setSkills(withCounts);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return skills;
    return skills.filter((s) => s.name.toLowerCase().includes(q));
  }, [skills, search]);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateHasContentOnly(value: boolean) {
    setHasContentOnly(value);
    setPage(1);
  }

  function updateSort(value: "name" | "connected") {
    setSort(value);
    setPage(1);
  }

  const popularSkills = useMemo(() => {
    // Only ever shows skills with real content (or an explicit admin
    // Featured override) - padding this out with zero-usage skills just to
    // hit a round number would make "Popular" a lie.
    const withUsage = filtered.filter((s) => s.featured || s.learningCount + s.jobsCount + s.opportunitiesCount > 0);
    return [...withUsage]
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        const totalA = a.learningCount + a.jobsCount + a.opportunitiesCount;
        const totalB = b.learningCount + b.jobsCount + b.opportunitiesCount;
        return totalB - totalA;
      })
      .slice(0, POPULAR_COUNT);
  }, [filtered]);

  const browseSkills = useMemo(() => {
    const base = hasContentOnly
      ? filtered.filter((s) => s.learningCount + s.jobsCount + s.opportunitiesCount > 0)
      : filtered;
    return [...base].sort((a, b) => {
      if (sort === "connected") {
        const totalA = a.learningCount + a.jobsCount + a.opportunitiesCount;
        const totalB = b.learningCount + b.jobsCount + b.opportunitiesCount;
        if (totalA !== totalB) return totalB - totalA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [filtered, hasContentOnly, sort]);

  const totalPages = Math.max(1, Math.ceil(browseSkills.length / PAGE_SIZE));
  const pagedBrowseSkills = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return browseSkills.slice(from, from + PAGE_SIZE);
  }, [browseSkills, page]);

  const exampleChips = popularSkills.slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="border-b border-border bg-muted py-16 sm:py-20">
        <Container>
          <Reveal>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Build skills that move your career forward.</h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Explore the skills employers are looking for, discover what you can learn, and see the jobs, opportunities, career paths and resources connected to each skill.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-6">
              <input
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
                placeholder="Search skills..."
                className="w-full rounded-xl border border-border bg-card px-5 py-3.5 text-sm text-foreground shadow-sm sm:max-w-xl"
              />
            </div>
          </Reveal>
          {!loading && exampleChips.length > 0 && (
            <Reveal delay={120}>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {exampleChips.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => updateSearch(s.name)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </Reveal>
          )}
        </Container>
      </section>

      {loading ? (
        <Container>
          <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
        </Container>
      ) : skills.length === 0 ? (
        <Container>
          <div className="mx-auto my-16 max-w-lg rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <p className="font-semibold text-foreground">No skills yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Check back soon.</p>
          </div>
        </Container>
      ) : filtered.length === 0 ? (
        <Container>
          <div className="mx-auto my-16 max-w-lg rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <p className="font-semibold text-foreground">No skills match &quot;{search}&quot;.</p>
          </div>
        </Container>
      ) : (
        <>
          {/* POPULAR SKILLS */}
          {popularSkills.length > 0 && (
            <section className="border-b border-border py-14">
              <Container>
                <h2 className="text-lg font-bold text-foreground">Popular Skills</h2>
                <p className="mt-1 text-sm text-muted-foreground">Explore skills connected to real learning resources, jobs and opportunities on Prowess Digital Solutions.</p>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {popularSkills.map((s) => <SkillCard key={s.id} skill={s} />)}
                </div>
              </Container>
            </section>
          )}

          {/* BROWSE ALL SKILLS */}
          <section className="py-14">
            <Container>
              <h2 className="text-lg font-bold text-foreground">Explore All Skills</h2>

              <div className="mt-5 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Search</p>
                  <input
                    value={search}
                    onChange={(e) => updateSearch(e.target.value)}
                    placeholder="Search skills..."
                    className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground"
                  />

                  <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sort</p>
                  <select
                    value={sort}
                    onChange={(e) => updateSort(e.target.value as typeof sort)}
                    className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground"
                  >
                    <option value="name">Name (A–Z)</option>
                    <option value="connected">Most connected</option>
                  </select>

                  <label className="mt-5 flex items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" checked={hasContentOnly} onChange={(e) => updateHasContentOnly(e.target.checked)} />
                    Only show skills with content
                  </label>
                </div>

                <div>
                  <p className="mb-4 text-sm text-muted-foreground">{browseSkills.length} skill{browseSkills.length === 1 ? "" : "s"}</p>
                  {browseSkills.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
                      <p className="text-sm text-muted-foreground">No skills match these filters.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {pagedBrowseSkills.map((s) => <SkillCard key={s.id} skill={s} compact />)}
                    </div>
                  )}
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              </div>
            </Container>
          </section>
        </>
      )}
    </div>
  );
}
