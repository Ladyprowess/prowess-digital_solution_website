// The one normalized shape both courses and resources (video/article/guide/
// ebook) get mapped into so /learn can show them side by side in a single
// feed, sort, and paginate them together - PostgREST has no cross-table
// UNION, so this merge happens in TypeScript after two separate queries.
import { creatorCredit } from "@/lib/learn/courseSource";

export type LearnKind = "course" | "video" | "article" | "guide" | "ebook";

export type LearnItem = {
  id: string;
  slug: string;
  href: string;
  kind: LearnKind;
  title: string;
  description: string | null;
  level: "beginner" | "intermediate" | "advanced" | null;
  access: "free" | "premium";
  price_usd: number | null;
  price_ngn: number | null;
  thumbnail_url: string | null;
  featured: boolean;
  skills: { slug: string; name: string }[];
  createdAt: string | null;
  // Who made it, when that is not us. Null on our own courses and on
  // resources, which carry their own source handling.
  creator: string | null;
};

export type CourseRow = {
  id: string; slug: string; title: string; description: string | null;
  level: "beginner" | "intermediate" | "advanced" | null;
  access: "free" | "premium"; price_usd: number | null; price_ngn: number | null;
  thumbnail_url: string | null; featured: boolean; created_at: string;
  course_skill_map: { skills: { slug: string; name: string } | null }[];
  // Absent until the curated-courses migration runs, hence optional.
  source?: string | null;
  creator_name?: string | null;
};

export type ResourceRow = {
  id: string; slug: string; title: string; description: string | null;
  resource_type: string | null;
  level: "beginner" | "intermediate" | "advanced" | null;
  access: "free" | "premium"; price_usd: number | null; price_ngn: number | null;
  thumbnail_url: string | null; featured: boolean; created_at: string;
  resource_skill_map: { skills: { slug: string; name: string } | null }[];
};

// Shared field-select strings for courses/resources shaped for LearnItem -
// exported so any page needing a course/resource feed (currently /learn and
// /skills/[slug]'s Recommended Learning section) uses the exact same shape
// instead of two copies drifting apart.
const COURSE_SELECT_BASE = "id, slug, title, description, level, access, price_usd, price_ngn, thumbnail_url, featured, created_at, course_skill_map(skills(slug, name))";

// source/creator_name arrive with the curated-courses migration
// (supabase/course_external_creators.sql). Postgres rejects the entire
// select if one column is missing, which would empty every Learn feed on
// the site in the window between deploying and running that SQL - so
// selectCourses below asks for them and quietly retries without.
export const COURSE_SELECT = `${COURSE_SELECT_BASE}, source, creator_name`;

type CourseQueryResult = { data: unknown; error: { message: string } | null };

/**
 * Runs a course query with the curated-course columns, falling back to the
 * columns that have always existed if the database does not have them yet.
 * Every Learn feed goes through this so none of them can break on a
 * migration that has not been applied.
 */
export async function selectCourses(build: (select: string) => PromiseLike<CourseQueryResult>): Promise<CourseRow[]> {
  const withSource = await build(COURSE_SELECT);
  if (!withSource.error) return (withSource.data as CourseRow[]) || [];

  const withoutSource = await build(COURSE_SELECT_BASE);
  return (withoutSource.data as CourseRow[]) || [];
}
export const RESOURCE_SELECT = "id, slug, title, description, resource_type, level, access, price_usd, price_ngn, thumbnail_url, featured, created_at, resource_skill_map(skills(slug, name))";
export const LEARN_RESOURCE_KINDS = ["video", "article", "guide", "ebook"];

export function courseToLearnItem(c: CourseRow): LearnItem {
  return {
    id: c.id, slug: c.slug, href: `/learn/${c.slug}`, kind: "course",
    title: c.title, description: c.description,
    level: c.level, access: c.access, price_usd: c.price_usd, price_ngn: c.price_ngn,
    thumbnail_url: c.thumbnail_url, featured: c.featured,
    skills: c.course_skill_map.map((m) => m.skills).filter((s): s is { slug: string; name: string } => Boolean(s)),
    createdAt: c.created_at,
    creator: creatorCredit(c.source, c.creator_name),
  };
}

// resource_type is a wider enum on the table than what Learn surfaces -
// only video/article/guide/ebook rows are ever queried for this feed, so
// the cast is safe (checklist/template/podcast/etc never reach this mapper).
// Video gets its own dedicated detail page (/videos/[slug]) rather than
// the generic /resources/[slug] every other resource type shares.
export function resourceToLearnItem(r: ResourceRow): LearnItem {
  return {
    id: r.id, slug: r.slug, href: r.resource_type === "video" ? `/videos/${r.slug}` : `/resources/${r.slug}`, kind: r.resource_type as LearnKind,
    title: r.title, description: r.description,
    level: r.level, access: r.access, price_usd: r.price_usd, price_ngn: r.price_ngn,
    thumbnail_url: r.thumbnail_url, featured: r.featured,
    skills: r.resource_skill_map.map((m) => m.skills).filter((s): s is { slug: string; name: string } => Boolean(s)),
    createdAt: r.created_at,
    creator: null,
  };
}
