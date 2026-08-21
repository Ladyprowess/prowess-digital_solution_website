"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AdminPagination } from "@/components/admin/AdminPagination";

const PAGE_SIZE = 30;

type Skill = { id: string; slug: string; name: string; description: string | null };

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

type UsageBySkill = Record<string, Partial<Record<(typeof SKILL_MAP_TABLES)[number]["table"], number>>>;

function SkillsAdmin() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [usage, setUsage] = useState<UsageBySkill>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [merging, setMerging] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: skillRows }, ...mapResults] = await Promise.all([
      supabase.from("skills").select("id, slug, name, description").order("name"),
      ...SKILL_MAP_TABLES.map((m) => supabase.from(m.table).select("skill_id")),
    ]);

    const usageMap: UsageBySkill = {};
    SKILL_MAP_TABLES.forEach((m, i) => {
      const rows = (mapResults[i].data as { skill_id: string }[] | null) || [];
      for (const row of rows) {
        usageMap[row.skill_id] = usageMap[row.skill_id] || {};
        usageMap[row.skill_id][m.table] = (usageMap[row.skill_id][m.table] || 0) + 1;
      }
    });

    setSkills(skillRows || []);
    setUsage(usageMap);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function totalUsage(skillId: string): number {
    const rec = usage[skillId] || {};
    return Object.values(rec).reduce((sum, n) => sum + (n || 0), 0);
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

  function startEdit(s: Skill) {
    setEditingId(s.id);
    setEditingName(s.name);
    setEditingDescription(s.description || "");
    setMsg(""); setErr("");
  }

  async function saveEdit(id: string) {
    const name = editingName.trim();
    if (!name) return;
    const description = editingDescription.trim() || null;
    const { error } = await supabase.from("skills").update({ name, description }).eq("id", id);
    if (error) { setErr(error.message); return; }
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, name, description } : s)).sort((a, b) => a.name.localeCompare(b.name)));
    setEditingId(null);
    setMsg("Skill updated.");
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

  const selectedSkills = skills.filter((s) => selectedIds.includes(s.id));

  return (
    <div>
      <div>
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-8">
          <h1 className="text-3xl font-semibold text-foreground">Skills</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The shared tags that connect jobs, opportunities, courses, resources, career paths and events to each other. Rename to fix typos, merge duplicates (e.g. &quot;SEO&quot; and &quot;Search Engine Optimization&quot;), or delete anything unused.
          </p>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills..."
            className="mt-6 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
          />

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

          {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}
          {msg ? <p className="mt-4 text-sm text-green-700">{msg}</p> : null}

          {loading ? (
            <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">{skills.length === 0 ? "No skills yet - they get created from the Jobs, Opportunities, Career Paths, Courses and Resources admin forms." : "No skills match your search."}</p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3"></th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Used in</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((s) => {
                    const rec = usage[s.id] || {};
                    const total = totalUsage(s.id);
                    const breakdown = SKILL_MAP_TABLES.filter((m) => rec[m.table]).map((m) => `${m.label} ${rec[m.table]}`).join(" · ");
                    return (
                      <tr key={s.id} className="border-b border-border/60">
                        <td className="py-2 pr-3">
                          <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelected(s.id)} />
                        </td>
                        <td className="py-2 pr-4">
                          {editingId === s.id ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }}
                                  autoFocus
                                  className="rounded-lg border border-border bg-card px-2 py-1 text-sm"
                                />
                                <button onClick={() => saveEdit(s.id)} className="text-xs font-semibold text-primary hover:underline">Save</button>
                                <button onClick={() => setEditingId(null)} className="text-xs font-semibold text-muted-foreground hover:underline">Cancel</button>
                              </div>
                              <input
                                value={editingDescription}
                                onChange={(e) => setEditingDescription(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(s.id); if (e.key === "Escape") setEditingId(null); }}
                                placeholder="Short blurb for the Learn page (optional)"
                                className="w-full rounded-lg border border-border bg-card px-2 py-1 text-xs"
                              />
                            </div>
                          ) : (
                            <button onClick={() => startEdit(s)} className="text-left hover:underline" title="Click to edit">
                              <span className="font-medium text-foreground">{s.name}</span>
                              {s.description && <span className="block text-xs text-muted-foreground">{s.description}</span>}
                            </button>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-xs text-muted-foreground">{breakdown || "-"}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{total}</td>
                        <td className="py-2 pr-4">
                          <button
                            onClick={() => deleteSkill(s.id, s.name)}
                            disabled={total > 0}
                            title={total > 0 ? "In use - merge or remove tags before deleting" : "Delete"}
                            className="text-xs font-semibold text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                          >
                            Delete
                          </button>
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
    </div>
  );
}

export default function AdminSkillsPage() {
  return <SkillsAdmin />;
}
