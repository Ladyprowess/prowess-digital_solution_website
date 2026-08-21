"use client";

import { use, useCallback, useEffect, useState } from "react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { supabase } from "@/lib/supabase";

type Responsibility = { id: string; position: number; title: string; body: string | null };

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

// "What you'll do" -- rendered as an accordion on the public detail page.
// Same add/edit/delete-inline pattern as course_modules/course_lessons in
// /admin/learn/[id], the closest precedent for an ordered child list.
function ResponsibilitiesAdmin({ careerPathId }: { careerPathId: string }) {
  const [items, setItems] = useState<Responsibility[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("career_path_responsibilities")
      .select("id, position, title, body")
      .eq("career_path_id", careerPathId)
      .order("position");
    return data || [];
  }, [careerPathId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rows = await fetchItems();
      if (!cancelled) { setItems(rows); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [fetchItems]);

  async function load() {
    setItems(await fetchItems());
  }

  function resetForm() {
    setEditingId(null); setTitle(""); setBody(""); setErr("");
  }

  function startEdit(item: Responsibility) {
    setEditingId(item.id); setTitle(item.title); setBody(item.body || ""); setErr("");
  }

  async function save() {
    setErr("");
    if (!title.trim()) return setErr("Title is required.");
    const payload = { title: title.trim(), body: body.trim() || null };
    const { error } = editingId
      ? await supabase.from("career_path_responsibilities").update(payload).eq("id", editingId)
      : await supabase.from("career_path_responsibilities").insert({ ...payload, career_path_id: careerPathId, position: items.length });
    if (error) return setErr(error.message);
    resetForm();
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this item?")) return;
    await supabase.from("career_path_responsibilities").delete().eq("id", id);
    if (editingId === id) resetForm();
    load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-foreground">What you&apos;ll do</h2>
      <p className="mt-1 text-sm text-muted-foreground">Shows as an expandable accordion on the career path page. Each item&apos;s body is the short explanation shown when expanded.</p>

      {items.length > 0 && (
        <ul className="mt-6 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm">
              <span className="text-foreground">{item.title}</span>
              <span className="flex-shrink-0">
                <button onClick={() => startEdit(item)} className="mr-3 text-xs font-semibold text-primary hover:underline">Edit</button>
                <button onClick={() => remove(item.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground">{editingId ? "EDIT ITEM" : "ADD ITEM"}</p>
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Plan campaigns" />
        </Field>
        <Field label="Explanation">
          <RichTextEditor key={`resp-${editingId || "new"}`} value={body} onChange={setBody} placeholder="A short explanation shown when this item is expanded." />
        </Field>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <div className="flex gap-2">
          <button type="button" onClick={save} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {editingId ? "Update item" : "Add item"}
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

export default function AdminCareerPathResponsibilitiesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ResponsibilitiesAdmin careerPathId={id} />;
}
