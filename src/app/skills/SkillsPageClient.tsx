"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, BriefcaseBusiness, Compass, Search, Target } from "lucide-react";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Pagination } from "@/components/Pagination";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 24;

type SkillRow = { id: string; slug: string; name: string; description: string | null; featured: boolean };
export type SkillWithCounts = SkillRow & { learningCount: number; jobsCount: number; opportunitiesCount: number };

export default function SkillsPageClient({ initialSkills = [] }: { initialSkills?: SkillWithCounts[] }) {
  const [skills, setSkills] = useState<SkillWithCounts[]>(initialSkills);
  const [loading, setLoading] = useState(initialSkills.length === 0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasContentOnly, setHasContentOnly] = useState(false);
  const [sort, setSort] = useState<"connected" | "name">("connected");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The server already sent a full list on first load (see page.tsx) - this
    // only needs to run as a fallback if that server fetch came back empty.
    if (initialSkills.length > 0) return;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [{ data: skillRows }, { data: jobRows }, { data: oppRows }, { data: courseRows }] = await Promise.all([
          supabase.from("skills").select("id, slug, name, description, featured").eq("status", "published").order("name"),
          supabase.from("job_skill_map").select("skill_id"),
          supabase.from("opportunity_skill_map").select("skill_id"),
          supabase.from("course_skill_map").select("skill_id"),
        ]);

        const jobCounts = new Map<string, number>();
        for (const r of jobRows || []) jobCounts.set(r.skill_id, (jobCounts.get(r.skill_id) || 0) + 1);

        const oppCounts = new Map<string, number>();
        for (const r of oppRows || []) oppCounts.set(r.skill_id, (oppCounts.get(r.skill_id) || 0) + 1);

        const learningCounts = new Map<string, number>();
        for (const r of courseRows || []) learningCounts.set(r.skill_id, (learningCounts.get(r.skill_id) || 0) + 1);

        const withCounts: SkillWithCounts[] = ((skillRows as SkillRow[]) || []).map((s) => ({
          ...s,
          learningCount: learningCounts.get(s.id) || 0,
          jobsCount: jobCounts.get(s.id) || 0,
          opportunitiesCount: oppCounts.get(s.id) || 0,
        }));

        setSkills(withCounts);
      } catch {
        setError("Skills could not be loaded right now.");
      } finally {
        setLoading(false);
      }
    })();
  }, [initialSkills.length]);

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

  function updateSort(value: "connected" | "name") {
    setSort(value);
    setPage(1);
  }

  // Featured skills always lead, regardless of sort - it's an explicit
  // editorial signal, not something a sort dropdown should be able to bury.
  const sortedSkills = useMemo(() => {
    const base = hasContentOnly
      ? filtered.filter((s) => s.learningCount + s.jobsCount + s.opportunitiesCount > 0)
      : filtered;
    return [...base].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (sort === "connected") {
        const totalA = a.learningCount + a.jobsCount + a.opportunitiesCount;
        const totalB = b.learningCount + b.jobsCount + b.opportunitiesCount;
        if (totalA !== totalB) return totalB - totalA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [filtered, hasContentOnly, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedSkills.length / PAGE_SIZE));
  const pagedSkills = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return sortedSkills.slice(from, from + PAGE_SIZE);
  }, [sortedSkills, page]);

  const exampleChips = useMemo(() => {
    return [...skills]
      .filter((s) => s.featured || s.learningCount + s.jobsCount + s.opportunitiesCount > 0)
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return (b.learningCount + b.jobsCount + b.opportunitiesCount) - (a.learningCount + a.jobsCount + a.opportunitiesCount);
      })
      .slice(0, 4);
  }, [skills]);

  const totals = useMemo(() => {
    return skills.reduce(
      (acc, skill) => ({
        courses: acc.courses + skill.learningCount,
        jobs: acc.jobs + skill.jobsCount,
        opportunities: acc.opportunities + skill.opportunitiesCount,
      }),
      { courses: 0, jobs: 0, opportunities: 0 }
    );
  }, [skills]);

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="border-b border-border bg-brand-bg py-12 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <Reveal>
              <div>
                <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                  <Compass size={14} aria-hidden="true" />
                  Skill Library
                </div>
                <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Choose a skill and see where it can take you.</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  Search practical skills, then open a skill profile to find connected courses, career paths, jobs and opportunities.
                </p>
                <div className="relative mt-7 max-w-2xl">
                  <label htmlFor="skill-search" className="sr-only">Search skills</label>
                  <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="skill-search"
                    value={search}
                    onChange={(e) => updateSearch(e.target.value)}
                    placeholder="Search by skill name"
                    className="min-h-12 w-full rounded-lg border border-border bg-card pl-11 pr-4 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <p className="text-sm font-bold text-foreground">Skills connect the platform</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  See the courses, jobs and opportunities tied to each skill.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    { label: "Courses", value: totals.courses },
                    { label: "Jobs", value: totals.jobs },
                    { label: "Opportunities", value: totals.opportunities },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-lg font-bold text-foreground">{loading ? "..." : stat.value}</p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {!loading && exampleChips.length > 0 && (
            <Reveal delay={120}>
              <div className="mt-7 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Popular</span>
                {exampleChips.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => updateSearch(s.name)}
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

      {loading ? (
        <Container>
          <div className="grid gap-4 py-16 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-lg border border-border bg-card p-5">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="mt-4 h-3 w-full rounded bg-muted" />
                <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
              </div>
            ))}
          </div>
        </Container>
      ) : error ? (
        <Container>
          <div className="mx-auto my-16 max-w-lg rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
            <p className="font-semibold text-foreground">{error}</p>
            <p className="mt-1 text-sm text-muted-foreground">Please reload the page and try again.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 min-h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Reload page
            </button>
          </div>
        </Container>
      ) : skills.length === 0 ? (
        <Container>
          <div className="mx-auto my-16 max-w-lg rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
            <p className="font-semibold text-foreground">No skills yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Skills added by the admin will appear here.</p>
          </div>
        </Container>
      ) : filtered.length === 0 ? (
        <Container>
          <div className="mx-auto my-16 max-w-lg rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
            <p className="font-semibold text-foreground">No skills match &quot;{search}&quot;.</p>
            <button
              type="button"
              onClick={() => updateSearch("")}
              className="mt-4 min-h-10 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Clear search
            </button>
          </div>
        </Container>
      ) : (
        <section className="py-14">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Browse skills</p>
                <h2 className="mt-2 text-xl font-bold text-foreground">Skills directory</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {sortedSkills.length} skill{sortedSkills.length === 1 ? "" : "s"} connected to courses, jobs and opportunities.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex min-h-10 items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={hasContentOnly} onChange={(e) => updateHasContentOnly(e.target.checked)} />
                  Only skills with content
                </label>
                <label className="sr-only" htmlFor="skill-sort">Sort skills</label>
                <select
                  id="skill-sort"
                  value={sort}
                  onChange={(e) => updateSort(e.target.value as typeof sort)}
                  className="min-h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="connected">Most connected</option>
                  <option value="name">Name A to Z</option>
                </select>
              </div>
            </div>

            {sortedSkills.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
                <Compass size={28} className="mx-auto text-primary" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-foreground">No skills match these filters.</p>
                <p className="mt-1 text-sm text-muted-foreground">Clear the filter or try another skill name.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {pagedSkills.map((s) => {
                  const connectionTotal = s.learningCount + s.jobsCount + s.opportunitiesCount;
                  return (
                    <Link
                      key={s.id}
                      href={`/skills/${s.slug}`}
                      className="group flex min-h-[250px] flex-col rounded-lg border border-border bg-card p-5 transition-[border-color,background-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-primary/35 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Target size={19} aria-hidden="true" />
                        </span>
                        {s.featured && (
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">Featured</span>
                        )}
                      </div>
                      <h3 className="mt-5 text-lg font-bold text-foreground">{s.name}</h3>
                      <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">
                        {s.description || "Open this skill to see what learning, roles and opportunities connect to it."}
                      </p>

                      <div className="mt-5 grid grid-cols-3 gap-2">
                        {[
                          { label: "Courses", value: s.learningCount, icon: BookOpen },
                          { label: "Jobs", value: s.jobsCount, icon: BriefcaseBusiness },
                          { label: "Opps", value: s.opportunitiesCount, icon: Compass },
                        ].map((stat) => {
                          const Icon = stat.icon;
                          return (
                            <div key={stat.label} className={`rounded-lg border border-border bg-background p-3 ${stat.value === 0 ? "opacity-70" : ""}`}>
                              <Icon size={15} className="text-primary" aria-hidden="true" />
                              <p className="mt-2 text-base font-bold text-foreground">{stat.value}</p>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                            </div>
                          );
                        })}
                      </div>

                      <span className="mt-auto inline-flex min-h-10 items-center gap-2 pt-5 text-sm font-semibold text-primary">
                        {connectionTotal > 0 ? "Open skill profile" : "View skill"}
                        <ArrowRight size={15} aria-hidden="true" className="transition group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </Container>
        </section>
      )}
    </div>
  );
}
