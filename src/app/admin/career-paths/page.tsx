"use client";

import { useCallback, useEffect, useState } from "react";
import { AccessPriceFields } from "@/components/admin/AccessPriceFields";
import { SkillPicker, saveSkillMap, type Skill } from "@/components/admin/SkillPicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";

type CareerPathRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  access: "free" | "premium";
  price: number | null;
  status: "draft" | "published";
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function CareerPathsAdmin() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [paths, setPaths] = useState<CareerPathRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [access, setAccess] = useState<"free" | "premium">("free");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [publishNow, setPublishNow] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [editingPathId, setEditingPathId] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const loadAll = useCallback(async () => {
    setLoadingList(true);
    const [{ data: skillRows }, { data: pathRows }] = await Promise.all([
      supabase.from("skills").select("id, slug, name").order("name"),
      supabase
        .from("career_paths")
        .select("id, slug, title, description, access, price, status")
        .order("created_at", { ascending: false }),
    ]);
    setSkills(skillRows || []);
    setPaths(pathRows || []);
    setLoadingList(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function getUniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 1;
    while (true) {
      const { data } = await supabase.from("career_paths").select("id").eq("slug", candidate).maybeSingle();
      if (!data) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }

  const resetForm = () => {
    setEditingPathId(null);
    setTitle(""); setDescription(""); setSelectedSkillIds([]);
    setAccess("free"); setPrice(""); setPublishNow(false);
  };

  async function startEditPath(id: string) {
    setErr(""); setMsg("");
    setLoadingEdit(true);
    const { data, error } = await supabase
      .from("career_paths")
      .select("id, title, description, access, price, price_currency, status, career_path_skill_map(skill_id)")
      .eq("id", id)
      .single();
    setLoadingEdit(false);
    if (error || !data) { setErr(error?.message || "Could not load this career path."); return; }

    const path = data as unknown as {
      id: string; title: string; description: string | null; access: "free" | "premium";
      price: number | null; price_currency: string | null; status: CareerPathRow["status"];
      career_path_skill_map: { skill_id: string }[];
    };

    setEditingPathId(path.id);
    setTitle(path.title);
    setDescription(path.description || "");
    setAccess(path.access);
    setPrice(path.price?.toString() || "");
    setCurrency(path.price_currency || "NGN");
    setPublishNow(path.status === "published");
    setSelectedSkillIds(path.career_path_skill_map.map((m) => m.skill_id));

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const submit = async () => {
    setErr(""); setMsg("");
    if (!title.trim()) return setErr("Title is required.");

    setSaving(true);
    try {
      const basePayload = {
        title: title.trim(),
        description: description.trim() || null,
        access,
        price: access === "premium" && price ? Number(price) : null,
        price_currency: access === "premium" && price ? currency : null,
        status: publishNow ? "published" as const : "draft" as const,
      };

      let pathId = editingPathId;

      if (editingPathId) {
        const { error } = await supabase.from("career_paths").update(basePayload).eq("id", editingPathId);
        if (error) throw new Error(error.message);
        await supabase.from("career_path_skill_map").delete().eq("career_path_id", editingPathId);
      } else {
        const slug = await getUniqueSlug(slugify(title));
        const { data: created, error } = await supabase
          .from("career_paths")
          .insert({ ...basePayload, slug })
          .select("id")
          .single();
        if (error || !created) throw new Error(error?.message || "Could not save the career path.");
        pathId = created.id;
      }

      await saveSkillMap("career_path_skill_map", "career_path_id", pathId!, selectedSkillIds);

      setMsg(editingPathId ? "Career path updated." : "Career path saved.");
      resetForm();
      loadAll();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  async function setPathStatus(id: string, status: CareerPathRow["status"]) {
    await supabase.from("career_paths").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setPaths((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  async function deletePath(id: string) {
    if (!confirm("Delete this career path? This can't be undone.")) return;
    await supabase.from("career_paths").delete().eq("id", id);
    setPaths((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div>
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h1 className="text-3xl font-semibold text-foreground">{editingPathId ? "Edit Career Path" : "Add Career Path"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {editingPathId ? "Update this career path." : "e.g. Digital Marketing, Cybersecurity. Tag it with the skills it needs so jobs, resources and courses tagged with the same skills connect to it automatically."}
          </p>
          {loadingEdit && <p className="mt-2 text-sm text-muted-foreground">Loading career path…</p>}

          <div className="mt-8 grid gap-4">
            <Field label="Title *">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Cybersecurity" />
            </Field>
            <Field label="Description">
              <RichTextEditor key={`desc-${editingPathId || "new"}`} value={description} onChange={setDescription} placeholder="What is this career? Who is it suitable for? What's the roadmap to get there?" />
            </Field>

            <Field label="Skills needed">
              <SkillPicker
                skills={skills} onSkillsChange={setSkills}
                selectedIds={selectedSkillIds} onSelectedIdsChange={setSelectedSkillIds}
              />
            </Field>

            <AccessPriceFields
              access={access} onAccessChange={setAccess}
              price={price} onPriceChange={setPrice}
              currency={currency} onCurrencyChange={setCurrency}
            />

            <label className="mt-2 flex items-center gap-3 text-sm font-semibold text-foreground">
              <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
              Publish immediately
            </label>

            {err ? <p className="text-sm text-red-600">{err}</p> : null}
            {msg ? <p className="text-sm text-green-700">{msg}</p> : null}

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90"
              >
                {saving ? "Saving..." : editingPathId ? "Update career path" : "Save career path"}
              </button>
              {editingPathId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-shrink-0 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h2 className="text-xl font-semibold text-foreground">All Career Paths</h2>
          {loadingList ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : paths.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No career paths yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Access</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {paths.map((p) => (
                    <tr key={p.id} className="border-b border-border/60">
                      <td className="py-2 pr-4 font-medium text-foreground">{p.title}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {p.access === "premium" ? `Premium${p.price ? ` (${p.price})` : ""}` : "Free"}
                      </td>
                      <td className="py-2 pr-4">
                        <select
                          value={p.status}
                          onChange={(e) => setPathStatus(p.id, e.target.value as CareerPathRow["status"])}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </td>
                      <td className="py-2 pr-4">
                        <button onClick={() => startEditPath(p.id)} className="mr-3 text-xs font-semibold text-primary hover:underline">Edit</button>
                        <button onClick={() => deletePath(p.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCareerPathsPage() {
  return <CareerPathsAdmin />;
}
