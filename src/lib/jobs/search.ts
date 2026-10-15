import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobCardData } from "@/components/jobs/JobCard";
import { CLOSING_SOON_DAYS } from "@/lib/closingSoon";
import type { JobFilters } from "./filters";

// Shared by the /jobs server render (so the first page of results is in the
// HTML search engines and link previews read) and the client-side filters.

export const JOBS_PAGE_SIZE = 12;

export type JobLookup = { id: string; slug: string; name: string };
export type JobLookups = { categories: JobLookup[]; types: JobLookup[]; skills: JobLookup[] };
export type JobsPage = { jobs: JobCardData[]; total: number };

type JobQueryRow = {
  id: string; slug: string; title: string;
  location_type: "remote" | "hybrid" | "on_site";
  country: string | null; city: string | null;
  salary_min: number | null; salary_max: number | null; salary_currency: string | null; salary_period: string | null;
  experience_level: string | null;
  deadline_at: string | null; published_at: string | null; featured: boolean;
  companies: { name: string; logo_url: string | null; verified: boolean } | null;
  job_categories: { name: string } | null;
  job_types: { name: string } | null;
  job_skill_map: { skills: { slug: string; name: string } | null }[];
};

function toCardData(j: JobQueryRow): JobCardData {
  return {
    id: j.id, slug: j.slug, title: j.title,
    company: j.companies,
    category: j.job_categories?.name || null,
    location_type: j.location_type, country: j.country, city: j.city,
    job_type: j.job_types?.name || null,
    experience_level: j.experience_level,
    salary_min: j.salary_min, salary_max: j.salary_max, salary_currency: j.salary_currency, salary_period: j.salary_period,
    skills: (j.job_skill_map || []).map((m) => m.skills).filter((s): s is { slug: string; name: string } => Boolean(s)),
    published_at: j.published_at, deadline_at: j.deadline_at, featured: j.featured,
  };
}

export async function fetchJobLookups(db: SupabaseClient): Promise<JobLookups> {
  const [cats, jobTypes, skillRows] = await Promise.all([
    db.from("job_categories").select("id, slug, name").order("name"),
    db.from("job_types").select("id, slug, name").order("name"),
    db.from("skills").select("id, slug, name").order("name"),
  ]);
  return { categories: cats.data || [], types: jobTypes.data || [], skills: skillRows.data || [] };
}

export async function fetchJobsPage(db: SupabaseClient, filters: JobFilters, lookups: JobLookups): Promise<JobsPage> {
  // Skill filtering is resolved as a separate id lookup rather than an
  // inner join on job_skill_map, so a job matching 2 of 3 selected
  // skills doesn't come back as 2 duplicate rows that would then need
  // deduping before pagination/count means anything.
  let skillJobIds: string[] | null = null;
  if (filters.skills.length > 0) {
    const skillIds = lookups.skills.filter((s) => filters.skills.includes(s.slug)).map((s) => s.id);
    if (skillIds.length === 0) return { jobs: [], total: 0 };
    const { data: mapRows } = await db.from("job_skill_map").select("job_id").in("skill_id", skillIds);
    skillJobIds = Array.from(new Set((mapRows || []).map((r: { job_id: string }) => r.job_id)));
    if (skillJobIds.length === 0) return { jobs: [], total: 0 };
  }

  let query = db
    .from("jobs")
    .select(
      "id, slug, title, location_type, country, city, salary_min, salary_max, salary_currency, salary_period, experience_level, deadline_at, published_at, featured, companies!inner(name, logo_url, verified), job_categories(name), job_types(name), job_skill_map(skills(slug, name))",
      { count: "exact" }
    )
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`);

  if (skillJobIds) query = query.in("id", skillJobIds);
  if (filters.q.trim()) query = query.ilike("title", `%${filters.q.trim()}%`);
  if (filters.category) {
    const cat = lookups.categories.find((c) => c.slug === filters.category);
    if (cat) query = query.eq("category_id", cat.id);
  }
  if (filters.type) {
    const t = lookups.types.find((x) => x.slug === filters.type);
    if (t) query = query.eq("type_id", t.id);
  }
  if (filters.locationType) query = query.eq("location_type", filters.locationType);
  if (filters.country.trim()) query = query.ilike("country", `%${filters.country.trim()}%`);
  if (filters.experience) query = query.eq("experience_level", filters.experience);
  if (filters.salaryMin) query = query.gte("salary_max", Number(filters.salaryMin));
  if (filters.salaryMax) query = query.lte("salary_min", Number(filters.salaryMax));
  if (filters.currency.trim()) query = query.eq("salary_currency", filters.currency.trim().toUpperCase());
  if (filters.datePosted) {
    const since = new Date(Date.now() - Number(filters.datePosted) * 86_400_000).toISOString();
    query = query.gte("published_at", since);
  }
  if (filters.closingSoon) {
    const soon = new Date(Date.now() + CLOSING_SOON_DAYS * 86_400_000).toISOString();
    query = query.gte("deadline_at", new Date().toISOString()).lte("deadline_at", soon);
  }
  if (filters.company.trim()) query = query.ilike("companies.name", `%${filters.company.trim()}%`);

  if (filters.sort === "newest") {
    query = query.order("published_at", { ascending: false, nullsFirst: false });
  } else if (filters.sort === "deadline") {
    query = query.order("deadline_at", { ascending: true, nullsFirst: false });
  } else if (filters.sort === "salary_high") {
    query = query.order("salary_max", { ascending: false, nullsFirst: false });
  } else if (filters.sort === "salary_low") {
    query = query.order("salary_min", { ascending: true, nullsFirst: false });
  } else {
    query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
  }

  const from = (filters.page - 1) * JOBS_PAGE_SIZE;
  const { data, count } = await query.range(from, from + JOBS_PAGE_SIZE - 1);
  return { jobs: ((data as unknown as JobQueryRow[]) || []).map(toCardData), total: count || 0 };
}
