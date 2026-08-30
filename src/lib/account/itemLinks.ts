import { supabase } from "@/lib/supabase";

export const ITEM_TABLE: Record<string, string> = {
  job: "jobs",
  opportunity: "opportunities",
  resource: "resources",
  course: "courses",
  career_path: "career_paths",
  skill: "skills",
};

export const ITEM_LABEL: Record<string, string> = {
  job: "Job",
  opportunity: "Opportunity",
  resource: "Resource",
  course: "Course",
  career_path: "Career Path",
  skill: "Skill",
};

export function hrefFor(itemType: string, slug?: string | null): string | null {
  if (!slug) return null;
  switch (itemType) {
    case "job": return `/jobs/${slug}`;
    case "opportunity": return `/opportunities/${slug}`;
    case "resource": return `/resources/${slug}`;
    case "course": return `/learn/${slug}`;
    case "career_path": return `/career-paths/${slug}`;
    case "skill": return `/skills/${slug}`;
    default: return null;
  }
}

export async function attachTitles<T extends { item_type: string; item_id: string }>(rows: T[]): Promise<(T & { title?: string; slug?: string })[]> {
  const byType: Record<string, string[]> = {};
  for (const r of rows) (byType[r.item_type] ||= []).push(r.item_id);

  const infoMap: Record<string, { title: string; slug: string }> = {};
  await Promise.all(
    Object.entries(byType).map(async ([type, ids]) => {
      const table = ITEM_TABLE[type];
      if (!table) return;
      // skills has a `name` column, not `title` like every other saveable
      // table - aliased back to `title` in the select so the rest of this
      // function can stay generic across item types.
      const { data } = await supabase.from(table).select(type === "skill" ? "id, title:name, slug" : "id, title, slug").in("id", ids);
      (data || []).forEach((row: { id: string; title: string; slug: string }) => { infoMap[row.id] = { title: row.title, slug: row.slug }; });
    })
  );

  return rows.map((r) => ({ ...r, title: infoMap[r.item_id]?.title || "Untitled", slug: infoMap[r.item_id]?.slug }));
}
