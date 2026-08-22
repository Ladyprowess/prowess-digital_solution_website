"use client";

import { use, useCallback, useEffect, useState } from "react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { SkillPicker, saveSkillMap, type Skill } from "@/components/admin/SkillPicker";
import { supabase } from "@/lib/supabase";

type Role = { id: string; parent_role_id: string | null; position: number; title: string; description: string | null };

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function RoleRow({
  role,
  roleSkillNames,
  indent,
  showAddSubRole,
  onEdit,
  onDelete,
  onAddSubRole,
}: {
  role: Role;
  roleSkillNames: string[];
  indent: boolean;
  showAddSubRole: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddSubRole: () => void;
}) {
  return (
    <div className={`rounded-xl border border-border/60 px-4 py-3 ${indent ? "ml-6" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{role.title}</p>
          {roleSkillNames.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">{roleSkillNames.join(", ")}</p>
          )}
        </div>
        <span className="flex-shrink-0 text-xs">
          {showAddSubRole && (
            <button onClick={onAddSubRole} className="mr-3 font-semibold text-primary hover:underline">+ Add sub-role</button>
          )}
          <button onClick={onEdit} className="mr-3 font-semibold text-primary hover:underline">Edit</button>
          <button onClick={onDelete} className="font-semibold text-red-600 hover:underline">Delete</button>
        </span>
      </div>
    </div>
  );
}

function RolesAdmin({ careerPathId }: { careerPathId: string }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleSkillIds, setRoleSkillIds] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentRoleId, setParentRoleId] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const fetchAll = useCallback(async () => {
    const [{ data: skillRows }, { data: roleRows }] = await Promise.all([
      supabase.from("skills").select("id, slug, name").order("name"),
      supabase
        .from("career_path_roles")
        .select("id, parent_role_id, position, title, description")
        .eq("career_path_id", careerPathId)
        .order("position"),
    ]);

    const rolesList = roleRows || [];
    const roleSkillMap: Record<string, string[]> = {};
    if (rolesList.length > 0) {
      const { data: roleSkillRows } = await supabase
        .from("career_path_role_skill_map")
        .select("role_id, skill_id")
        .in("role_id", rolesList.map((r) => r.id));
      for (const row of roleSkillRows || []) {
        roleSkillMap[row.role_id] = [...(roleSkillMap[row.role_id] || []), row.skill_id];
      }
    }

    return { skillsList: skillRows || [], rolesList, roleSkillMap };
  }, [careerPathId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { skillsList, rolesList, roleSkillMap } = await fetchAll();
      if (!cancelled) {
        setSkills(skillsList);
        setRoles(rolesList);
        setRoleSkillIds(roleSkillMap);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchAll]);

  async function reload() {
    const { skillsList, rolesList, roleSkillMap } = await fetchAll();
    setSkills(skillsList);
    setRoles(rolesList);
    setRoleSkillIds(roleSkillMap);
  }

  function skillNames(ids: string[]) {
    return ids.map((id) => skills.find((s) => s.id === id)?.name).filter((n): n is string => !!n);
  }

  function resetForm() {
    setEditingId(null); setParentRoleId(null); setTitle(""); setDescription(""); setSelectedSkillIds([]); setErr("");
  }

  function startEdit(role: Role) {
    setEditingId(role.id);
    setParentRoleId(role.parent_role_id);
    setTitle(role.title);
    setDescription(role.description || "");
    setSelectedSkillIds(roleSkillIds[role.id] || []);
    setErr("");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function startAddSubRole(parent: Role) {
    resetForm();
    setParentRoleId(parent.id);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  async function save() {
    setErr("");
    if (!title.trim()) return setErr("Title is required.");

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      parent_role_id: parentRoleId,
    };

    let roleId = editingId;
    if (editingId) {
      const { error } = await supabase.from("career_path_roles").update(payload).eq("id", editingId);
      if (error) return setErr(error.message);
    } else {
      const siblingCount = roles.filter((r) => r.parent_role_id === parentRoleId).length;
      const { data: created, error } = await supabase
        .from("career_path_roles")
        .insert({ ...payload, career_path_id: careerPathId, position: siblingCount })
        .select("id")
        .single();
      if (error || !created) return setErr(error?.message || "Could not save this role.");
      roleId = created.id;
    }

    await supabase.from("career_path_role_skill_map").delete().eq("role_id", roleId!);
    await saveSkillMap("career_path_role_skill_map", "role_id", roleId!, selectedSkillIds);

    resetForm();
    reload();
  }

  async function remove(id: string) {
    const hasSubRoles = roles.some((r) => r.parent_role_id === id);
    if (!confirm(hasSubRoles ? "Delete this role and its sub-roles?" : "Delete this role?")) return;
    await supabase.from("career_path_roles").delete().eq("id", id);
    if (editingId === id) resetForm();
    reload();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const tier1 = roles.filter((r) => !r.parent_role_id);
  const parent = parentRoleId ? roles.find((r) => r.id === parentRoleId) : null;

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-foreground">Career Options</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        The branching &quot;what can you become?&quot; diagram on the career path page. Add top-level roles, then branch each one into sub-roles (2 levels deep).
      </p>

      {tier1.length > 0 && (
        <div className="mt-6 space-y-3">
          {tier1.map((role) => (
            <div key={role.id} className="space-y-2">
              <RoleRow
                role={role}
                roleSkillNames={skillNames(roleSkillIds[role.id] || [])}
                indent={false}
                showAddSubRole
                onEdit={() => startEdit(role)}
                onDelete={() => remove(role.id)}
                onAddSubRole={() => startAddSubRole(role)}
              />
              {roles.filter((r) => r.parent_role_id === role.id).map((sub) => (
                <RoleRow
                  key={sub.id}
                  role={sub}
                  roleSkillNames={skillNames(roleSkillIds[sub.id] || [])}
                  indent
                  showAddSubRole={false}
                  onEdit={() => startEdit(sub)}
                  onDelete={() => remove(sub.id)}
                  onAddSubRole={() => {}}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground">
          {editingId ? "EDIT ROLE" : parent ? `ADD SUB-ROLE UNDER "${parent.title.toUpperCase()}"` : "ADD TOP-LEVEL ROLE"}
        </p>
        {parent && !editingId && (
          <button type="button" onClick={resetForm} className="w-fit text-xs font-semibold text-muted-foreground hover:underline">
            Cancel - add a top-level role instead
          </button>
        )}
        <Field label="Role title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. SEO Specialist" />
        </Field>
        <Field label="Description">
          <RichTextEditor key={`role-${editingId || parentRoleId || "new"}`} value={description} onChange={setDescription} placeholder="What does someone in this role actually do?" />
        </Field>
        <Field label="Skills">
          <SkillPicker skills={skills} onSkillsChange={setSkills} selectedIds={selectedSkillIds} onSelectedIdsChange={setSelectedSkillIds} />
        </Field>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <div className="flex gap-2">
          <button type="button" onClick={save} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {editingId ? "Update role" : "Add role"}
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

export default function AdminCareerPathRolesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RolesAdmin careerPathId={id} />;
}
