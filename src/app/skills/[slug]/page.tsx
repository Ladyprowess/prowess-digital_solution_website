import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { RichText } from "@/components/RichText";
import { RelatedSection } from "@/components/RelatedSection";
import { Breadcrumb } from "@/components/Breadcrumb";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { OpportunityCard, type OpportunityCardData } from "@/components/opportunities/OpportunityCard";
import { LearnCard } from "@/components/learn/LearnCard";
import { SkillCard, type SkillCardData } from "@/components/skills/SkillCard";
import { getSkillGraph, getRelatedSkills } from "@/lib/careerPathGraph";
import { courseToLearnItem, resourceToLearnItem, COURSE_SELECT, RESOURCE_SELECT, LEARN_RESOURCE_KINDS, type LearnItem, type CourseRow, type ResourceRow } from "@/lib/learn/types";

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

// Real 3-stat counts (Learning/Jobs/Opportunities) for a batch of skills at
// once, same accounting as the /skills listing page - used here for the
// Related Skills cards so they show real numbers, not just a name.
async function statsForSkills(skillIds: string[]): Promise<Map<string, { learningCount: number; jobsCount: number; opportunitiesCount: number }>> {
  const stats = new Map<string, { learningCount: number; jobsCount: number; opportunitiesCount: number }>();
  if (skillIds.length === 0) return stats;
  for (const id of skillIds) stats.set(id, { learningCount: 0, jobsCount: 0, opportunitiesCount: 0 });

  const [jobRows, oppRows, courseRows, resourceRows] = await Promise.all([
    supabase.from("job_skill_map").select("skill_id").in("skill_id", skillIds),
    supabase.from("opportunity_skill_map").select("skill_id").in("skill_id", skillIds),
    supabase.from("course_skill_map").select("skill_id").in("skill_id", skillIds),
    supabase.from("resource_skill_map").select("skill_id, resources(resource_type)").in("skill_id", skillIds),
  ]);
  for (const r of jobRows.data || []) stats.get(r.skill_id)!.jobsCount += 1;
  for (const r of oppRows.data || []) stats.get(r.skill_id)!.opportunitiesCount += 1;
  for (const r of courseRows.data || []) stats.get(r.skill_id)!.learningCount += 1;
  for (const r of (resourceRows.data as unknown as { skill_id: string; resources: { resource_type: string | null } | null }[]) || []) {
    if (r.resources?.resource_type && LEARN_RESOURCE_KINDS.includes(r.resources.resource_type)) {
      stats.get(r.skill_id)!.learningCount += 1;
    }
  }
  return stats;
}

