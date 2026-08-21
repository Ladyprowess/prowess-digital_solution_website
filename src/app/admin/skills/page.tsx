"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { AdminPagination } from "@/components/admin/AdminPagination";

const PAGE_SIZE = 30;

type Skill = {
  id: string; slug: string; name: string; description: string | null;
  about: string | null; featured: boolean; status: "draft" | "published";
};

// Every table a skill can be tagged onto - the item-id column differs per
// table (job_id, resource_id, ...) but the shape is otherwise identical, so
// usage counting and merging both loop over this one list instead of
// repeating six near-identical blocks.
const SKILL_MAP_TABLES = [
  { table: "job_skill_map", idColumn: "job_id", label: "Jobs" },
  { table: "opportunity_skill_map", idColumn: "opportunity_id", label: "Opportunities" },
  { table: "career_path_skill_map", idColumn: "career_path_id", label: "Career Paths" },
  { table: "course_skill_map", idColumn: "course_id", label: "Courses" },
  { table: "resource_skill_map", idColumn: "resource_id", label: "Resources" },
  { table: "event_skill_map", idColumn: "event_id", label: "Events" },
] as const;

const RESOURCE_KIND_LABELS: Record<string, string> = {
  video: "Videos", ebook: "Ebooks", article: "Articles", guide: "Guides",
};

