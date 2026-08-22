"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PickableTool = { id: string; title: string };

// Same toggle-pill pattern as SkillPicker, but against the already-existing
// `tools` table (career category only) rather than the skills taxonomy --
// no "add new" affordance, tools are managed in Admin > Tools, not created
// implicitly from here.
export function ToolPicker({
  selectedIds,
  onSelectedIdsChange,
}: {
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
}) {
  const [tools, setTools] = useState<PickableTool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("tools")
      .select("id, title")
      .eq("category", "career")
      .eq("status", "published")
      .order("position")
      .then(({ data }) => {
        setTools(data || []);
        setLoading(false);
      });
  }, []);

  function toggle(id: string) {
    onSelectedIdsChange(selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading tools…</p>;
  if (tools.length === 0) {
    return <p className="text-sm text-muted-foreground">No published career tools yet - add some in Admin &gt; Tools first.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tools.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => toggle(t.id)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
            selectedIds.includes(t.id)
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          {t.title}
        </button>
      ))}
    </div>
  );
}

// Writes the career_path_tool_map rows, same delete-then-insert shape as
// saveSkillMap in SkillPicker.tsx.
export async function saveToolMap(careerPathId: string, toolIds: string[]) {
  await supabase.from("career_path_tool_map").delete().eq("career_path_id", careerPathId);
  if (toolIds.length === 0) return;
  await supabase.from("career_path_tool_map").insert(toolIds.map((toolId) => ({ career_path_id: careerPathId, tool_id: toolId })));
}
