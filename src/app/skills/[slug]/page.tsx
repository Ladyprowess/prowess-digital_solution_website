import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, Compass, GraduationCap, Target } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { RichText } from "@/components/RichText";
import { Breadcrumb } from "@/components/Breadcrumb";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { OpportunityCard, type OpportunityCardData } from "@/components/opportunities/OpportunityCard";
import { LearnCard } from "@/components/learn/LearnCard";
import { LearnProgressSummary } from "@/components/discovery/LearnProgressSummary";
import { SkillCard, type SkillCardData } from "@/components/skills/SkillCard";
import { getSkillGraph, getRelatedSkills } from "@/lib/careerPathGraph";
import { courseToLearnItem, selectCourses, type LearnItem, type CourseRow } from "@/lib/learn/types";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CARD_LIMIT = 6;

type SkillDetail = { id: string; slug: string; name: string; description: string | null; about: string | null };

async function getSkill(slug: string) {
  const { data } = await supabase.from("skills").select("id, slug, name, description, about").eq("slug", slug).eq("status", "published").maybeSingle();
  return data as SkillDetail | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const skill = await getSkill(slug);
  if (!skill) return { title: "Skill not found" };
  return {
    title: `${skill.name} | Prowess Digital Solutions`,
    description: skill.description || `Career paths, jobs, learning and opportunities connected to ${skill.name}.`,
  };
}

async function idsForSkill(table: string, idColumn: string, skillId: string): Promise<string[]> {
  const { data } = await supabase.from(table).select(idColumn).eq("skill_id", skillId);
  const rows = (data || []) as unknown as Record<string, unknown>[];
  return Array.from(new Set(rows.map((r) => String(r[idColumn]))));
}

// Real 3-stat counts (Courses/Jobs/Opportunities) for a batch of skills at
// once, same accounting as the /skills listing page - used here for the
// Related Skills cards so they show real numbers, not just a name.
async function statsForSkills(skillIds: string[]): Promise<Map<string, { learningCount: number; jobsCount: number; opportunitiesCount: number }>> {
  const stats = new Map<string, { learningCount: number; jobsCount: number; opportunitiesCount: number }>();
  if (skillIds.length === 0) return stats;
  for (const id of skillIds) stats.set(id, { learningCount: 0, jobsCount: 0, opportunitiesCount: 0 });

  const [jobRows, oppRows, courseRows] = await Promise.all([
    supabase.from("job_skill_map").select("skill_id").in("skill_id", skillIds),
    supabase.from("opportunity_skill_map").select("skill_id").in("skill_id", skillIds),
    supabase.from("course_skill_map").select("skill_id").in("skill_id", skillIds),
  ]);
  for (const r of jobRows.data || []) stats.get(r.skill_id)!.jobsCount += 1;
  for (const r of oppRows.data || []) stats.get(r.skill_id)!.opportunitiesCount += 1;
  for (const r of courseRows.data || []) stats.get(r.skill_id)!.learningCount += 1;
  return stats;
}

