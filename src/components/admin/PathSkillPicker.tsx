"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";
import type { Skill } from "@/components/admin/SkillPicker";

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

// Scoped-by-default skill picker for anything that must draw its skills
// from one specific career path (Career Options, Projects) - shows only
// the path's already-selected skills as toggle pills (same idea as
// Roadmap's StageSkillPicker), instead of every skill in the whole
// taxonomy. Unlike Roadmap, this has an escape hatch: "Add more skills"
// reveals the rest of the taxonomy (plus a "type a new one" input), and
// picking one there both adds it to *this* item and permanently adds it to
// the career path's own skill list via career_path_skill_map - so the
// "must stay a subset of the path's skills" invariant holds everywhere,
// not just here.
export function PathSkillPicker({
  careerPathId,
  pathSkills,
  onPathSkillsChange,
  selectedIds,
  onSelectedIdsChange,
}: {
  careerPathId: string;
  pathSkills: Skill[];
  onPathSkillsChange: (skills: Skill[]) => void;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
}) {
  const [showAddMore, setShowAddMore] = useState(false);
  const [allSkills, setAllSkills] = useState<Skill[] | null>(null);
  const [newSkillName, setNewSkillName] = useState("");
  const [err, setErr] = useState("");
  // Guards against a fast double-click firing two inserts for the same
  // skill before the first one's state update removes it from the list -
  // without this, both clicks read the same pre-update `pathSkills` closure
  // and both append the skill locally, producing a visual duplicate pill.
  const [addingId, setAddingId] = useState<string | null>(null);

  function toggle(id: string) {
    onSelectedIdsChange(selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]);
  }

  async function openAddMore() {
    setShowAddMore((v) => !v);
    if (!allSkills) {
      const { data } = await supabase.from("skills").select("id, slug, name").order("name");
      setAllSkills(data || []);
    }
  }

  async function addExistingSkillToPath(skill: Skill) {
    if (addingId === skill.id) return;
    setAddingId(skill.id);
    try {
      await supabase.from("career_path_skill_map").insert({ career_path_id: careerPathId, skill_id: skill.id });
      onPathSkillsChange([...pathSkills, skill].sort((a, b) => a.name.localeCompare(b.name)));
      onSelectedIdsChange([...selectedIds, skill.id]);
    } finally {
      setAddingId(null);
    }
  }

  async function addNewSkill() {
    const name = newSkillName.trim();
    if (!name) return;
    setErr("");
    const slug = slugify(name);
    const { data: existing } = await supabase.from("skills").select("id, slug, name").eq("slug", slug).maybeSingle();
    if (existing) {
      await addExistingSkillToPath(existing);
      setNewSkillName("");
      return;
    }
    const { data: created, error } = await supabase.from("skills").insert({ slug, name }).select("id, slug, name").single();
    if (error || !created) { setErr(error?.message || "Could not add the skill."); return; }
    setAllSkills((prev) => (prev ? [...prev, created].sort((a, b) => a.name.localeCompare(b.name)) : prev));
    await addExistingSkillToPath(created);
    setNewSkillName("");
  }

  return (
    <div>
      {pathSkills.length === 0 ? (
        <p className="text-sm text-muted-foreground">This career path has no skills yet - add some on the Career Path tab, or use &quot;Add more skills&quot; below.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {pathSkills.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                selectedIds.includes(s.id) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <button type="button" onClick={openAddMore} className="mt-3 text-xs font-semibold text-primary hover:underline">
        {showAddMore ? "Hide" : "+ Add more skills"}
      </button>

      {showAddMore && (
        <div className="mt-3 rounded-xl border border-border/60 p-3">
          <p className="mb-2 text-xs text-muted-foreground">Adding a skill here also adds it to this career path&apos;s own skill list.</p>

          {!allSkills ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allSkills
                .filter((s) => !pathSkills.some((ps) => ps.id === s.id))
                .map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addExistingSkillToPath(s)}
                    disabled={addingId === s.id}
                    className="rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    + {s.name}
                  </button>
                ))}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <input
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNewSkill(); } }}
              className={inputCls}
              placeholder="Or type a brand new skill and press Enter"
            />
            <button type="button" onClick={addNewSkill} className="flex-shrink-0 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted">
              Add
            </button>
          </div>
          {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
        </div>
      )}
    </div>
  );
}