export default async function SkillDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await getSkill(slug);
  if (!skill) return notFound();

  const nowIso = new Date().toISOString();

  const [jobIds, oppIds, courseIds, resourceIds, graph, relatedSkills, ownStats] = await Promise.all([
    idsForSkill("job_skill_map", "job_id", skill.id),
    idsForSkill("opportunity_skill_map", "opportunity_id", skill.id),
    idsForSkill("course_skill_map", "course_id", skill.id),
    idsForSkill("resource_skill_map", "resource_id", skill.id),
    getSkillGraph([skill.id], { limit: CARD_LIMIT }),
    getRelatedSkills(skill.id, { limit: 8 }),
    statsForSkills([skill.id]),
  ]);

  const [jobRows, oppRows, courseRows, resourceRows] = await Promise.all([
    jobIds.length
      ? supabase.from("jobs")
          .select("id, slug, title, location_type, country, city, salary_min, salary_max, salary_currency, salary_period, experience_level, deadline_at, published_at, featured, companies!inner(name, logo_url, verified), job_categories(name), job_types(name), job_skill_map(skills(slug, name))")
          .eq("status", "published").or(`expires_at.is.null,expires_at.gte.${nowIso}`).in("id", jobIds).limit(CARD_LIMIT)
      : Promise.resolve({ data: [] }),
    oppIds.length
      ? supabase.from("opportunities")
          .select("id, slug, title, organisation_name, organisation_logo_url, location_type, country, city, eligibility_summary, eligible_locations, benefit_tags, deadline_at, published_at, featured, opportunity_types(name), opportunity_skill_map(skills(slug, name))")
          .eq("status", "published").or(`expires_at.is.null,expires_at.gte.${nowIso}`).in("id", oppIds).limit(CARD_LIMIT)
      : Promise.resolve({ data: [] }),
    courseIds.length
      ? supabase.from("courses").select(COURSE_SELECT).eq("status", "published").in("id", courseIds).limit(CARD_LIMIT)
      : Promise.resolve({ data: [] }),
    resourceIds.length
      ? supabase.from("resources").select(RESOURCE_SELECT).eq("status", "published").in("resource_type", LEARN_RESOURCE_KINDS).in("id", resourceIds).limit(CARD_LIMIT)
      : Promise.resolve({ data: [] }),
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
    ...((courseRows.data as unknown as CourseRow[]) || []).map(courseToLearnItem),
    ...((resourceRows.data as unknown as ResourceRow[]) || []).map(resourceToLearnItem),
  ].slice(0, CARD_LIMIT);

  const relatedSkillStats = await statsForSkills(relatedSkills.map((s) => s.id));
  const relatedSkillCards: SkillCardData[] = relatedSkills.map((s) => ({
    id: s.id, slug: s.slug, name: s.name, description: s.description, featured: false,
    ...(relatedSkillStats.get(s.id) || { learningCount: 0, jobsCount: 0, opportunitiesCount: 0 }),
  }));

  const stats = ownStats.get(skill.id) || { learningCount: 0, jobsCount: 0, opportunitiesCount: 0 };

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="mx-auto max-w-4xl px-4">
        <Reveal>
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Skills", href: "/skills" }, { label: skill.name }]} />

          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{skill.name}</h1>
              {skill.description && <p className="mt-2 text-muted-foreground">{skill.description}</p>}
            </div>
            <SaveButton itemType="skill" itemId={skill.id} className="flex-shrink-0" />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 rounded-2xl border border-border bg-card p-5 text-center">
            <div>
              <p className="text-xl font-bold text-foreground">{stats.learningCount}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Learning</p>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.jobsCount}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Jobs</p>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.opportunitiesCount}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Opportunities</p>
            </div>
          </div>
        </Reveal>

        {skill.about && (
          <Reveal delay={80}>
            <section className="mt-10">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">ABOUT THIS SKILL</h2>
              <RichText html={skill.about} className="mt-3" />
            </section>
          </Reveal>
        )}

        {learningItems.length > 0 && (
          <Reveal delay={120}>
            <section className="mt-10">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">LEARN {skill.name.toUpperCase()}</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {learningItems.map((item) => <LearnCard key={`${item.kind}-${item.id}`} item={item} />)}
              </div>
              <Link href={`/learn?skills=${skill.slug}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
                Explore all learning resources →
              </Link>
            </section>
          </Reveal>
        )}

        <Reveal delay={160}>
          <RelatedSection title="WHERE CAN THIS SKILL TAKE YOU?" items={graph.careerPaths} render={() => graph.careerPaths.map((c) => (
            <Link key={c.slug} href={`/career-paths/${c.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{c.access}</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{c.title}</p>
            </Link>
          ))} />
        </Reveal>

        {jobCards.length > 0 && (
          <Reveal delay={200}>
            <section className="mt-10">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">JOBS THAT USE {skill.name.toUpperCase()}</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {jobCards.map((j) => <JobCard key={j.id} job={j} />)}
              </div>
              <Link href={`/jobs?skills=${skill.slug}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
                View all {skill.name} jobs →
              </Link>
            </section>
          </Reveal>
        )}

        {opportunityCards.length > 0 && (
          <Reveal delay={240}>
            <section className="mt-10">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">OPPORTUNITIES RELATED TO {skill.name.toUpperCase()}</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {opportunityCards.map((o) => <OpportunityCard key={o.id} opportunity={o} />)}
              </div>
              <Link href={`/opportunities?skills=${skill.slug}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
                View all {skill.name} opportunities →
              </Link>
            </section>
          </Reveal>
        )}

        <Reveal delay={280}>
          <RelatedSection title="EVENTS" items={graph.events} render={() => graph.events.map((e) => (
            <Link key={e.slug} href={`/events/${e.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <p className="text-sm font-semibold text-foreground">{e.title}</p>
              {e.date && <p className="mt-0.5 text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>}
            </Link>
          ))} />
        </Reveal>

        {relatedSkillCards.length > 0 && (
          <Reveal delay={320}>
            <section className="mt-10">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">SKILLS OFTEN EXPLORED WITH {skill.name.toUpperCase()}</h2>
              <p className="mt-1 text-xs text-muted-foreground">Based on what&rsquo;s actually tagged together on the platform - not a curated list.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {relatedSkillCards.map((s) => <SkillCard key={s.id} skill={s} compact />)}
              </div>
            </section>
          </Reveal>
        )}

        {stats.learningCount + stats.jobsCount + stats.opportunitiesCount + graph.careerPaths.length + graph.events.length === 0 && (
          <p className="mt-10 rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center text-sm text-muted-foreground">
            Nothing is tagged with {skill.name} yet - once a job, course, resource, career path, event or opportunity is tagged with it, it&rsquo;ll show up here automatically.
          </p>
        )}

        <Reveal delay={360}>
          <section className="mt-14 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <h2 className="text-xl font-bold text-foreground">Ready to build this skill?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Explore learning resources, find relevant jobs, and discover opportunities connected to {skill.name}.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href={`/learn?skills=${skill.slug}`} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Start Learning
              </Link>
              <Link href={`/jobs?skills=${skill.slug}`} className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
                Find Jobs
              </Link>
              <Link href={`/opportunities?skills=${skill.slug}`} className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
                Explore Opportunities
              </Link>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