type UsageBySkill = Record<string, Partial<Record<(typeof SKILL_MAP_TABLES)[number]["table"], number>>>;
type ResourceKindUsage = Record<string, Record<string, number>>; // skillId -> resource_type -> count

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function SkillsAdmin() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [usage, setUsage] = useState<UsageBySkill>({});
  const [resourceKindUsage, setResourceKindUsage] = useState<ResourceKindUsage>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [merging, setMerging] = useState(false);

  const [name, setName] = useState("");
  const [manualSlug, setManualSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: skillRows }, ...mapResults] = await Promise.all([
      supabase.from("skills").select("id, slug, name, description, about, featured, status").order("name"),
      ...SKILL_MAP_TABLES.map((m) =>
        m.table === "resource_skill_map"
          ? supabase.from(m.table).select("skill_id, resources(resource_type)")
          : supabase.from(m.table).select("skill_id")
      ),
    ]);

    const usageMap: UsageBySkill = {};
    const resourceKindMap: ResourceKindUsage = {};
    SKILL_MAP_TABLES.forEach((m, i) => {
      if (m.table === "resource_skill_map") {
        const rows = (mapResults[i].data as { skill_id: string; resources: { resource_type: string | null } | null }[] | null) || [];
        for (const row of rows) {
          usageMap[row.skill_id] = usageMap[row.skill_id] || {};
          usageMap[row.skill_id][m.table] = (usageMap[row.skill_id][m.table] || 0) + 1;
          const kind = row.resources?.resource_type || "other";
          resourceKindMap[row.skill_id] = resourceKindMap[row.skill_id] || {};
          resourceKindMap[row.skill_id][kind] = (resourceKindMap[row.skill_id][kind] || 0) + 1;
        }
        return;
      }
      const rows = (mapResults[i].data as { skill_id: string }[] | null) || [];
      for (const row of rows) {
        usageMap[row.skill_id] = usageMap[row.skill_id] || {};
        usageMap[row.skill_id][m.table] = (usageMap[row.skill_id][m.table] || 0) + 1;
      }
    });

    setSkills(skillRows || []);
    setUsage(usageMap);
    setResourceKindUsage(resourceKindMap);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function totalUsage(skillId: string): number {
    const rec = usage[skillId] || {};
    return Object.values(rec).reduce((sum, n) => sum + (n || 0), 0);
  }

  function learningCount(skillId: string): number {
    const rec = usage[skillId] || {};
    return (rec.course_skill_map || 0) + (rec.resource_skill_map || 0);
  }

  function learningBreakdown(skillId: string): string {
    const rec = usage[skillId] || {};
    const parts: string[] = [];
    if (rec.course_skill_map) parts.push(`Courses ${rec.course_skill_map}`);
    const kinds = resourceKindUsage[skillId] || {};
    for (const [kind, count] of Object.entries(kinds)) {
      parts.push(`${RESOURCE_KIND_LABELS[kind] || "Other"} ${count}`);
    }
    return parts.join(" · ");
  }

  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return skills;
    return skills.filter((s) => s.name.toLowerCase().includes(q) || s.slug.includes(q));
  }, [skills, search]);

  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return filtered.slice(from, from + PAGE_SIZE);
  }, [filtered, page]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (!next.includes(mergeTargetId)) setMergeTargetId(next[0] || "");
      return next;
    });
  }

  async function getUniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 1;
    while (true) {
      const { data } = await supabase.from("skills").select("id").eq("slug", candidate).maybeSingle();
      if (!data) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }

  function resetForm() {
    setEditingId(null);
    setName(""); setManualSlug(""); setOriginalSlug(""); setDescription(""); setAbout("");
    setFeatured(false); setStatus("published");
    setMsg(""); setErr("");
  }

  function startEdit(s: Skill) {
    setEditingId(s.id);
    setName(s.name);
    setManualSlug(s.slug);
    setOriginalSlug(s.slug);
    setDescription(s.description || "");
    setAbout(s.about || "");
    setFeatured(s.featured);
    setStatus(s.status);
    setMsg(""); setErr("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setErr(""); setMsg("");
    if (!name.trim()) return setErr("Name is required.");

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        about: about.trim() || null,
        featured,
        status,
      };

      if (editingId) {
        // The slug can only move while the skill is still a draft - once
        // published, changing it would break every job/opportunity/course/
        // resource page that already links to /skills/<slug>. The Merge
        // tool below is the intended way to fix a wrong slug on an
        // already-published skill (create the correct one, merge the old
        // one into it).
        const wantsSlugChange = status === "draft" && manualSlug.trim() && slugify(manualSlug) !== originalSlug;
        const slugUpdate = wantsSlugChange ? { slug: await getUniqueSlug(slugify(manualSlug)) } : {};
        const { error } = await supabase.from("skills").update({ ...payload, ...slugUpdate }).eq("id", editingId);
        if (error) throw new Error(error.message);
        setMsg("Skill updated.");
      } else {
        const slug = await getUniqueSlug(slugify(manualSlug.trim() || name));
        const { error } = await supabase.from("skills").insert({ ...payload, slug });
        if (error) throw new Error(error.message);
        setMsg("Skill created.");
      }

      resetForm();
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSkill(id: string, name: string) {
    if (totalUsage(id) > 0) return;
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    const { error } = await supabase.from("skills").delete().eq("id", id);
    if (error) { setErr(error.message); return; }
    setSkills((prev) => prev.filter((s) => s.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setMsg("Skill deleted.");
  }

  async function mergeSelected() {
    if (selectedIds.length < 2 || !mergeTargetId) return;
    const duplicateIds = selectedIds.filter((id) => id !== mergeTargetId);
    if (duplicateIds.length === 0) return;

    setMerging(true);
    setErr(""); setMsg("");
    try {
      for (const duplicateId of duplicateIds) {
        for (const m of SKILL_MAP_TABLES) {
          const [{ data: dupRows }, { data: keepRows }] = await Promise.all([
            supabase.from(m.table).select(m.idColumn).eq("skill_id", duplicateId),
            supabase.from(m.table).select(m.idColumn).eq("skill_id", mergeTargetId),
          ]);

          const rowItemId = (r: Record<string, unknown>) => String(r[m.idColumn]);
          const keepItemIds = new Set(((keepRows as Record<string, unknown>[]) || []).map(rowItemId));
          const toInsert = ((dupRows as Record<string, unknown>[]) || [])
            .map(rowItemId)
            .filter((itemId) => !keepItemIds.has(itemId))
            .map((itemId) => ({ [m.idColumn]: itemId, skill_id: mergeTargetId }));

          if (toInsert.length > 0) {
            const { error: insertError } = await supabase.from(m.table).insert(toInsert);
            if (insertError) throw new Error(`${m.label}: ${insertError.message}`);
          }

          const { error: deleteMapError } = await supabase.from(m.table).delete().eq("skill_id", duplicateId);
          if (deleteMapError) throw new Error(`${m.label}: ${deleteMapError.message}`);
        }

        const { error: deleteSkillError } = await supabase.from("skills").delete().eq("id", duplicateId);
        if (deleteSkillError) throw new Error(deleteSkillError.message);
      }

      setMsg(`Merged ${duplicateIds.length} skill${duplicateIds.length === 1 ? "" : "s"} into the one you kept.`);
      setSelectedIds([]);
      setMergeTargetId("");
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Merge failed partway through - reload and check for duplicate tags before trying again.");
    } finally {
      setMerging(false);
    }
  }

  async function toggleFeatured(s: Skill) {
    const next = !s.featured;
    setSkills((prev) => prev.map((row) => (row.id === s.id ? { ...row, featured: next } : row)));
    await supabase.from("skills").update({ featured: next }).eq("id", s.id);
  }

  async function setSkillStatus(id: string, nextStatus: Skill["status"]) {
    setSkills((prev) => prev.map((row) => (row.id === id ? { ...row, status: nextStatus } : row)));
    await supabase.from("skills").update({ status: nextStatus }).eq("id", id);
  }

  const selectedSkills = skills.filter((s) => selectedIds.includes(s.id));

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Skills</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The shared tags that connect jobs, opportunities, courses, resources, career paths and events to each other.
      </p>

      <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-border bg-card p-8">
        <h2 className="text-xl font-semibold text-foreground">{editingId ? "Edit Skill" : "Create Skill"}</h2>
        <div className="mt-6 grid gap-4">
          <Field label="Skill name *">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Digital Marketing" />
          </Field>
          <Field label={status !== "draft" && editingId ? "URL slug (frozen once published)" : "URL slug"}>
            <input
              value={manualSlug}
              onChange={(e) => setManualSlug(e.target.value)}
              disabled={Boolean(editingId) && status !== "draft"}
              className={`${inputCls} disabled:cursor-not-allowed disabled:opacity-60`}
              placeholder="Leave blank to auto-generate from the name"
            />
          </Field>
          <Field label="Short description (used on cards)">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputCls}
              placeholder="e.g. Security, networks, systems and digital protection."
            />
          </Field>
          <Field label="About this skill">
            <RichTextEditor key={`about-${editingId || "new"}`} value={about} onChange={setAbout} placeholder="What is this skill? What does someone with it actually do? Where is it used?" />
          </Field>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              Featured
            </label>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={inputCls}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </Field>
          </div>

          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          {msg ? <p className="text-sm text-green-700">{msg}</p> : null}

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90"
            >
              {saving ? "Saving..." : editingId ? "Update skill" : "Create skill"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="flex-shrink-0 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-foreground">All Skills</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills..."
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
          />
        </div>

        {selectedIds.length >= 2 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <span className="text-sm font-semibold text-foreground">Merge {selectedIds.length} skills into:</span>
            <select
              value={mergeTargetId}
              onChange={(e) => setMergeTargetId(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              {selectedSkills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button
              type="button"
              onClick={mergeSelected}
              disabled={merging}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90"
            >
              {merging ? "Merging..." : "Merge"}
            </button>
            <button
              type="button"
              onClick={() => { setSelectedIds([]); setMergeTargetId(""); }}
              className="text-xs font-semibold text-muted-foreground hover:underline"
            >
              Cancel
            </button>
            <p className="w-full text-xs text-muted-foreground">
              Everything tagged with the other {selectedIds.length - 1} will be re-tagged to &quot;{selectedSkills.find((s) => s.id === mergeTargetId)?.name}&quot;, then the duplicates are deleted.
            </p>
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">{skills.length === 0 ? "No skills yet - create one above, or they'll appear automatically as they're tagged elsewhere." : "No skills match your search."}</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3"></th>
                  <th className="py-2 pr-4">Skill</th>
                  <th className="py-2 pr-4">Learning</th>
                  <th className="py-2 pr-4">Jobs</th>
                  <th className="py-2 pr-4">Opportunities</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Featured</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((s) => {
                  const rec = usage[s.id] || {};
                  const total = totalUsage(s.id);
                  const breakdown = learningBreakdown(s.id);
                  const otherUsage = [
                    rec.career_path_skill_map ? `Career Paths ${rec.career_path_skill_map}` : null,
                    rec.event_skill_map ? `Events ${rec.event_skill_map}` : null,
                  ].filter(Boolean).join(" · ");
                  return (
                    <tr key={s.id} className="border-b border-border/60 align-top">
                      <td className="py-3 pr-3">
                        <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelected(s.id)} />
                      </td>
                      <td className="py-3 pr-4">
                        <button onClick={() => startEdit(s)} className="text-left hover:underline" title="Click to edit">
                          <span className="font-medium text-foreground">{s.name}</span>
                          {s.description && <span className="block text-xs text-muted-foreground">{s.description}</span>}
                          {otherUsage && <span className="block text-[11px] text-muted-foreground">{otherUsage}</span>}
                        </button>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        <span className="font-medium text-foreground">{learningCount(s.id)}</span>
                        {breakdown && <span className="block text-[11px] text-muted-foreground">{breakdown}</span>}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{rec.job_skill_map || 0}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{rec.opportunity_skill_map || 0}</td>
                      <td className="py-3 pr-4">
                        <select
                          value={s.status}
                          onChange={(e) => setSkillStatus(s.id, e.target.value as Skill["status"])}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </td>
                      <td className="py-3 pr-4">
                        <input type="checkbox" checked={s.featured} onChange={() => toggleFeatured(s)} />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => startEdit(s)} className="text-xs font-semibold text-primary hover:underline">Edit</button>
                          <button
                            onClick={() => deleteSkill(s.id, s.name)}
                            disabled={total > 0}
                            title={total > 0 ? "In use - merge or remove tags before deleting" : "Delete"}
                            className="text-xs font-semibold text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-center text-xs text-muted-foreground">{filtered.length} skill{filtered.length === 1 ? "" : "s"}{search.trim() ? " match" : " total"}</p>
        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default function AdminSkillsPage() {
  return <SkillsAdmin />;
}
