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
    supabase.from("resource_skill_map").select("resources!inner(slug, title, status, resource_type, access, price, thumbnail_url, source, external_url)").in("skill_id", skillIds).eq("resources.status", "published"),
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
