"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AccessPriceFields } from "@/components/admin/AccessPriceFields";
import { SkillPicker, saveSkillMap, type Skill } from "@/components/admin/SkillPicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";
import { formatMoney } from "@/lib/formatMoney";

const PAGE_SIZE = 20;

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: string | null;
  access: "free" | "premium";
  price_usd: number | null;
  price_ngn: number | null;
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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | CourseRow["status"]>("all");
  const [listSearch, setListSearch] = useState("");

  const [title, setTitle] = useState("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [whatYoullLearn, setWhatYoullLearn] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number] | "">("");
  const [access, setAccess] = useState<"free" | "premium">("free");
  const [priceUsd, setPriceUsd] = useState("");
  const [priceNgn, setPriceNgn] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [durationLabel, setDurationLabel] = useState("");
  const [featured, setFeatured] = useState(false);
  const [publishNow, setPublishNow] = useState(false);
  const [editingStatus, setEditingStatus] = useState<CourseRow["status"] | null>(null);
  const [manualSlug, setManualSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  useEffect(() => {
    supabase.from("skills").select("id, slug, name").order("name").then(({ data }) => setSkills(data || []));
  }, []);

  const loadCourses = useCallback(async () => {
    setLoadingList(true);
    let query = supabase
      .from("courses")
      .select("id, slug, title, description, level, access, price_usd, price_ngn, status", { count: "exact" });
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (listSearch.trim()) query = query.ilike("title", `%${listSearch.trim()}%`);

    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    setCourses(data || []);
    setTotal(count || 0);
    setLoadingList(false);
  }, [page, statusFilter, listSearch]);

  useEffect(() => {
    const t = setTimeout(loadCourses, 200);
    return () => clearTimeout(t);
  }, [loadCourses]);

  useEffect(() => { setPage(1); }, [statusFilter, listSearch]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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

  const resetForm = () => {
    setEditingCourseId(null);
    setTitle(""); setDescription(""); setWhatYoullLearn(""); setLevel(""); setAccess("free"); setPriceUsd(""); setPriceNgn("");
    setThumbnailUrl(""); setDurationLabel(""); setFeatured(false); setPublishNow(false); setSelectedSkillIds([]);
    setEditingStatus(null); setManualSlug(""); setOriginalSlug(""); setMetaTitle(""); setMetaDescription("");
  };

  async function startEditCourse(id: string) {
    setErr(""); setMsg("");
    setLoadingEdit(true);
    const { data, error } = await supabase
      .from("courses")
      .select("id, slug, title, description, what_youll_learn, level, access, price_usd, price_ngn, thumbnail_url, duration_label, featured, status, meta_title, meta_description, course_skill_map(skill_id)")
      .eq("id", id)
      .single();
    setLoadingEdit(false);
    if (error || !data) { setErr(error?.message || "Could not load this course."); return; }

    const course = data as unknown as {
      id: string; slug: string; title: string; description: string | null; what_youll_learn: string | null;
      level: (typeof LEVELS)[number] | null;
      access: "free" | "premium"; price_usd: number | null; price_ngn: number | null;
      thumbnail_url: string | null; duration_label: string | null; featured: boolean;
      status: CourseRow["status"]; meta_title: string | null; meta_description: string | null;
      course_skill_map: { skill_id: string }[];
    };

    setEditingCourseId(course.id);
    setTitle(course.title);
    setDescription(course.description || "");
    setWhatYoullLearn(course.what_youll_learn || "");
    setLevel(course.level || "");
    setAccess(course.access);
    setPriceUsd(course.price_usd?.toString() || "");
    setPriceNgn(course.price_ngn?.toString() || "");
    setThumbnailUrl(course.thumbnail_url || "");
    setDurationLabel(course.duration_label || "");
    setFeatured(course.featured);
    setPublishNow(course.status === "published");
    setSelectedSkillIds(course.course_skill_map.map((m) => m.skill_id));
    setEditingStatus(course.status);
    setManualSlug(course.slug);
    setOriginalSlug(course.slug);
    setMetaTitle(course.meta_title || "");
    setMetaDescription(course.meta_description || "");

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
        what_youll_learn: whatYoullLearn.trim() || null,
        level: level || null,
        access,
        price_usd: access === "premium" && priceUsd ? Number(priceUsd) : null,
        price_ngn: access === "premium" && priceNgn ? Number(priceNgn) : null,
        thumbnail_url: thumbnailUrl.trim() || null,
        duration_label: durationLabel.trim() || null,
        featured,
        status: publishNow ? "published" as const : "draft" as const,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
      };

      let courseId = editingCourseId;

      if (editingCourseId) {
        // The slug can only move while the course is still a draft - once
        // published, changing it would break a URL someone may have
        // already bookmarked, shared, or that search engines have indexed.
        const wantsSlugChange = editingStatus === "draft" && manualSlug.trim() && slugify(manualSlug) !== originalSlug;
        const slugUpdate = wantsSlugChange ? { slug: await getUniqueSlug(slugify(manualSlug)) } : {};

        const { error } = await supabase.from("courses").update({ ...basePayload, ...slugUpdate }).eq("id", editingCourseId);
        if (error) throw new Error(error.message);
        await supabase.from("course_skill_map").delete().eq("course_id", editingCourseId);
      } else {
        const slug = await getUniqueSlug(slugify(manualSlug.trim() || title));
        const { data: created, error } = await supabase.from("courses").insert({ ...basePayload, slug }).select("id").single();
        if (error || !created) throw new Error(error?.message || "Could not save the course.");
        courseId = created.id;
      }

      await saveSkillMap("course_skill_map", "course_id", courseId!, selectedSkillIds);

      setMsg(editingCourseId ? "Course updated." : "Course saved.");
      resetForm();
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
    loadCourses();
  }

  return (
    <div>
      <div>
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h1 className="text-3xl font-semibold text-foreground">{editingCourseId ? "Edit Course" : "Add Course"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {editingCourseId ? "Update this course. Manage its modules and lessons separately." : "Short, practical courses for the Learn section. Keep it minimal for now - a title and description is enough to list it as coming soon."}
          </p>
          {loadingEdit && <p className="mt-2 text-sm text-muted-foreground">Loading course…</p>}

          <div className="mt-8 grid gap-4">
            <Field label="Title *">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. How to Get Your First Remote Job" />
            </Field>
            <Field label="Description">
              <RichTextEditor key={`desc-${editingCourseId || "new"}`} value={description} onChange={setDescription} placeholder="What the course covers, who it's for, what they'll learn..." />
            </Field>

            <Field label="What you'll learn">
              <RichTextEditor key={`wyl-${editingCourseId || "new"}`} value={whatYoullLearn} onChange={setWhatYoullLearn} placeholder="A bullet list of concrete takeaways..." />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Level">
                <select value={level} onChange={(e) => setLevel(e.target.value as typeof level)} className={inputCls}>
                  <option value="">Not specified</option>
                  {LEVELS.map((l) => <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>)}
                </select>
              </Field>
              <Field label="Duration (optional)">
                <input value={durationLabel} onChange={(e) => setDurationLabel(e.target.value)} className={inputCls} placeholder="e.g. 4 hours, 6 modules" />
              </Field>
            </div>

            <Field label="Thumbnail URL (optional)">
              <input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className={inputCls} placeholder="https://..." />
            </Field>

            <AccessPriceFields
              access={access} onAccessChange={setAccess}
              priceUsd={priceUsd} onPriceUsdChange={setPriceUsd}
              priceNgn={priceNgn} onPriceNgnChange={setPriceNgn}
            />

            <Field label="Skills">
              <SkillPicker
                skills={skills} onSkillsChange={setSkills}
                selectedIds={selectedSkillIds} onSelectedIdsChange={setSelectedSkillIds}
              />
            </Field>

            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">SEO (optional)</p>
              <div className="mt-4 grid gap-4">
                <Field label={editingStatus && editingStatus !== "draft" ? "URL slug (frozen once published)" : "URL slug"}>
                  <input
                    value={manualSlug}
                    onChange={(e) => setManualSlug(e.target.value)}
                    disabled={Boolean(editingStatus) && editingStatus !== "draft"}
                    className={`${inputCls} disabled:cursor-not-allowed disabled:opacity-60`}
                    placeholder="Leave blank to auto-generate from the title"
                  />
                </Field>
                <Field label="Meta title">
                  <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputCls} placeholder="Defaults to the course title if left blank" />
                </Field>
                <Field label="Meta description">
                  <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className={`${inputCls} min-h-20`} placeholder="Shown in search results and link previews" />
                </Field>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
                <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
                Publish immediately
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                Featured
              </label>
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
                {saving ? "Saving..." : editingCourseId ? "Update course" : "Save course"}
              </button>
              {editingCourseId && (
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">All Courses</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search title..."
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          {loadingList ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : courses.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No courses match this filter.</p>
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
                        {c.access === "premium"
                          ? `Premium${
                              c.price_usd || c.price_ngn
                                ? ` (${[
                                    c.price_usd ? formatMoney(c.price_usd, "USD") : null,
                                    c.price_ngn ? formatMoney(c.price_ngn, "NGN") : null,
                                  ].filter(Boolean).join(" / ")})`
                                : ""
                            }`
                          : "Free"}
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
                          <button onClick={() => startEditCourse(c.id)} className="text-xs font-semibold text-primary hover:underline">Edit</button>
                          <button onClick={() => deleteCourse(c.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-center text-xs text-muted-foreground">{total} course{total === 1 ? "" : "s"} total</p>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}

export default function AdminLearnPage() {
  return <LearnAdmin />;
}
