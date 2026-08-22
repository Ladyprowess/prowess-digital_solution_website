import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type RelatedJob = { slug: string; title: string; companies: { name: string } | null };
export type RelatedOpportunity = { slug: string; title: string; organisation_name: string | null; opportunity_types: { slug: string } | null };
export type RelatedCourse = { slug: string; title: string; access: "free" | "premium"; price: number | null };
export type RelatedResource = { slug: string; title: string; resource_type: string | null; access: "free" | "premium"; price: number | null; thumbnail_url: string | null; source: string; external_url: string | null };
export type RelatedEvent = { slug: string; title: string; date: string | null };
export type RelatedCareerPath = { slug: string; title: string; access: "free" | "premium"; price: number | null };

function dedupeBySlug<T extends { slug: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map((i) => [i.slug, i])).values());
}

/**
 * The actual payoff of tagging jobs/opportunities/courses/resources/events
 * with the shared skills taxonomy: given a set of skill ids, pull everything
 * else in the platform tagged with any of them. This is what turns a skill
 * or career path from a static description into a real hub - skills ->
 * courses -> resources -> jobs -> opportunities -> events, all live.
 * Used by both /career-paths/[slug] (a short teaser, low limit) and
 * /skills/[slug] (the actual discovery page, higher limit).
 */
export async function getSkillGraph(skillIds: string[], options?: { limit?: number }) {
  const limit = options?.limit ?? 4;
  const empty = {
    jobs: [] as RelatedJob[],
    opportunities: [] as RelatedOpportunity[],
    internships: [] as RelatedOpportunity[],
    courses: [] as RelatedCourse[],
    resources: [] as RelatedResource[],
    videos: [] as RelatedResource[],
    events: [] as RelatedEvent[],
    careerPaths: [] as RelatedCareerPath[],
  };
  if (skillIds.length === 0) return empty;

  const [jobRows, oppRows, courseRows, resourceRows, eventRows, careerPathRows] = await Promise.all([
    supabase.from("job_skill_map").select("jobs!inner(slug, title, status, expires_at, companies(name))").in("skill_id", skillIds).eq("jobs.status", "published"),
    supabase.from("opportunity_skill_map").select("opportunities!inner(slug, title, status, expires_at, organisation_name, opportunity_types(slug))").in("skill_id", skillIds).eq("opportunities.status", "published"),
    supabase.from("course_skill_map").select("courses!inner(slug, title, status, access, price)").in("skill_id", skillIds).eq("courses.status", "published"),
    supabase.from("resource_skill_map").select("resources!inner(slug, title, status, resource_type, access, price, thumbnail_url, source, external_url)").in("skill_id", skillIds).eq("resources.status", "published").eq("resources.show_in_recommended", true),
    supabase.from("event_skill_map").select("events!inner(slug, title, date)").in("skill_id", skillIds),
    supabase.from("career_path_skill_map").select("career_paths!inner(slug, title, status, access, price)").in("skill_id", skillIds).eq("career_paths.status", "published"),
  ]);

  // Filtered in JS, not via a PostgREST .or() string on the query itself -
  // jobs/opportunities are nested through a !inner join here, and .or()
  // can't reach into a joined table's columns the way a top-level .eq() can.
  const nowIso = new Date().toISOString();
  const isNotExpired = (expiresAt: string | null) => !expiresAt || expiresAt >= nowIso;

  const allJobs = dedupeBySlug(
    ((jobRows.data || []) as unknown as { jobs: RelatedJob & { expires_at: string | null } }[])
      .map((r) => r.jobs)
      .filter((j) => isNotExpired(j.expires_at))
  );
  const allOpportunities = dedupeBySlug(
    ((oppRows.data || []) as unknown as { opportunities: RelatedOpportunity & { expires_at: string | null } }[])
      .map((r) => r.opportunities)
      .filter((o) => isNotExpired(o.expires_at))
  );
  const allResources = dedupeBySlug(((resourceRows.data || []) as unknown as { resources: RelatedResource }[]).map((r) => r.resources));

  const internships = allOpportunities.filter((o) => o.opportunity_types?.slug === "internships");
  const opportunities = allOpportunities.filter((o) => o.opportunity_types?.slug !== "internships");
  const videos = allResources.filter((r) => r.resource_type === "video");
  const resources = allResources.filter((r) => r.resource_type !== "video");

  return {
    jobs: allJobs.slice(0, limit),
    opportunities: opportunities.slice(0, limit),
    internships: internships.slice(0, limit),
    courses: dedupeBySlug(((courseRows.data || []) as unknown as { courses: RelatedCourse }[]).map((r) => r.courses)).slice(0, limit),
    resources: resources.slice(0, limit),
    videos: videos.slice(0, limit),
    events: dedupeBySlug(((eventRows.data || []) as unknown as { events: RelatedEvent }[]).map((r) => r.events)).slice(0, limit),
    careerPaths: dedupeBySlug(((careerPathRows.data || []) as unknown as { career_paths: RelatedCareerPath }[]).map((r) => r.career_paths)).slice(0, limit),
  };
}

export type RelatedSkill = { id: string; slug: string; name: string; description: string | null };

// "Related Skills" derived from real co-occurrence, not a curated list: for
// every job/opportunity/course/resource tagged with this skill, find every
// *other* skill also tagged on those same items, ranked by how often that
// overlap happens. Deliberately scoped to these four tables (not
// career_path_skill_map/event_skill_map) - the tables that actually drive
// day-to-day discovery on the platform.
const CO_OCCURRENCE_TABLES = [
  { map: "job_skill_map", idColumn: "job_id" },
  { map: "opportunity_skill_map", idColumn: "opportunity_id" },
  { map: "course_skill_map", idColumn: "course_id" },
  { map: "resource_skill_map", idColumn: "resource_id" },
] as const;

export async function getRelatedSkills(skillId: string, options?: { limit?: number }): Promise<RelatedSkill[]> {
  const limit = options?.limit ?? 8;
  const overlapCount = new Map<string, number>();

  await Promise.all(
    CO_OCCURRENCE_TABLES.map(async ({ map, idColumn }) => {
      const { data: ownRows } = await supabase.from(map).select(idColumn).eq("skill_id", skillId);
      const itemIds = Array.from(new Set((ownRows || []).map((r: Record<string, unknown>) => String(r[idColumn]))));
      if (itemIds.length === 0) return;

      const { data: coRows } = await supabase.from(map).select(`skill_id, ${idColumn}`).in(idColumn, itemIds).neq("skill_id", skillId);
      for (const row of (coRows || []) as { skill_id: string }[]) {
        overlapCount.set(row.skill_id, (overlapCount.get(row.skill_id) || 0) + 1);
      }
    })
  );

  const rankedIds = Array.from(overlapCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
  if (rankedIds.length === 0) return [];

  const { data: skillRows } = await supabase.from("skills").select("id, slug, name, description").in("id", rankedIds).eq("status", "published");
  const bySkillId = new Map((skillRows || []).map((s) => [s.id, s]));
  return rankedIds.map((id) => bySkillId.get(id)).filter((s): s is RelatedSkill => Boolean(s));
}
