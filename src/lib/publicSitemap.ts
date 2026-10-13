import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

// Anonymous reads respect the same publication policies as public visitors.
export async function publicContentSitemap(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const db = createClient(url, key, { auth: { persistSession: false } });
  const sources = [
    ["jobs", "jobs"], ["opportunities", "opportunities"], ["courses", "learn"],
    ["career_paths", "career-paths"], ["skills", "skills"], ["resources", "resources"],
    ["events", "events"], ["case_studies", "case-studies"],
  ];
  const groups = await Promise.all(sources.map(async ([table, path]) => {
    const entries: MetadataRoute.Sitemap = [];
    for (let offset = 0; offset < 50000; offset += 500) {
      let query = db.from(table).select(table === "resources" ? "slug,resource_type" : "slug")
        .eq(table === "case_studies" ? "is_published" : "status", table === "case_studies" ? true : "published")
        .order("id").range(offset, offset + 499);
      if (table === "jobs" || table === "opportunities") query = query.or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`);
      const { data, error } = await query.returns<{ slug: string; resource_type?: string }[]>();
      if (error) { console.warn(`Sitemap source unavailable: ${table}`); break; }
      for (const row of data || []) {
        if (typeof row.slug !== "string" || !row.slug) continue;
        const destination = table === "resources" && "resource_type" in row && row.resource_type === "video" ? "videos" : path;
        entries.push({ url: `${baseUrl}/${destination}/${encodeURIComponent(row.slug)}`, changeFrequency: "weekly", priority: 0.6 });
      }
      if (!data || data.length < 500) break;
    }
    return entries;
  }));
  return groups.flat();
}
