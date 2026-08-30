import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { BuyButton } from "@/components/BuyButton";
import { CareerInterestButton } from "@/components/CareerInterestButton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RichText } from "@/components/RichText";
import { SectionNav, type SectionNavItem } from "@/components/careerPaths/SectionNav";
import { ResponsibilitiesAccordion } from "@/components/careerPaths/ResponsibilitiesAccordion";
import { RoadmapStrip, type RoadmapStageData } from "@/components/careerPaths/RoadmapStrip";
import { SkillMatrix, type SkillMatrixRow } from "@/components/careerPaths/SkillMatrix";
import { LearningSection } from "@/components/careerPaths/LearningSection";
import { JobsSection } from "@/components/careerPaths/JobsSection";
import { OpportunitiesSection } from "@/components/careerPaths/OpportunitiesSection";
import { RoleBranchDiagram, type RoleNode } from "@/components/careerPaths/RoleBranchDiagram";
import { CareerToolsGrid, type CareerTool } from "@/components/careerPaths/CareerToolsGrid";
import { ProjectCard, type ProjectCardData } from "@/components/careerPaths/ProjectCard";
import type { JobCardData } from "@/components/jobs/JobCard";
import type { OpportunityCardData } from "@/components/opportunities/OpportunityCard";
import { getSkillGraph } from "@/lib/careerPathGraph";
import { CAREER_PATH_ICON_PATHS } from "@/lib/careerPaths/icons";
import { stripHtmlForMeta } from "@/lib/stripHtml";
import { formatMoney } from "@/lib/formatMoney";
import {
  courseToLearnItem,
  resourceToLearnItem,
  COURSE_SELECT,
  RESOURCE_SELECT,
  LEARN_RESOURCE_KINDS,
  type LearnItem,
  type CourseRow,
  type ResourceRow,
} from "@/lib/learn/types";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Jobs/opportunities get a higher cap than a plain teaser grid would need
// (6) because JobsSection/OpportunitiesSection filter this same pre-fetched
// set client-side by location/type tab -- too tight a cap here means a tab
// can show "none" even when matching rows exist beyond the cut-off.
const CARD_LIMIT = 12;
const LEARNING_LIMIT = 12;

const NAV_ITEMS: SectionNavItem[] = [
  { id: "overview", label: "Overview" },
  { id: "roadmap", label: "Roadmap" },
  { id: "skills", label: "Skills" },
  { id: "learning", label: "Learning" },
  { id: "jobs", label: "Jobs" },
  { id: "opportunities", label: "Opportunities" },
  { id: "career-options", label: "Career Options" },
  { id: "tools", label: "Tools" },
  { id: "projects", label: "Projects" },
];

type PathSkill = { id: string; name: string; slug: string; level: "beginner" | "intermediate" | "advanced" | null };

type CareerPathDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  access: "free" | "premium";
  price_usd: number | null;
  price_ngn: number | null;
  featured: boolean;
  level: "beginner" | "intermediate" | "advanced" | null;
  category: string | null;
  icon_key: string;
  image_url: string | null;
  who_its_for: string[] | null;
  career_path_skill_map: { level: "beginner" | "intermediate" | "advanced" | null; skills: { id: string; name: string; slug: string } }[];
};

