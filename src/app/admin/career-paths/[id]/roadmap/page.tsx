"use client";

import { use, useCallback, useEffect, useState } from "react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { supabase } from "@/lib/supabase";

type Skill = { id: string; slug: string; name: string };
type Stage = { id: string; position: number; title: string; description: string | null; items: string[] | null };

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

// Deliberately not the shared SkillPicker: a stage's skills must stay a
// subset of the parent career path's own skill list (set on the Career
// Path tab), so this only toggles among that list -- no "add a new skill"
// escape hatch that would silently break the constraint.
function StageSkillPicker({
  pathSkills,
  selectedIds,
  onChange,
}: {
  pathSkills: Skill[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  if (pathSkills.length === 0) {
    return <p className="text-sm text-muted-foreground">Add skills to this career path on the Career Path tab first.</p>;
  }
  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]);
  }
  return (
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
  );
}

function RoadmapAdmin({ careerPathId }: { careerPathId: string }) {
  const [pathSkills, setPathSkills] = useState<Skill[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [stageSkillIds, setStageSkillIds] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const fetchAll = useCallback(async () => {
    const [{ data: mapRows }, { data: stageRows }] = await Promise.all([
      supabase.from("career_path_skill_map").select("skills(id, slug, name)").eq("career_path_id", careerPathId),
      supabase
        .from("career_path_roadmap_stages")
        .select("id, position, title, description, items")
        .eq("career_path_id", careerPathId)
        .order("position"),
    ]);

    const skills = ((mapRows as unknown as { skills: Skill | null }[]) || [])
      .map((r) => r.skills)
      .filter((s): s is Skill => !!s);
    const stagesList = stageRows || [];

    const stageSkillMap: Record<string, string[]> = {};
    if (stagesList.length > 0) {
      const { data: stageSkillRows } = await supabase
        .from("career_path_roadmap_stage_skill_map")
        .select("stage_id, skill_id")
        .in("stage_id", stagesList.map((s) => s.id));
      for (const row of stageSkillRows || []) {
        stageSkillMap[row.stage_id] = [...(stageSkillMap[row.stage_id] || []), row.skill_id];
      }
    }

    return { skills, stagesList, stageSkillMap };
  }, [careerPathId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { skills, stagesList, stageSkillMap } = await fetchAll();
      if (!cancelled) {
        setPathSkills(skills);
        setStages(stagesList);
        setStageSkillIds(stageSkillMap);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchAll]);

  async function reload() {
    const { skills, stagesList, stageSkillMap } = await fetchAll();
    setPathSkills(skills);
    setStages(stagesList);
    setStageSkillIds(stageSkillMap);
  }

  function resetForm() {
    setEditingId(null); setTitle(""); setDescription(""); setItems(""); setSelectedSkillIds([]); setErr("");
  }

  function startEdit(stage: Stage) {
    setEditingId(stage.id);
    setTitle(stage.title);
    setDescription(stage.description || "");
    setItems((stage.items || []).join("\n"));
    setSelectedSkillIds(stageSkillIds[stage.id] || []);
    setErr("");
  }

  async function save() {
    setErr("");
    if (!title.trim()) return setErr("Title is required.");

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      items: items.trim() ? items.split("\n").map((l) => l.trim()).filter(Boolean) : null,
    };

    let stageId = editingId;
    if (editingId) {
      const { error } = await supabase.from("career_path_roadmap_stages").update(payload).eq("id", editingId);
      if (error) return setErr(error.message);
    } else {
      const { data: created, error } = await supabase
        .from("career_path_roadmap_stages")
        .insert({ ...payload, career_path_id: careerPathId, position: stages.length })
        .select("id")
        .single();
      if (error || !created) return setErr(error?.message || "Could not save this stage.");
      stageId = created.id;
    }

    await supabase.from("career_path_roadmap_stage_skill_map").delete().eq("stage_id", stageId!);
    if (selectedSkillIds.length > 0) {
      await supabase.from("career_path_roadmap_stage_skill_map").insert(selectedSkillIds.map((skill_id) => ({ stage_id: stageId!, skill_id })));
    }

    resetForm();
    reload();
  }

  async function remove(id: string) {
    if (!confirm("Delete this stage?")) return;
    await supabase.from("career_path_roadmap_stages").delete().eq("id", id);
    if (editingId === id) resetForm();
    reload();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-foreground">Career Roadmap</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Ordered stages shown as a visual progression on the career path page (e.g. Foundations, Core Skills, Practice, Portfolio, Job Ready). Each stage can list free-text items and/or real skills from this path.
      </p>

      {stages.length > 0 && (
        <ol className="mt-6 space-y-2">
          {stages.map((stage, i) => (
            <li key={stage.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm">
              <span className="text-foreground"><span className="text-muted-foreground">{i + 1}.</span> {stage.title}</span>
              <span className="flex-shrink-0">
                <button onClick={() => startEdit(stage)} className="mr-3 text-xs font-semibold text-primary hover:underline">Edit</button>
                <button onClick={() => remove(stage.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground">{editingId ? "EDIT STAGE" : "ADD STAGE"}</p>
        <Field label="Stage title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Foundations" />
        </Field>
        <Field label="Description">
          <RichTextEditor key={`stage-${editingId || "new"}`} value={description} onChange={setDescription} placeholder="What happens at this stage?" />
        </Field>
        <Field label="Free-text items (one per line, optional)">
          <textarea
            value={items}
            onChange={(e) => setItems(e.target.value)}
            className={`${inputCls} min-h-[90px]`}
            placeholder={"Campaign planning\nContent strategy\nAnalytics projects"}
          />
        </Field>
        <Field label="Skills for this stage (from this path's skill list)">
          <StageSkillPicker pathSkills={pathSkills} selectedIds={selectedSkillIds} onChange={setSelectedSkillIds} />
        </Field>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <div className="flex gap-2">
          <button type="button" onClick={save} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {editingId ? "Update stage" : "Add stage"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="flex-shrink-0 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCareerPathRoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RoadmapAdmin careerPathId={id} />;
}