export default async function SkillDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await getSkill(slug);
  if (!skill) return notFound();

  const nowIso = new Date().toISOString();

  const [jobIds, oppIds, courseIds, graph, relatedSkills, ownStats] = await Promise.all([
    idsForSkill("job_skill_map", "job_id", skill.id),
    idsForSkill("opportunity_skill_map", "opportunity_id", skill.id),
    idsForSkill("course_skill_map", "course_id", skill.id),
    getSkillGraph([skill.id], { limit: CARD_LIMIT }),
    getRelatedSkills(skill.id, { limit: 8 }),
    statsForSkills([skill.id]),
  ]);

  const [jobRows, oppRows, courseRows] = await Promise.all([
    jobIds.length
      ? supabase.from("jobs")
          .select("id, slug, title, location_type, country, city, salary_min, salary_max, salary_currency, salary_period, experience_level, deadline_at, published_at, featured, companies!inner(name, logo_url, verified), job_categories(name), job_types(name), job_skill_map(skills(slug, name))")
          .eq("status", "published").or(`expires_at.is.null,expires_at.gte.${nowIso}`).in("id", jobIds)
          .order("featured", { ascending: false }).order("published_at", { ascending: false, nullsFirst: false }).limit(CARD_LIMIT)
      : Promise.resolve({ data: [] }),
    oppIds.length
      ? supabase.from("opportunities")
          .select("id, slug, title, organisation_name, organisation_logo_url, location_type, country, city, eligibility_summary, eligible_locations, benefit_tags, deadline_at, published_at, featured, opportunity_types(name), opportunity_skill_map(skills(slug, name))")
          .eq("status", "published").or(`expires_at.is.null,expires_at.gte.${nowIso}`).in("id", oppIds)
          .order("featured", { ascending: false }).order("published_at", { ascending: false, nullsFirst: false }).limit(CARD_LIMIT)
      : Promise.resolve({ data: [] }),
    courseIds.length
      ? selectCourses((select) => supabase.from("courses").select(select).eq("status", "published").in("id", courseIds).limit(CARD_LIMIT))
      : Promise.resolve([]),
  ]);

  const jobCards: JobCardData[] = ((jobRows.data as unknown as {
    id: string; slug: string; title: string; location_type: "remote" | "hybrid" | "on_site";
    country: string | null; city: string | null; salary_min: number | null; salary_max: number | null;
    salary_currency: string | null; salary_period: string | null; experience_level: string | null;
    deadline_at: string | null; published_at: string | null; featured: boolean;
    companies: { name: string; logo_url: string | null; verified: boolean } | null;
    job_categories: { name: string } | null; job_types: { name: string } | null;
    job_skill_map: { skills: { slug: string; name: string } | null }[];
  }[]) || []).map((j) => ({
    id: j.id, slug: j.slug, title: j.title, company: j.companies,
    category: j.job_categories?.name || null, location_type: j.location_type, country: j.country, city: j.city,
    job_type: j.job_types?.name || null, experience_level: j.experience_level,
    salary_min: j.salary_min, salary_max: j.salary_max, salary_currency: j.salary_currency, salary_period: j.salary_period,
    skills: j.job_skill_map.map((m) => m.skills).filter((s): s is { slug: string; name: string } => Boolean(s)),
    published_at: j.published_at, deadline_at: j.deadline_at, featured: j.featured,
  }));

  const opportunityCards: OpportunityCardData[] = ((oppRows.data as unknown as {
    id: string; slug: string; title: string; organisation_name: string | null; organisation_logo_url: string | null;
    location_type: "remote" | "hybrid" | "on_site" | "any"; country: string | null; city: string | null;
    eligibility_summary: string | null; eligible_locations: string[] | null; benefit_tags: string[] | null;
    deadline_at: string | null; featured: boolean; opportunity_types: { name: string } | null;
    opportunity_skill_map: { skills: { slug: string; name: string } | null }[];
  }[]) || []).map((o) => ({
    id: o.id, slug: o.slug, title: o.title,
    organisation_name: o.organisation_name, organisation_logo_url: o.organisation_logo_url,
    type: o.opportunity_types?.name || null, location_type: o.location_type, country: o.country, city: o.city,
    eligibility_summary: o.eligibility_summary, eligible_locations: o.eligible_locations, benefit_tags: o.benefit_tags,
    skills: o.opportunity_skill_map.map((m) => m.skills).filter((s): s is { slug: string; name: string } => Boolean(s)),
    deadline_at: o.deadline_at, featured: o.featured,
  }));

  const learningItems: LearnItem[] = [
    ...(courseRows as CourseRow[]).map(courseToLearnItem),
  ].slice(0, CARD_LIMIT);

  const relatedSkillStats = await statsForSkills(relatedSkills.map((s) => s.id));
  const relatedSkillCards: SkillCardData[] = relatedSkills.map((s) => ({
    id: s.id, slug: s.slug, name: s.name, description: s.description, featured: false,
    ...(relatedSkillStats.get(s.id) || { learningCount: 0, jobsCount: 0, opportunitiesCount: 0 }),
  }));

  const stats = ownStats.get(skill.id) || { learningCount: 0, jobsCount: 0, opportunitiesCount: 0 };
  const hasConnections = stats.learningCount + stats.jobsCount + stats.opportunitiesCount + graph.careerPaths.length + graph.events.length > 0;
  const nextMove = learningItems.length > 0
    ? "Build the foundation first, then compare the linked roles and opportunities to see how this skill is used in real applications."
    : jobCards.length > 0
      ? "Use the linked roles to understand the titles, responsibilities and expectations connected to this skill."
      : opportunityCards.length > 0
        ? "Look through the opportunities to see where this skill can help you build experience and credibility."
        : "Courses, roles and opportunities connected to this skill will appear here as they are added.";

  return (
    <div className="min-h-screen bg-background pb-16">
      <section className="border-b border-border bg-brand-bg py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Skills", href: "/skills" }, { label: skill.name }]} />

            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Skill Profile</p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">{skill.name}</h1>
                {skill.description && <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{skill.description}</p>}
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  {learningItems.length > 0 && (
                    <Link href={`/learn?skills=${skill.slug}`} className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      Start with courses
                    </Link>
                  )}
                  {jobCards.length > 0 && (
                    <Link href={`/jobs?skills=${skill.slug}`} className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      View jobs
                    </Link>
                  )}
                  <SaveButton itemType="skill" itemId={skill.id} className="flex-shrink-0" />
                </div>
              </div>

              <aside className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-primary" aria-hidden="true" />
                  <p className="text-sm font-bold text-foreground">At a glance</p>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { label: "Courses", value: stats.learningCount },
                    { label: "Jobs", value: stats.jobsCount },
                    { label: "Opportunities", value: stats.opportunitiesCount },
                    { label: "Paths", value: graph.careerPaths.length },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-lg bg-primary/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">Suggested direction</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{nextMove}</p>
                </div>
              </aside>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {skill.about && (
            <Reveal delay={80}>
              <section className="rounded-lg border border-border bg-card p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">About this skill</p>
                <RichText html={skill.about} className="mt-4" />
              </section>
            </Reveal>
          )}

          <Reveal delay={120}>
            <section className={skill.about ? "mt-8 rounded-lg border border-border bg-card p-6" : "rounded-lg border border-border bg-card p-6"}>
              <LearnProgressSummary
                courses={learningItems.map((i) => ({ id: i.id, slug: i.slug, title: i.title }))}
                context="skill"
              />
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <GraduationCap size={18} className="text-primary" aria-hidden="true" />
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Courses</p>
                  </div>
                  <h2 className="mt-2 text-xl font-bold text-foreground">Learn {skill.name}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Structured courses selected for this skill.
                  </p>
                </div>
                {learningItems.length > 0 && (
                  <Link href={`/learn?skills=${skill.slug}`} className="inline-flex min-h-10 items-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    Browse courses
                  </Link>
                )}
              </div>

              {learningItems.length > 0 ? (
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {learningItems.map((item) => <LearnCard key={`${item.kind}-${item.id}`} item={item} />)}
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-dashed border-border bg-background px-5 py-8 text-center">
                  <BookOpen size={22} className="mx-auto text-primary" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-foreground">No course is connected yet.</p>
                  <p className="mt-1 text-sm text-muted-foreground">When a course is connected to {skill.name}, it will appear here.</p>
                </div>
              )}
            </section>
          </Reveal>

          {jobCards.length > 0 && (
            <Reveal delay={160}>
              <section className="mt-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Jobs</p>
                    <h2 className="mt-2 text-xl font-bold text-foreground">Roles that use {skill.name}</h2>
                  </div>
                  <Link href={`/jobs?skills=${skill.slug}`} className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    View all jobs
                  </Link>
                </div>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {jobCards.map((j) => <JobCard key={j.id} job={j} />)}
                </div>
              </section>
            </Reveal>
          )}

          {opportunityCards.length > 0 && (
            <Reveal delay={200}>
              <section className="mt-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Opportunities</p>
                    <h2 className="mt-2 text-xl font-bold text-foreground">Opportunities linked to {skill.name}</h2>
                  </div>
                  <Link href={`/opportunities?skills=${skill.slug}`} className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    View all opportunities
                  </Link>
                </div>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {opportunityCards.map((o) => <OpportunityCard key={o.id} opportunity={o} />)}
                </div>
              </section>
            </Reveal>
          )}

          {!hasConnections && (
            <p className="mt-8 rounded-lg border border-dashed border-border bg-card px-6 py-8 text-center text-sm text-muted-foreground">
              Nothing is tagged with {skill.name} yet. Once a job, course, career path, event or opportunity is tagged with it, it will show up here automatically.
            </p>
          )}
        </div>

        <aside className="space-y-6">
          <Reveal delay={140}>
            <section className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Compass size={18} className="text-primary" aria-hidden="true" />
                <h2 className="text-sm font-bold text-foreground">Career paths</h2>
              </div>
              {graph.careerPaths.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {graph.careerPaths.map((c) => (
                    <Link key={c.slug} href={`/career-paths/${c.slug}`} className="block rounded-lg border border-border bg-background p-4 transition hover:border-primary/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{c.access}</span>
                      <p className="mt-2 text-sm font-semibold text-foreground">{c.title}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">No career path is connected to this skill yet.</p>
              )}
            </section>
          </Reveal>

          {relatedSkillCards.length > 0 && (
            <Reveal delay={180}>
              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="text-sm font-bold text-foreground">Related skills</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Skills often tagged beside {skill.name}.</p>
                <div className="mt-4 space-y-3">
                  {relatedSkillCards.map((s) => <SkillCard key={s.id} skill={s} compact />)}
                </div>
              </section>
            </Reveal>
          )}

          {graph.events.length > 0 && (
            <Reveal delay={220}>
              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="text-sm font-bold text-foreground">Events</h2>
                <div className="mt-4 space-y-3">
                  {graph.events.map((e) => (
                    <Link key={e.slug} href={`/events/${e.slug}`} className="block rounded-lg border border-border bg-background p-4 transition hover:border-primary/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <p className="text-sm font-semibold text-foreground">{e.title}</p>
                      {e.date && <p className="mt-1 text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>}
                    </Link>
                  ))}
                </div>
              </section>
            </Reveal>
          )}
        </aside>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <Reveal>
          <section className="mt-14 rounded-lg border border-primary/20 bg-primary/5 p-8 text-center">
            <h2 className="text-xl font-bold text-foreground">Ready to build this skill?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Build the skill, then explore the roles and opportunities where {skill.name} can be useful.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href={`/learn?skills=${skill.slug}`} className="inline-flex min-h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Start with courses
              </Link>
              <Link href={`/jobs?skills=${skill.slug}`} className="inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Find Jobs
              </Link>
              <Link href={`/opportunities?skills=${skill.slug}`} className="inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Explore Opportunities
              </Link>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
