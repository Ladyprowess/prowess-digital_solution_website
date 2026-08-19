"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";

export type Skill = { id: string; slug: string; name: string };

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

// Shared by every admin form that tags content with the shared skills
// taxonomy (jobs, opportunities, resources, courses, career paths) so the
// "type a new skill or pick an existing one" behavior is identical
// everywhere instead of copy-pasted per page.
export function SkillPicker({
  skills,
  onSkillsChange,
  selectedIds,
  onSelectedIdsChange,
}: {
  skills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
}) {
  const [newSkillName, setNewSkillName] = useState("");
  const [err, setErr] = useState("");

  async function addSkill() {
    const name = newSkillName.trim();
    if (!name) return;
    setErr("");
    const slug = slugify(name);
    const { data: existing } = await supabase.from("skills").select("id, slug, name").eq("slug", slug).maybeSingle();
    if (existing) {
      onSelectedIdsChange(selectedIds.includes(existing.id) ? selectedIds : [...selectedIds, existing.id]);
      setNewSkillName("");
      return;
    }
    const { data: created, error } = await supabase.from("skills").insert({ slug, name }).select("id, slug, name").single();
    if (error || !created) {
      setErr(error?.message || "Could not add the skill.");
      return;
    }
    onSkillsChange([...skills, created].sort((a, b) => a.name.localeCompare(b.name)));
    onSelectedIdsChange([...selectedIds, created.id]);
    setNewSkillName("");
  }

  function toggle(id: string) {
    onSelectedIdsChange(selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => toggle(s.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              selectedIds.includes(s.id)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
          className={inputCls}
          placeholder="Add a new skill and press Enter"
        />
        <button type="button" onClick={addSkill} className="flex-shrink-0 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted">
          Add
        </button>
      </div>
      {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
    </div>
  );
}

// Writes the many-to-many rows for whichever skill_map table applies. Used
// right after a content row's own insert() succeeds.
export async function saveSkillMap(table: string, idColumn: string, itemId: string, skillIds: string[]) {
  if (skillIds.length === 0) return;
  await supabase.from(table).insert(skillIds.map((skillId) => ({ [idColumn]: itemId, skill_id: skillId })));
}
