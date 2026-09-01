"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { KindIcon } from "@/components/learn/LearnCard";
import { PillTabs } from "@/components/PillTabs";
import { KIND_TABS } from "@/lib/learn/constants";
import type { LearnKind } from "@/lib/learn/types";

export type LearningItem = {
  id: string;
  type: "course" | "resource";
  title: string;
  // "course" for a course, or the resource's own resource_type
  // (video/article/guide/ebook) - doubles as the icon/filter key.
  kind: LearnKind;
  thumbnailUrl: string | null;
};

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

// Real search-and-select interface for attaching explicit learning content
// to a career path, replacing what would otherwise be a pill wall of every
// course/resource on the site. The selection is one ordered array (not
// separate course/resource lists) so an item's array index doubles as a
// combined display order spanning both source tables - see
// saveLearningMap below and the career path detail page's cross-table sort.
export function LearningItemPicker({
  items,
  onItemsChange,
}: {
  items: LearningItem[];
  onItemsChange: (items: LearningItem[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<LearnKind | "">("");
  const [results, setResults] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);

      const wantCourses = !kindFilter || kindFilter === "course";
      const wantResources = !kindFilter || kindFilter !== "course";
      const resourceTypes = kindFilter && kindFilter !== "course" ? [kindFilter] : ["video", "article", "guide", "ebook"];

      const [{ data: courseRows }, { data: resourceRows }] = await Promise.all([
        wantCourses
          ? supabase.from("courses").select("id, title, thumbnail_url").eq("status", "published").ilike("title", `%${search.trim()}%`).limit(20)
          : Promise.resolve({ data: [] as { id: string; title: string; thumbnail_url: string | null }[] }),
        wantResources
          ? supabase.from("resources").select("id, title, resource_type, thumbnail_url").eq("status", "published").in("resource_type", resourceTypes).ilike("title", `%${search.trim()}%`).limit(20)
          : Promise.resolve({ data: [] as { id: string; title: string; resource_type: string | null; thumbnail_url: string | null }[] }),
      ]);

      const courseResults: LearningItem[] = (courseRows || []).map((c) => ({
        id: c.id, type: "course", title: c.title, kind: "course", thumbnailUrl: c.thumbnail_url,
      }));
      const resourceResults: LearningItem[] = (resourceRows || []).map((r) => ({
        id: r.id, type: "resource", title: r.title, kind: (r.resource_type as LearnKind) || "article", thumbnailUrl: r.thumbnail_url,
      }));

      setResults([...courseResults, ...resourceResults]);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [search, kindFilter]);

  function isSelected(item: LearningItem) {
    return items.some((i) => i.type === item.type && i.id === item.id);
  }

  function add(item: LearningItem) {
    if (isSelected(item)) return;
    onItemsChange([...items, item]);
  }

  function remove(index: number) {
    onItemsChange(items.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onItemsChange(next);
  }

  return (
    <div>
      {items.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Selected learning</p>
          <div className="mt-2 grid gap-2">
            {items.map((item, index) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <KindIcon kind={item.kind} />
                </span>
                <span className="flex-1 truncate text-sm font-medium text-foreground">{item.title}</span>
                <span className="text-xs capitalize text-muted-foreground">{item.type === "course" ? "Course" : item.kind}</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded-lg border border-border px-2 py-1 text-xs text-foreground disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} className="rounded-lg border border-border px-2 py-1 text-xs text-foreground disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => remove(index)} className="rounded-lg border border-border px-2 py-1 text-xs text-red-600">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={inputCls}
        placeholder="Search courses, videos, articles, guides, ebooks..."
      />
      <div className="mt-3">
        <PillTabs tabs={[...KIND_TABS]} active={kindFilter} onChange={setKindFilter} />
      </div>

      <div className="mt-3 grid gap-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Searching…</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matching content found.</p>
        ) : (
          results.map((item) => {
            const selected = isSelected(item);
            return (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                onClick={() => add(item)}
                disabled={selected}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left ${
                  selected ? "cursor-default border-primary/40 bg-primary/5" : "border-border bg-card hover:bg-muted"
                }`}
              >
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnailUrl} alt="" className="h-8 w-8 flex-shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <KindIcon kind={item.kind} />
                  </span>
                )}
                <span className="flex-1 truncate text-sm font-medium text-foreground">{item.title}</span>
                <span className="text-xs capitalize text-muted-foreground">{item.type === "course" ? "Course" : item.kind}</span>
                {selected && <span className="text-xs font-semibold text-primary">Selected</span>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// Writes the career_path_course_map / career_path_resource_map rows, same
// delete-then-insert shape as saveToolMap - position comes from each item's
// index in the single combined array, so a later cross-table sort by
// position reconstructs this exact order.
export async function saveLearningMap(careerPathId: string, items: LearningItem[]) {
  const { error: deleteCourseErr } = await supabase.from("career_path_course_map").delete().eq("career_path_id", careerPathId);
  if (deleteCourseErr) throw new Error(`Could not save learning content: ${deleteCourseErr.message}`);
  const { error: deleteResourceErr } = await supabase.from("career_path_resource_map").delete().eq("career_path_id", careerPathId);
  if (deleteResourceErr) throw new Error(`Could not save learning content: ${deleteResourceErr.message}`);

  const courseRows = items
    .map((item, position) => ({ item, position }))
    .filter(({ item }) => item.type === "course")
    .map(({ item, position }) => ({ career_path_id: careerPathId, course_id: item.id, position }));

  const resourceRows = items
    .map((item, position) => ({ item, position }))
    .filter(({ item }) => item.type === "resource")
    .map(({ item, position }) => ({ career_path_id: careerPathId, resource_id: item.id, position }));

  if (courseRows.length) {
    const { error } = await supabase.from("career_path_course_map").insert(courseRows);
    if (error) throw new Error(`Could not save learning content: ${error.message}`);
  }
  if (resourceRows.length) {
    const { error } = await supabase.from("career_path_resource_map").insert(resourceRows);
    if (error) throw new Error(`Could not save learning content: ${error.message}`);
  }
}
