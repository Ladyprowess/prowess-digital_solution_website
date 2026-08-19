"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AccessPriceFields } from "@/components/admin/AccessPriceFields";
import { SkillPicker, saveSkillMap, type Skill } from "@/components/admin/SkillPicker";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: string | null;
  access: "free" | "premium";
  price: number | null;
  status: "draft" | "published";
};

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function LearnAdmin() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [title, setTitle] = useState("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number] | "">("");
  const [access, setAccess] = useState<"free" | "premium">("free");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [publishNow, setPublishNow] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadCourses = useCallback(async () => {
    setLoadingList(true);
    const [{ data }, { data: skillRows }] = await Promise.all([
      supabase
        .from("courses")
        .select("id, slug, title, description, level, access, price, status")
        .order("created_at", { ascending: false }),
      supabase.from("skills").select("id, slug, name").order("name"),
    ]);
    setCourses(data || []);
    setSkills(skillRows || []);
    setLoadingList(false);
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  async function getUniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 1;
    while (true) {
      const { data } = await supabase.from("courses").select("id").eq("slug", candidate).maybeSingle();
      if (!data) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }

  const submit = async () => {
    setErr(""); setMsg("");
    if (!title.trim()) return setErr("Title is required.");

    setSaving(true);
    try {
      const slug = await getUniqueSlug(slugify(title));
      const { data: created, error } = await supabase.from("courses").insert({
        slug,
        title: title.trim(),
        description: description.trim() || null,
        level: level || null,
        access,
        price: access === "premium" && price ? Number(price) : null,
        price_currency: access === "premium" && price ? currency : null,
        status: publishNow ? "published" : "draft",
      }).select("id").single();
      if (error || !created) throw new Error(error?.message || "Could not save the course.");

      await saveSkillMap("course_skill_map", "course_id", created.id, selectedSkillIds);

      setMsg("Course saved.");
      setTitle(""); setDescription(""); setLevel(""); setAccess("free"); setPrice(""); setPublishNow(false); setSelectedSkillIds([]);
      loadCourses();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  async function setCourseStatus(id: string, status: CourseRow["status"]) {
    await supabase.from("courses").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  async function deleteCourse(id: string) {
    if (!confirm("Delete this course? This can't be undone.")) return;
    await supabase.from("courses").delete().eq("id", id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div>
      <div>
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h1 className="text-3xl font-semibold text-foreground">Add Course</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Short, practical courses for the Learn section. Keep it minimal for now - a title and description is enough to list it as coming soon.
          </p>

          <div className="mt-8 grid gap-4">
            <Field label="Title *">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. How to Get Your First Remote Job" />
            </Field>
            <Field label="Description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} min-h-[100px]`} />
            </Field>

            <Field label="Level">
              <select value={level} onChange={(e) => setLevel(e.target.value as typeof level)} className={inputCls}>
                <option value="">Not specified</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>)}
              </select>
            </Field>

            <AccessPriceFields
              access={access} onAccessChange={setAccess}
              price={price} onPriceChange={setPrice}
              currency={currency} onCurrencyChange={setCurrency}
            />

            <Field label="Skills">
              <SkillPicker
                skills={skills} onSkillsChange={setSkills}
                selectedIds={selectedSkillIds} onSelectedIdsChange={setSelectedSkillIds}
              />
            </Field>

            <label className="mt-2 flex items-center gap-3 text-sm font-semibold text-foreground">
              <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
              Publish immediately
            </label>

            {err ? <p className="text-sm text-red-600">{err}</p> : null}
            {msg ? <p className="text-sm text-green-700">{msg}</p> : null}

            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="mt-2 w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90"
            >
              {saving ? "Saving..." : "Save course"}
            </button>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h2 className="text-xl font-semibold text-foreground">All Courses</h2>
          {loadingList ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : courses.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No courses yet.</p>
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
                  {courses.map((c) => (
                    <tr key={c.id} className="border-b border-border/60">
                      <td className="py-2 pr-4 font-medium text-foreground">{c.title}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {c.access === "premium" ? `Premium${c.price ? ` (${c.price})` : ""}` : "Free"}
                      </td>
                      <td className="py-2 pr-4">
                        <select
                          value={c.status}
                          onChange={(e) => setCourseStatus(c.id, e.target.value as CourseRow["status"])}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-3">
                          <Link href={`/admin/learn/${c.id}`} className="text-xs font-semibold text-primary hover:underline">Manage</Link>
                          <button onClick={() => deleteCourse(c.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                        </div>
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

export default function AdminLearnPage() {
  return <LearnAdmin />;
}
