// The one normalized shape both courses and resources (video/article/guide/
// ebook) get mapped into so /learn can show them side by side in a single
// feed, sort, and paginate them together - PostgREST has no cross-table
// UNION, so this merge happens in TypeScript after two separate queries.
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
  price: number | null;
  price_currency: string | null;
  thumbnail_url: string | null;
  featured: boolean;
  skills: { slug: string; name: string }[];
  createdAt: string | null;
};

export type CourseRow = {
  id: string; slug: string; title: string; description: string | null;
  level: "beginner" | "intermediate" | "advanced" | null;
  access: "free" | "premium"; price: number | null; price_currency: string | null;
  thumbnail_url: string | null; featured: boolean; created_at: string;
  course_skill_map: { skills: { slug: string; name: string } | null }[];
};

export type ResourceRow = {
  id: string; slug: string; title: string; description: string | null;
  resource_type: string | null;
  level: "beginner" | "intermediate" | "advanced" | null;
  access: "free" | "premium"; price: number | null; price_currency: string | null;
  thumbnail_url: string | null; featured: boolean; created_at: string;
  resource_skill_map: { skills: { slug: string; name: string } | null }[];
};

export function courseToLearnItem(c: CourseRow): LearnItem {
  return {
    id: c.id, slug: c.slug, href: `/learn/${c.slug}`, kind: "course",
    title: c.title, description: c.description,
    level: c.level, access: c.access, price: c.price, price_currency: c.price_currency,
    thumbnail_url: c.thumbnail_url, featured: c.featured,
    skills: c.course_skill_map.map((m) => m.skills).filter((s): s is { slug: string; name: string } => Boolean(s)),
    createdAt: c.created_at,
  };
}

// resource_type is a wider enum on the table than what Learn surfaces -
// only video/article/guide/ebook rows are ever queried for this feed, so
// the cast is safe (checklist/template/podcast/etc never reach this mapper).
export function resourceToLearnItem(r: ResourceRow): LearnItem {
  return {
    id: r.id, slug: r.slug, href: `/resources/${r.slug}`, kind: r.resource_type as LearnKind,
    title: r.title, description: r.description,
    level: r.level, access: r.access, price: r.price, price_currency: r.price_currency,
    thumbnail_url: r.thumbnail_url, featured: r.featured,
    skills: r.resource_skill_map.map((m) => m.skills).filter((s): s is { slug: string; name: string } => Boolean(s)),
    createdAt: r.created_at,
  };
}
