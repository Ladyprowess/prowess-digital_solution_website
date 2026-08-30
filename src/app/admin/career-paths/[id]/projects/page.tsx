"use client";

import { use, useCallback, useEffect, useState } from "react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { saveSkillMap, type Skill } from "@/components/admin/SkillPicker";
import { PathSkillPicker } from "@/components/admin/PathSkillPicker";
import { supabase } from "@/lib/supabase";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

type Project = {
  id: string;
  position: number;
  title: string;
  level: (typeof LEVELS)[number] | null;
  description: string | null;
  external_link: string | null;
  status: "draft" | "published";
};

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

// "Build experience while you learn" -- practice projects. Skills are
// scoped to the path's own skill list by default (PathSkillPicker), same
// as Career Options - picking from a huge full taxonomy every time was the
// actual complaint. The picker's "Add more skills" escape hatch still
// covers the case where a project practices a skill the path doesn't list
// as core, by adding it to the path's list permanently rather than just
// this one project.
function ProjectsAdmin({ careerPathId }: { careerPathId: string }) {
  // The path's own skill list (career_path_skill_map) - what the picker
  // shows by default. Nothing here displays project skill names today
  // (unlike Career Options' role rows), so no separate name-lookup map is
  // needed - only the id lists below.
  const [pathSkills, setPathSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectSkillIds, setProjectSkillIds] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<"" | (typeof LEVELS)[number]>("");
  const [description, setDescription] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const fetchAll = useCallback(async () => {
    const [{ data: pathSkillRows }, { data: projectRows }] = await Promise.all([
      supabase.from("career_path_skill_map").select("skills(id, slug, name)").eq("career_path_id", careerPathId),
      supabase
        .from("career_path_projects")
        .select("id, position, title, level, description, external_link, status")
        .eq("career_path_id", careerPathId)
        .order("position"),
    ]);

    const pathSkillsList = ((pathSkillRows as unknown as { skills: Skill | null }[]) || [])
      .map((r) => r.skills)
      .filter((s): s is Skill => !!s)
      .sort((a, b) => a.name.localeCompare(b.name));

    const projectsList = (projectRows as Project[]) || [];
    const skillMap: Record<string, string[]> = {};
    if (projectsList.length > 0) {
      const { data: projectSkillRows } = await supabase
        .from("career_path_project_skill_map")
        .select("project_id, skill_id")
        .in("project_id", projectsList.map((p) => p.id));
      for (const row of projectSkillRows || []) {
        skillMap[row.project_id] = [...(skillMap[row.project_id] || []), row.skill_id];
      }
    }

    return { pathSkillsList, projectsList, skillMap };
  }, [careerPathId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { pathSkillsList, projectsList, skillMap } = await fetchAll();
      if (!cancelled) {
        setPathSkills(pathSkillsList);
        setProjects(projectsList);
        setProjectSkillIds(skillMap);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchAll]);

  async function reload() {
    const { pathSkillsList, projectsList, skillMap } = await fetchAll();
    setPathSkills(pathSkillsList);
    setProjects(projectsList);
    setProjectSkillIds(skillMap);
  }

  function resetForm() {
    setEditingId(null); setTitle(""); setLevel(""); setDescription("");
    setExternalLink(""); setStatus("published"); setSelectedSkillIds([]); setErr("");
  }

  function startEdit(project: Project) {
    setEditingId(project.id);
    setTitle(project.title);
    setLevel(project.level || "");
    setDescription(project.description || "");
    setExternalLink(project.external_link || "");
    setStatus(project.status);
    setSelectedSkillIds(projectSkillIds[project.id] || []);
    setErr("");
  }

  async function save() {
    setErr("");
    if (!title.trim()) return setErr("Title is required.");

    const payload = {
      title: title.trim(),
      level: level || null,
      description: description.trim() || null,
      external_link: externalLink.trim() || null,
      status,
    };

    let projectId = editingId;
    if (editingId) {
      const { error } = await supabase.from("career_path_projects").update(payload).eq("id", editingId);
      if (error) return setErr(error.message);
    } else {
      const { data: created, error } = await supabase
        .from("career_path_projects")
        .insert({ ...payload, career_path_id: careerPathId, position: projects.length })
        .select("id")
        .single();
      if (error || !created) return setErr(error?.message || "Could not save this project.");
      projectId = created.id;
    }

    await supabase.from("career_path_project_skill_map").delete().eq("project_id", projectId!);
    await saveSkillMap("career_path_project_skill_map", "project_id", projectId!, selectedSkillIds);

    resetForm();
    reload();
  }

  async function remove(id: string) {
    if (!confirm("Delete this project?")) return;
    await supabase.from("career_path_projects").delete().eq("id", id);
    if (editingId === id) resetForm();
    reload();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-foreground">Build experience</h2>
      <p className="mt-1 text-sm text-muted-foreground">Practice projects shown on the career path page, between Tools and the closing timeline.</p>

      {projects.length > 0 && (
        <ul className="mt-6 space-y-2">
          {projects.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm">
              <span className="text-foreground">
                {p.title}
                {p.level && <span className="ml-2 text-xs capitalize text-muted-foreground">({p.level})</span>}
                {p.status === "draft" && <span className="ml-2 text-xs text-muted-foreground">- draft</span>}
              </span>
              <span className="flex-shrink-0">
                <button onClick={() => startEdit(p)} className="mr-3 text-xs font-semibold text-primary hover:underline">Edit</button>
                <button onClick={() => remove(p.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground">{editingId ? "EDIT PROJECT" : "ADD PROJECT"}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Perform an SEO audit" />
          </Field>
          <Field label="Level">
            <select value={level} onChange={(e) => setLevel(e.target.value as typeof level)} className={inputCls}>
              <option value="">Not set</option>
              {LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Description">
          <RichTextEditor key={`project-${editingId || "new"}`} value={description} onChange={setDescription} placeholder="What does someone build, and what do they practice?" />
        </Field>
        <Field label="External link (optional)">
          <input value={externalLink} onChange={(e) => setExternalLink(e.target.value)} className={inputCls} placeholder="https://... (a brief, template, or example)" />
        </Field>
        <Field label="Skills practiced">
          <PathSkillPicker
            careerPathId={careerPathId}
            pathSkills={pathSkills}
            onPathSkillsChange={setPathSkills}
            selectedIds={selectedSkillIds}
            onSelectedIdsChange={setSelectedSkillIds}
          />
        </Field>
        <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
          <input type="checkbox" checked={status === "published"} onChange={(e) => setStatus(e.target.checked ? "published" : "draft")} />
          Published
        </label>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <div className="flex gap-2">
          <button type="button" onClick={save} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {editingId ? "Update project" : "Add project"}
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

export default function AdminCareerPathProjectsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProjectsAdmin careerPathId={id} />;
}
