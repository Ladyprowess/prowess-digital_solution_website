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
  content_type: "video" | "text" | "youtube" | "pdf" | "external" | "quiz";
  content_url: string | null;
  content_text: string | null;
  quiz_id: string | null;
  required: boolean;
  position: number;
};
type QuizOption = { id: string; title: string; quiz_type: string; pass_mark_percent: number | null };
type CompletionRules = {
  require_all_required_activities: boolean;
  require_all_quizzes_passed: boolean;
  require_final_assessment: boolean;
  final_assessment_quiz_id: string | null;
  minimum_final_score_percent: number | null;
  issue_certificate_automatically: boolean;
};

const CONTENT_TYPES = ["video", "text", "youtube", "pdf", "external", "quiz"] as const;
const inputCls = "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ModuleCard({ courseId, module, lessons, onChange }: { courseId: string; module: Module; lessons: Lesson[]; onChange: () => void }) {
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

    if (contentType === "quiz" && !editingLessonId) {
      // A quiz lesson needs its own quizzes row to point at - two
      // sequential inserts, no transaction, consistent with this file's
      // existing no-rollback precedent everywhere else (e.g. deleteModule
      // relying on FK cascade rather than manual cleanup).
      const { data: quizRow, error: quizErr } = await supabase
        .from("quizzes")
        .insert({ title: title.trim(), quiz_type: "knowledge_check" })
        .select("id")
        .single();
      if (quizErr) return setErr(quizErr.message);

      const { error: lessonErr } = await supabase.from("course_lessons").insert({
        title: title.trim(),
        content_type: "quiz",
        quiz_id: quizRow.id,
        module_id: module.id,
        position: lessons.length,
      });
      if (lessonErr) return setErr(lessonErr.message);

      resetLessonForm();
      onChange();
      return;
    }

    // Editing an existing quiz-lesson only ever updates its title here -
    // the linked quiz's settings/questions are edited on its own sub-page.
    const payload =
      contentType === "quiz"
        ? { title: title.trim() }
        : {
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
                {l.content_type === "quiz" && l.quiz_id ? (
                  <Link href={`/admin/learn/${courseId}/quiz/${l.quiz_id}`} className="mr-3 text-xs font-semibold text-primary hover:underline">Manage quiz →</Link>
                ) : (
                  <button onClick={() => startEditLesson(l)} className="mr-3 text-xs font-semibold text-primary hover:underline">Edit</button>
                )}
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
        {contentType === "quiz" ? (
          <p className="text-sm text-muted-foreground">
            {editingLessonId
              ? "This lesson's quiz settings and questions are edited from its own page - use \"Manage quiz\" in the list above."
              : "Adding this creates a new quiz. You'll set its questions and settings on its own page right after."}
          </p>
        ) : contentType === "text" ? (
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

function CompletionCard({
  courseId,
  hasRequiredLesson,
  assessmentQuizzes,
}: {
  courseId: string;
  hasRequiredLesson: boolean;
  assessmentQuizzes: QuizOption[];
}) {
  const [rules, setRules] = useState<CompletionRules>({
    require_all_required_activities: true,
    require_all_quizzes_passed: false,
    require_final_assessment: false,
    final_assessment_quiz_id: null,
    minimum_final_score_percent: null,
    issue_certificate_automatically: false,
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("course_completion_rules").select("*").eq("course_id", courseId).maybeSingle();
      if (data) setRules(data as CompletionRules);
      setLoading(false);
    })();
  }, [courseId]);

  const save = async () => {
    setErr("");
    setSaved(false);

    // Block a vacuous ruleset from ever being saved - the evaluator would
    // refuse to complete anyone under it anyway (its own non-vacuous-ruleset
    // check), so catching it here gives a clear, actionable message instead
    // of a silent "nobody's course completes". Two distinct vacuous shapes:
    // nothing checked at all, or something checked with no real target.
    if (!rules.require_all_required_activities && !rules.require_all_quizzes_passed && !rules.require_final_assessment) {
      return setErr("Enable at least one completion rule below - otherwise this course can never be marked complete.");
    }
    if (rules.require_all_required_activities && !hasRequiredLesson) {
      return setErr("This course has no lessons yet, so \"require all required lessons\" has nothing to check.");
    }
    if (rules.require_all_quizzes_passed && assessmentQuizzes.length === 0) {
      return setErr("This course has no assessment quizzes with a pass mark, so \"require all quizzes passed\" has nothing to check.");
    }
    if (rules.require_final_assessment && !rules.final_assessment_quiz_id) {
      return setErr("Select a final assessment quiz, or uncheck \"require final assessment\".");
    }

    const { error } = await supabase.from("course_completion_rules").upsert(
      { course_id: courseId, ...rules },
      { onConflict: "course_id" }
    );
    if (error) return setErr(error.message);
    setSaved(true);
  };

  if (loading) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-base font-bold text-foreground">Completion &amp; Certificate</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Decide what a learner must do to formally complete this course, and whether that earns them a certificate.
      </p>

      <div className="mt-4 space-y-3">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={rules.require_all_required_activities}
            onChange={(e) => setRules({ ...rules, require_all_required_activities: e.target.checked })}
          />
          Require all required lessons
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={rules.require_all_quizzes_passed}
            onChange={(e) => setRules({ ...rules, require_all_quizzes_passed: e.target.checked })}
          />
          Require all quizzes passed
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={rules.require_final_assessment}
            onChange={(e) => setRules({ ...rules, require_final_assessment: e.target.checked })}
          />
          Require final assessment
        </label>

        {rules.require_final_assessment && (
          <div className="ml-6 grid gap-3 sm:grid-cols-2">
            <Field label="Final assessment quiz">
              <select
                value={rules.final_assessment_quiz_id || ""}
                onChange={(e) => setRules({ ...rules, final_assessment_quiz_id: e.target.value || null })}
                className={inputCls}
              >
                <option value="">Select a quiz…</option>
                {assessmentQuizzes.map((q) => (
                  <option key={q.id} value={q.id}>{q.title}</option>
                ))}
              </select>
              {assessmentQuizzes.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  No assessment-type quizzes with a pass mark exist in this course yet.
                </p>
              )}
            </Field>
            <Field label="Minimum final score %">
              <input
                type="number"
                min={0}
                max={100}
                value={rules.minimum_final_score_percent ?? ""}
                onChange={(e) => setRules({ ...rules, minimum_final_score_percent: e.target.value === "" ? null : Number(e.target.value) })}
                className={inputCls}
                placeholder="e.g. 70"
              />
            </Field>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={rules.issue_certificate_automatically}
            onChange={(e) => setRules({ ...rules, issue_certificate_automatically: e.target.checked })}
          />
          Issue certificate automatically
        </label>
      </div>

      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
      {saved ? <p className="mt-3 text-sm text-primary">Saved.</p> : null}

      <button
        type="button"
        onClick={save}
        className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Save completion rules
      </button>
    </div>
  );
}

function CourseManageAdmin({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assessmentQuizzes, setAssessmentQuizzes] = useState<QuizOption[]>([]);
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
        .select("id, module_id, title, content_type, content_url, content_text, quiz_id, required, position")
        .in("module_id", moduleIds)
        .order("position");
      setLessons(lessonRows || []);

      // Same two-step fetch the evaluator uses: this course's lessons'
      // quiz_ids, then those quizzes filtered client-side to assessment
      // type with a real pass mark - a knowledge-check or a pass-mark-less
      // assessment can never produce quiz_attempts.passed = true, so
      // offering one here would let this picker configure an
      // unsatisfiable rule (the evaluator independently re-verifies this
      // regardless of what this dropdown ever offered).
      const quizIds = (lessonRows || []).filter((l) => l.quiz_id).map((l) => l.quiz_id as string);
      if (quizIds.length > 0) {
        const { data: quizRows } = await supabase.from("quizzes").select("id, title, quiz_type, pass_mark_percent").in("id", quizIds);
        setAssessmentQuizzes((quizRows || []).filter((q) => q.quiz_type === "assessment" && q.pass_mark_percent != null));
      } else {
        setAssessmentQuizzes([]);
      }
    } else {
      setLessons([]);
      setAssessmentQuizzes([]);
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
                courseId={courseId}
                module={m}
                lessons={lessons.filter((l) => l.module_id === m.id)}
                onChange={loadAll}
              />
            ))
          )}
        </div>

        <div className="mt-6">
          <CompletionCard
            courseId={courseId}
            hasRequiredLesson={lessons.some((l) => l.required !== false)}
            assessmentQuizzes={assessmentQuizzes}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminCourseManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <CourseManageAdmin courseId={id} />;
}
