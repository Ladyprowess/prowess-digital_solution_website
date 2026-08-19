"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

type Course = { id: string; title: string };
type Module = { id: string; title: string; position: number };
type Lesson = {
  id: string;
  module_id: string;
  title: string;
  content_type: "video" | "text" | "youtube" | "pdf" | "external";
  content_url: string | null;
  content_text: string | null;
  position: number;
};

const CONTENT_TYPES = ["video", "text", "youtube", "pdf", "external"] as const;
const inputCls = "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ModuleCard({ module, lessons, onChange }: { module: Module; lessons: Lesson[]; onChange: () => void }) {
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState<(typeof CONTENT_TYPES)[number]>("text");
  const [contentUrl, setContentUrl] = useState("");
  const [contentText, setContentText] = useState("");
  const [err, setErr] = useState("");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  const resetLessonForm = () => {
    setEditingLessonId(null);
    setTitle(""); setContentType("text"); setContentUrl(""); setContentText("");
  };

  function startEditLesson(lesson: Lesson) {
    setErr("");
    setEditingLessonId(lesson.id);
    setTitle(lesson.title);
    setContentType(lesson.content_type);
    setContentUrl(lesson.content_url || "");
    setContentText(lesson.content_text || "");
  }

  const saveLesson = async () => {
    setErr("");
    if (!title.trim()) return setErr("Lesson title is required.");
    const payload = {
      title: title.trim(),
      content_type: contentType,
      content_url: contentType !== "text" ? contentUrl.trim() || null : null,
      content_text: contentType === "text" ? contentText.trim() || null : null,
    };
    const { error } = editingLessonId
      ? await supabase.from("course_lessons").update(payload).eq("id", editingLessonId)
      : await supabase.from("course_lessons").insert({ ...payload, module_id: module.id, position: lessons.length });
    if (error) return setErr(error.message);
    resetLessonForm();
    onChange();
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    await supabase.from("course_lessons").delete().eq("id", id);
    if (editingLessonId === id) resetLessonForm();
    onChange();
  };

  const deleteModule = async () => {
    if (!confirm("Delete this module and all its lessons?")) return;
    await supabase.from("course_modules").delete().eq("id", module.id);
    onChange();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">{module.title}</h3>
        <button onClick={deleteModule} className="text-xs font-semibold text-red-600 hover:underline">Delete module</button>
      </div>

      {lessons.length > 0 && (
        <ul className="mt-4 space-y-2">
          {lessons.map((l) => (
            <li key={l.id} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-2 text-sm">
              <span className="text-foreground">{l.title} <span className="text-muted-foreground">({l.content_type})</span></span>
              <span className="flex-shrink-0">
                <button onClick={() => startEditLesson(l)} className="mr-3 text-xs font-semibold text-primary hover:underline">Edit</button>
                <button onClick={() => deleteLesson(l.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid gap-3 rounded-xl bg-muted p-4">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground">{editingLessonId ? "EDIT LESSON" : "ADD LESSON"}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. What is SEO?" />
          </Field>
          <Field label="Type">
            <select value={contentType} onChange={(e) => setContentType(e.target.value as typeof contentType)} className={inputCls}>
              {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        {contentType === "text" ? (
          <Field label="Content">
            <RichTextEditor key={`lesson-${editingLessonId || "new"}`} value={contentText} onChange={setContentText} placeholder="The lesson content..." />
          </Field>
        ) : (
          <Field label={contentType === "youtube" ? "YouTube URL" : contentType === "pdf" ? "PDF link" : contentType === "video" ? "Video URL" : "External link"}>
            <input value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} className={inputCls} placeholder="https://..." />
          </Field>
        )}
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={saveLesson}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {editingLessonId ? "Update lesson" : "Add lesson"}
          </button>
          {editingLessonId && (
            <button
              type="button"
              onClick={resetLessonForm}
              className="flex-shrink-0 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CourseManageAdmin({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [err, setErr] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: courseRow }, { data: moduleRows }] = await Promise.all([
      supabase.from("courses").select("id, title").eq("id", courseId).maybeSingle(),
      supabase.from("course_modules").select("id, title, position").eq("course_id", courseId).order("position"),
    ]);
    setCourse(courseRow || null);
    setModules(moduleRows || []);

    const moduleIds = (moduleRows || []).map((m) => m.id);
    if (moduleIds.length > 0) {
      const { data: lessonRows } = await supabase
        .from("course_lessons")
        .select("id, module_id, title, content_type, content_url, content_text, position")
        .in("module_id", moduleIds)
        .order("position");
      setLessons(lessonRows || []);
    } else {
      setLessons([]);
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addModule = async () => {
    setErr("");
    if (!newModuleTitle.trim()) return setErr("Module title is required.");
    const { error } = await supabase.from("course_modules").insert({
      course_id: courseId,
      title: newModuleTitle.trim(),
      position: modules.length,
    });
    if (error) return setErr(error.message);
    setNewModuleTitle("");
    loadAll();
  };

  if (loading) return <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>;
  if (!course) return <p className="py-16 text-center text-sm text-muted-foreground">Course not found.</p>;

  return (
    <div>
      <div>
        <Link href="/admin/learn" className="text-sm font-semibold text-primary hover:underline">&larr; All courses</Link>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">{course.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage modules and lessons for this course.</p>

        <div className="mt-8 flex gap-2 rounded-2xl border border-border bg-card p-4">
          <input
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            className={inputCls}
            placeholder="New module title, e.g. Module 1: Introduction"
          />
          <button
            type="button"
            onClick={addModule}
            className="flex-shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Add module
          </button>
        </div>
        {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}

        <div className="mt-6 grid gap-6">
          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No modules yet. Add one above.</p>
          ) : (
            modules.map((m) => (
              <ModuleCard
                key={m.id}
                module={m}
                lessons={lessons.filter((l) => l.module_id === m.id)}
                onChange={loadAll}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCourseManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <CourseManageAdmin courseId={id} />;
}
