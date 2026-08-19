import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type RelatedJob = { slug: string; title: string; companies: { name: string } | null };
export type RelatedOpportunity = { slug: string; title: string; organisation_name: string | null };
export type RelatedCourse = { slug: string; title: string; access: "free" | "premium"; price: number | null };
export type RelatedResource = { slug: string; title: string; resource_type: string | null; access: "free" | "premium"; price: number | null };

function dedupeBySlug<T extends { slug: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map((i) => [i.slug, i])).values());
}

/**
 * The actual payoff of tagging jobs/opportunities/courses/resources with the
 * shared skills taxonomy: given a career path's skill ids, pull everything
 * else in the platform tagged with any of the same skills. This is what
 * turns "Cybersecurity" from a static description into a real hub -
 * skills -> courses -> resources -> jobs -> opportunities, all live.
 */
export async function getCareerPathGraph(skillIds: string[]) {
  if (skillIds.length === 0) {
    return { jobs: [] as RelatedJob[], opportunities: [] as RelatedOpportunity[], courses: [] as RelatedCourse[], resources: [] as RelatedResource[] };
  }

  const [jobRows, oppRows, courseRows, resourceRows] = await Promise.all([
    supabase.from("job_skill_map").select("jobs!inner(slug, title, status, companies(name))").in("skill_id", skillIds).eq("jobs.status", "published"),
    supabase.from("opportunity_skill_map").select("opportunities!inner(slug, title, status, organisation_name)").in("skill_id", skillIds).eq("opportunities.status", "published"),
    supabase.from("course_skill_map").select("courses!inner(slug, title, status, access, price)").in("skill_id", skillIds).eq("courses.status", "published"),
    supabase.from("resource_skill_map").select("resources!inner(slug, title, status, resource_type, access, price)").in("skill_id", skillIds).eq("resources.status", "published"),
  ]);

  const jobs = dedupeBySlug(((jobRows.data || []) as unknown as { jobs: RelatedJob }[]).map((r) => r.jobs)).slice(0, 4);
  const opportunities = dedupeBySlug(((oppRows.data || []) as unknown as { opportunities: RelatedOpportunity }[]).map((r) => r.opportunities)).slice(0, 4);
  const courses = dedupeBySlug(((courseRows.data || []) as unknown as { courses: RelatedCourse }[]).map((r) => r.courses)).slice(0, 4);
  const resources = dedupeBySlug(((resourceRows.data || []) as unknown as { resources: RelatedResource }[]).map((r) => r.resources)).slice(0, 4);

  return { jobs, opportunities, courses, resources };
}