async function getCareerPath(slug: string) {
  const { data } = await supabase
    .from("career_paths")
    .select(
      "id, slug, title, description, access, price_usd, price_ngn, featured, level, category, icon_key, image_url, who_its_for, career_path_skill_map(level, skills(id, name, slug))"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data as unknown as CareerPathDetail | null;
}

type ResponsibilityRow = { id: string; title: string; body: string | null };

async function getResponsibilities(pathId: string): Promise<ResponsibilityRow[]> {
  const { data } = await supabase
    .from("career_path_responsibilities")
    .select("id, title, body")
    .eq("career_path_id", pathId)
    .order("position");
  return data || [];
}

type StageRow = { id: string; title: string; description: string | null; items: string[] | null };

async function getRoadmapStages(pathId: string): Promise<RoadmapStageData[]> {
  const { data: stageRows } = await supabase
    .from("career_path_roadmap_stages")
    .select("id, title, description, items")
    .eq("career_path_id", pathId)
    .order("position");

  const stages = (stageRows as StageRow[]) || [];
  if (stages.length === 0) return [];

  return Promise.all(
    stages.map(async (stage) => {
      const { data: stageSkillRows } = await supabase
        .from("career_path_roadmap_stage_skill_map")
        .select("skill_id, skills(slug, name)")
        .eq("stage_id", stage.id);

      const rows = (stageSkillRows as unknown as { skill_id: string; skills: { slug: string; name: string } | null }[]) || [];
      const skills = rows.map((r) => r.skills).filter((s): s is { slug: string; name: string } => !!s);
      const skillIds = rows.map((r) => r.skill_id);

      const graph = skillIds.length > 0 ? await getSkillGraph(skillIds, { limit: 3 }) : null;

      return {
        id: stage.id,
        title: stage.title,
        description: stage.description,
        items: stage.items,
        skills,
        recommendedCourses: graph?.courses.map((c) => ({ slug: c.slug, title: c.title })) || [],
        recommendedResources: graph?.resources.map((r) => ({ slug: r.slug, title: r.title })) || [],
      };
    })
  );
}

type RoleRow = { id: string; parent_role_id: string | null; title: string; description: string | null };

async function getCareerRoles(pathId: string): Promise<RoleNode[]> {
  const { data: roleRows } = await supabase
    .from("career_path_roles")
    .select("id, parent_role_id, title, description")
    .eq("career_path_id", pathId)
    .order("position");

  const roles = (roleRows as RoleRow[]) || [];
  if (roles.length === 0) return [];

  const nodes = await Promise.all(
    roles.map(async (r) => {
      const { data: skillRows } = await supabase
        .from("career_path_role_skill_map")
        .select("skill_id, skills(slug, name)")
        .eq("role_id", r.id);

      const rows = (skillRows as unknown as { skill_id: string; skills: { slug: string; name: string } | null }[]) || [];
      const skills = rows.map((row) => row.skills).filter((s): s is { slug: string; name: string } => !!s);
      const skillIds = rows.map((row) => row.skill_id);

      const graph = skillIds.length > 0 ? await getSkillGraph(skillIds, { limit: 3 }) : null;

      const node: RoleNode & { parentId: string | null } = {
        id: r.id,
        title: r.title,
        description: r.description,
        skills,
        skillSlugs: skills.map((s) => s.slug),
        jobs: graph?.jobs.map((j) => ({ slug: j.slug, title: j.title, companies: j.companies })) || [],
        recommendedCourses: graph?.courses.map((c) => ({ slug: c.slug, title: c.title })) || [],
        recommendedResources: graph?.resources.map((res) => ({ slug: res.slug, title: res.title })) || [],
        children: [],
        parentId: r.parent_role_id,
      };
      return node;
    })
  );

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const roots: RoleNode[] = [];
  for (const n of nodes) {
    if (n.parentId) byId.get(n.parentId)?.children.push(n);
    else roots.push(n);
  }
  return roots;
}

async function getCareerTools(pathId: string): Promise<CareerTool[]> {
  const { data } = await supabase
    .from("career_path_tool_map")
    .select("tools!inner(key, title, description, icon_key, href, badge, status)")
    .eq("career_path_id", pathId)
    .eq("tools.status", "published");

  return ((data as unknown as { tools: CareerTool }[]) || []).map((row) => row.tools);
}

async function getProjects(pathId: string): Promise<ProjectCardData[]> {
  const { data: projectRows } = await supabase
    .from("career_path_projects")
    .select("id, title, level, description, external_link")
    .eq("career_path_id", pathId)
    .eq("status", "published")
    .order("position");

  const projects = projectRows || [];
  if (projects.length === 0) return [];

  const { data: skillRows } = await supabase
    .from("career_path_project_skill_map")
    .select("project_id, skills(slug, name)")
    .in("project_id", projects.map((p) => p.id));

  const skillsByProject = new Map<string, { slug: string; name: string }[]>();
  for (const row of (skillRows as unknown as { project_id: string; skills: { slug: string; name: string } | null }[]) || []) {
    if (!row.skills) continue;
    skillsByProject.set(row.project_id, [...(skillsByProject.get(row.project_id) || []), row.skills]);
  }

  return projects.map((p) => ({ ...p, skills: skillsByProject.get(p.id) || [] }));
}

// Multi-skill version of the idsForSkill helper on /skills/[slug] -- a
// career path is tagged with several skills at once, not just one.
async function idsForSkills(table: string, idColumn: string, skillIds: string[]): Promise<string[]> {
  if (skillIds.length === 0) return [];
  const { data } = await supabase.from(table).select(idColumn).in("skill_id", skillIds);
  const rows = (data || []) as unknown as Record<string, unknown>[];
  return Array.from(new Set(rows.map((r) => String(r[idColumn]))));
}

// Learning is explicit curation now (career_path_course_map /
// career_path_resource_map), not skill-tag matching - unlike jobs/
// opportunities below, which still use idsForSkills. Returns a Map so the
// admin's chosen `position` survives into the combined sort further down,
// not just a plain id array.
async function learningMapForPath(table: string, idColumn: string, pathId: string): Promise<Map<string, number>> {
  const { data } = await supabase.from(table).select(`${idColumn}, position`).eq("career_path_id", pathId);
  const map = new Map<string, number>();
  for (const row of (data || []) as unknown as Record<string, unknown>[]) {
    map.set(String(row[idColumn]), Number(row.position) || 0);
  }
  return map;
}

async function jobsCountBySkill(skillIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (skillIds.length === 0) return counts;
  const { data } = await supabase.from("job_skill_map").select("skill_id").in("skill_id", skillIds);
  for (const row of data || []) counts.set(row.skill_id, (counts.get(row.skill_id) || 0) + 1);
  return counts;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const path = await getCareerPath(slug);
  if (!path) return { title: "Career path not found" };
  return {
    title: `${path.title} Career Path`,
    description: (path.description ? stripHtmlForMeta(path.description) : "") || `Skills, courses, resources, jobs and opportunities for a career in ${path.title}.`,
  };
}

export default async function CareerPathDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const path = await getCareerPath(slug);
  if (!path) return notFound();

  const skills: PathSkill[] = (path.career_path_skill_map || [])
    .filter((m) => m.skills)
    .map((m) => ({ ...m.skills, level: m.level }));
  const skillIds = skills.map((s) => s.id);
  const skillSlugs = skills.map((s) => s.slug);
  const nowIso = new Date().toISOString();

  const [responsibilities, roadmapStages, careerRoles, careerTools, projects, jobIds, oppIds, courseMap, resourceMap, jobCounts] = await Promise.all([
    getResponsibilities(path.id),
    getRoadmapStages(path.id),
    getCareerRoles(path.id),
    getCareerTools(path.id),
    getProjects(path.id),
    idsForSkills("job_skill_map", "job_id", skillIds),
    idsForSkills("opportunity_skill_map", "opportunity_id", skillIds),
    learningMapForPath("career_path_course_map", "course_id", path.id),
    learningMapForPath("career_path_resource_map", "resource_id", path.id),
    jobsCountBySkill(skillIds),
  ]);

  // Sorted by position and capped here, before the queries below - those
  // queries order by featured/created_at (irrelevant now that order is an
  // explicit admin choice) and only exist to fetch full rows for whichever
  // ids survive this cut. Capping *after* that unrelated ordering instead
  // would silently keep the wrong LEARNING_LIMIT items whenever a path is
  // curated with more than LEARNING_LIMIT courses or resources.
  const courseIds = Array.from(courseMap.keys()).sort((a, b) => courseMap.get(a)! - courseMap.get(b)!).slice(0, LEARNING_LIMIT);
  const resourceIds = Array.from(resourceMap.keys()).sort((a, b) => resourceMap.get(a)! - resourceMap.get(b)!).slice(0, LEARNING_LIMIT);

  const [jobRows, oppRows, courseRows, resourceRows] = await Promise.all([
    jobIds.length
      ? supabase.from("jobs")
          .select("id, slug, title, location_type, country, city, salary_min, salary_max, salary_currency, salary_period, experience_level, deadline_at, published_at, featured, companies!inner(name, logo_url, verified), job_categories(name), job_types(name), job_skill_map(skills(slug, name))")
          .eq("status", "published").or(`expires_at.is.null,expires_at.gte.${nowIso}`).in("id", jobIds)
          .order("featured", { ascending: false }).order("published_at", { ascending: false, nullsFirst: false }).limit(CARD_LIMIT)
      : Promise.resolve({ data: [] }),
    oppIds.length
      ? supabase.from("opportunities")
          .select("id, slug, title, organisation_name, organisation_logo_url, location_type, country, city, eligibility_summary, eligible_locations, benefit_tags, deadline_at, published_at, featured, opportunity_types(id, slug, name), opportunity_skill_map(skills(slug, name))")
          .eq("status", "published").or(`expires_at.is.null,expires_at.gte.${nowIso}`).in("id", oppIds)
          .order("featured", { ascending: false }).order("published_at", { ascending: false, nullsFirst: false }).limit(CARD_LIMIT)
      : Promise.resolve({ data: [] }),
    courseIds.length
      ? supabase.from("courses").select(COURSE_SELECT).eq("status", "published").in("id", courseIds)
          .order("featured", { ascending: false }).order("created_at", { ascending: false }).limit(LEARNING_LIMIT)
      : Promise.resolve({ data: [] }),
    resourceIds.length
      ? supabase.from("resources").select(RESOURCE_SELECT).eq("status", "published").eq("show_in_learn", true).in("resource_type", LEARN_RESOURCE_KINDS).in("id", resourceIds)
          .order("featured", { ascending: false }).order("created_at", { ascending: false }).limit(LEARNING_LIMIT)
      : Promise.resolve({ data: [] }),
  ]);

  const jobs: JobCardData[] = ((jobRows.data as unknown as {
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

  const oppRawRows = (oppRows.data as unknown as {
    id: string; slug: string; title: string; organisation_name: string | null; organisation_logo_url: string | null;
    location_type: "remote" | "hybrid" | "on_site" | "any"; country: string | null; city: string | null;
    eligibility_summary: string | null; eligible_locations: string[] | null; benefit_tags: string[] | null;
    deadline_at: string | null; featured: boolean; opportunity_types: { id: string; slug: string; name: string } | null;
    opportunity_skill_map: { skills: { slug: string; name: string } | null }[];
  }[]) || [];

  const opportunities: OpportunityCardData[] = oppRawRows.map((o) => ({
    id: o.id, slug: o.slug, title: o.title,
    organisation_name: o.organisation_name, organisation_logo_url: o.organisation_logo_url,
    type: o.opportunity_types?.name || null, location_type: o.location_type, country: o.country, city: o.city,
    eligibility_summary: o.eligibility_summary, eligible_locations: o.eligible_locations, benefit_tags: o.benefit_tags,
    skills: o.opportunity_skill_map.map((m) => m.skills).filter((s): s is { slug: string; name: string } => Boolean(s)),
    deadline_at: o.deadline_at, featured: o.featured,
  }));

  const opportunityTypes = Array.from(
    new Map(oppRawRows.filter((o) => o.opportunity_types).map((o) => [o.opportunity_types!.slug, o.opportunity_types!])).values()
  );

  // Each query above is already capped at LEARNING_LIMIT independently --
  // no further slice here. An outer .slice(0, LEARNING_LIMIT) on the
  // concatenated list would silently drop every resource (videos/articles/
  // guides/ebooks) whenever a path has LEARNING_LIMIT+ matching courses,
  // since courses are concatenated first.
  //
  // Sorted by `position` after concatenating (not before) - position lives
  // in two separate tables (career_path_course_map/career_path_resource_map),
  // but LearningItemPicker assigns it from one shared index sequence across
  // both when the admin saves, so sorting the combined list by position
  // here reconstructs that exact admin-chosen order regardless of which
  // table each item actually came from.
  const learningItems: LearnItem[] = [
    ...((courseRows.data as unknown as CourseRow[]) || []).map(courseToLearnItem).map((item) => ({ item, position: courseMap.get(item.id) ?? 0 })),
    ...((resourceRows.data as unknown as ResourceRow[]) || []).map(resourceToLearnItem).map((item) => ({ item, position: resourceMap.get(item.id) ?? 0 })),
  ]
    .sort((a, b) => a.position - b.position)
    .map(({ item }) => item);

  const skillMatrixRows: SkillMatrixRow[] = skills.map((s) => ({
    slug: s.slug, name: s.name, level: s.level, jobsCount: jobCounts.get(s.id) || 0,
  }));

  // "Choose your starting point" CTAs bucket by the per-skill level set in
  // admin -- if a bucket is empty (level not tagged on any skill yet),
  // fall back to every one of the path's skills rather than linking to an
  // effectively unfiltered /learn or /jobs page.
  const bucketSlugs = (level: "beginner" | "intermediate" | "advanced") => {
    const matched = skills.filter((s) => s.level === level).map((s) => s.slug);
    return matched.length > 0 ? matched : skillSlugs;
  };

  const iconPath = CAREER_PATH_ICON_PATHS[path.icon_key] || CAREER_PATH_ICON_PATHS.path;

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-5xl px-4 pt-10">
        <Reveal>
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Career Paths", href: "/career-paths" }, { label: path.title }]} />
        </Reveal>

        {/* HERO / OVERVIEW */}
        <section id="overview" className="mt-6 grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start">
          <Reveal>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${path.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {path.access === "premium"
                  ? `Premium${
                      path.price_usd || path.price_ngn
                        ? ` - ${[
                            path.price_usd ? formatMoney(path.price_usd, "USD") : null,
                            path.price_ngn ? formatMoney(path.price_ngn, "NGN") : null,
                          ].filter(Boolean).join(" / ")}`
                        : ""
                    }`
                  : "Free"}
              </span>
              {path.featured && (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">Featured</span>
              )}
              {path.level && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide capitalize text-muted-foreground">{path.level}</span>
              )}
              {path.category && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide capitalize text-muted-foreground">{path.category}</span>
              )}
            </div>

            <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">{path.title}</h1>

            {path.description && <RichText html={path.description} className="mt-4" />}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="#learning" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Start Learning
              </Link>
              <SaveButton itemType="career_path" itemId={path.id} />
              <CareerInterestButton careerPathId={path.id} className="text-xs" />
            </div>

            {path.access === "premium" && (path.price_usd || path.price_ngn) && (
              <BuyButton
                itemType="career_path"
                itemId={path.id}
                priceUsd={path.price_usd}
                priceNgn={path.price_ngn}
                className="mt-4 max-w-xs"
              />
            )}
          </Reveal>

          <Reveal delay={80}>
            <div className="flex h-40 w-40 flex-shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-primary/5 sm:h-48 sm:w-48">
              {path.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={path.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} className="text-primary/40">
                  <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                </svg>
              )}
            </div>
          </Reveal>
        </section>

        <SectionNav items={NAV_ITEMS} />

        {/* IS THIS FOR YOU */}
        {path.who_its_for && path.who_its_for.length > 0 && (
          <Reveal>
            <section className="mt-10">
              <h2 className="text-xl font-bold text-foreground">Is this path for you?</h2>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {path.who_its_for.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm text-foreground">
                    <span className="mt-0.5 flex-shrink-0 text-primary">✓</span>
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        )}

        {/* WHAT YOU'LL DO */}
        {responsibilities.length > 0 && (
          <Reveal>
            <section className="mt-10">
              <h2 className="text-xl font-bold text-foreground">What you&apos;ll do</h2>
              <div className="mt-4">
                <ResponsibilitiesAccordion items={responsibilities} />
              </div>
            </section>
          </Reveal>
        )}

        {/* ROADMAP */}
        {roadmapStages.length > 0 && (
          <Reveal>
            <section id="roadmap" className="mt-10 scroll-mt-32">
              <h2 className="text-xl font-bold text-foreground">Career roadmap</h2>
              <div className="mt-4">
                <RoadmapStrip stages={roadmapStages} />
              </div>
            </section>
          </Reveal>
        )}

        {/* SKILLS YOU NEED */}
        {skillMatrixRows.length > 0 && (
          <Reveal>
            <section id="skills" className="mt-10 scroll-mt-32">
              <h2 className="text-xl font-bold text-foreground">Skills you need</h2>
              <div className="mt-4">
                <SkillMatrix rows={skillMatrixRows} />
              </div>
            </section>
          </Reveal>
        )}

        {/* CHOOSE YOUR STARTING POINT */}
        {skillSlugs.length > 0 && (
          <Reveal>
            <section className="mt-10">
              <h2 className="text-xl font-bold text-foreground">Choose your starting point</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-sm font-bold text-foreground">I&apos;m completely new</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">Start with the fundamentals.</p>
                  <Link href={`/learn?skills=${bucketSlugs("beginner").join(",")}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Start here →</Link>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-sm font-bold text-foreground">I have some experience</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">Build on what you already know.</p>
                  <Link href={`/learn?skills=${bucketSlugs("intermediate").join(",")}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Continue →</Link>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-sm font-bold text-foreground">I&apos;m ready for work</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">Focus on job readiness.</p>
                  <Link href={`/jobs?skills=${skillSlugs.join(",")}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Get job ready →</Link>
                </div>
              </div>
            </section>
          </Reveal>
        )}

        {/* LEARNING */}
        <Reveal delay={80}>
          <section id="learning" className="mt-10 scroll-mt-32">
            <h2 className="text-xl font-bold text-foreground">Learn for this career</h2>
            <div className="mt-4">
              <LearningSection items={learningItems} skillSlugs={skillSlugs} />
            </div>
          </section>
        </Reveal>

        {/* JOBS */}
        <Reveal delay={120}>
          <section id="jobs" className="mt-10 scroll-mt-32">
            <h2 className="text-xl font-bold text-foreground">Jobs for this career</h2>
            <div className="mt-4">
              <JobsSection jobs={jobs} skillSlugs={skillSlugs} />
            </div>
          </section>
        </Reveal>

        {/* OPPORTUNITIES */}
        <Reveal delay={160}>
          <section id="opportunities" className="mt-10 scroll-mt-32">
            <h2 className="text-xl font-bold text-foreground">Opportunities</h2>
            <div className="mt-4">
              <OpportunitiesSection opportunities={opportunities} types={opportunityTypes} skillSlugs={skillSlugs} />
            </div>
          </section>
        </Reveal>

        {/* WHAT CAN YOU BECOME */}
        {careerRoles.length > 0 && (
          <Reveal delay={200}>
            <section id="career-options" className="mt-10 scroll-mt-32">
              <h2 className="text-xl font-bold text-foreground">What can you become?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Click a role to see its own skills, learning and jobs.</p>
              <div className="mt-6">
                <RoleBranchDiagram pathTitle={path.title} roles={careerRoles} />
              </div>
            </section>
          </Reveal>
        )}

        {/* TOOLS */}
        {careerTools.length > 0 && (
          <Reveal>
            <section id="tools" className="mt-10 scroll-mt-32">
              <h2 className="text-xl font-bold text-foreground">Tools you&apos;ll use</h2>
              <div className="mt-4">
                <CareerToolsGrid tools={careerTools} />
              </div>
            </section>
          </Reveal>
        )}

        {/* BUILD EXPERIENCE */}
        {projects.length > 0 && (
          <Reveal>
            <section id="projects" className="mt-10 scroll-mt-32">
              <h2 className="text-xl font-bold text-foreground">Build experience while you learn</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
              </div>
            </section>
          </Reveal>
        )}

        {/* WHAT HAPPENS NEXT */}
        <Reveal>
          <section className="mt-10">
            <h2 className="text-xl font-bold text-foreground">What happens next?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your journey doesn&apos;t end when you get the first job.</p>
            <div className="mt-6 flex flex-wrap items-start gap-x-2 gap-y-4">
              {["Learn", "Practice", "Prove", "Apply", "Grow"].map((step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">{step}</span>
                  {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {skillIds.length === 0 && (
          <p className="mt-10 rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center text-sm text-muted-foreground">
            This career path hasn&rsquo;t been tagged with skills yet, so there&rsquo;s nothing to connect it to yet - once it is, related learning, jobs and opportunities will show up here automatically.
          </p>
        )}

        {/* FINAL CTA */}
        <Reveal>
          <section className="mt-14 rounded-3xl bg-foreground px-8 py-12 text-center">
            <h2 className="text-2xl font-bold text-background sm:text-3xl">Ready to start your career in {path.title}?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-background/70">You don&apos;t need to figure everything out at once. Start with the first skill.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="#learning" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">Start Learning</Link>
              <Link href={`/jobs?skills=${skillSlugs.join(",")}`} className="rounded-xl border border-background/30 px-6 py-3 text-sm font-semibold text-background hover:bg-background/10">Explore Jobs</Link>
              <Link href={`/opportunities?skills=${skillSlugs.join(",")}`} className="rounded-xl border border-background/30 px-6 py-3 text-sm font-semibold text-background hover:bg-background/10">Find Opportunities</Link>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
