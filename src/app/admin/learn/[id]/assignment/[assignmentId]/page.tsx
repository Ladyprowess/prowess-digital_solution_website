"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Assignment = {
  id: string;
  title: string;
  instructions: string;
  quiz_id: string | null;
  allow_file_upload: boolean;
  peer_review_enabled: boolean;
  status: "draft" | "published";
};

const inputCls = "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function AssignmentSettingsPage({ courseId, assignmentId }: { courseId: string; assignmentId: string }) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [allowFileUpload, setAllowFileUpload] = useState(true);
  const [peerReviewEnabled, setPeerReviewEnabled] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("assignments").select("*").eq("id", assignmentId).maybeSingle();
    if (data) {
      setAssignment(data as Assignment);
      setTitle(data.title);
      setInstructions(data.instructions || "");
      setAllowFileUpload(data.allow_file_upload);
      setPeerReviewEnabled(data.peer_review_enabled);
      setStatus(data.status);
    }
    setLoading(false);
  }, [assignmentId]);

  useEffect(() => { (async () => { await load(); })(); }, [load]);

  async function save() {
    setErr(""); setMsg("");
    if (!title.trim()) return setErr("Title is required.");
    if (status === "published" && !instructions.trim()) return setErr("Add instructions before publishing this assignment.");

    const { error } = await supabase.from("assignments").update({
      title: title.trim(),
      instructions: instructions.trim(),
      allow_file_upload: allowFileUpload,
      peer_review_enabled: peerReviewEnabled,
      status,
    }).eq("id", assignmentId);

    if (error) return setErr(error.message);

    // The lesson list shows the same title - keep them in sync (mirrors
    // the quiz sub-page's own lesson-title sync, one directional: the
    // assignment editor is authoritative for the title once it exists).
    await supabase.from("course_lessons").update({ title: title.trim() }).eq("assignment_id", assignmentId);

    setMsg("Saved.");
    load();
  }

  async function addQuiz() {
    setErr(""); setMsg("");
    const { data: quizRow, error: quizErr } = await supabase
      .from("quizzes")
      .insert({ title: `${title || "Assignment"} - Quiz`, quiz_type: "assessment" })
      .select("id")
      .single();
    if (quizErr) return setErr(quizErr.message);

    const { error } = await supabase.from("assignments").update({ quiz_id: quizRow.id }).eq("id", assignmentId);
    if (error) return setErr(error.message);
    load();
  }

  async function removeQuiz() {
    if (!confirm("Remove the quiz component from this assignment? The quiz itself won't be deleted, just detached.")) return;
    await supabase.from("assignments").update({ quiz_id: null }).eq("id", assignmentId);
    load();
  }

  if (loading) return <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>;
  if (!assignment) return <p className="py-16 text-center text-sm text-muted-foreground">Assignment not found.</p>;

  return (
    <div>
      <Link href={`/admin/learn/${courseId}`} className="text-sm font-semibold text-primary hover:underline">&larr; Back to course</Link>
      <h1 className="mt-3 text-2xl font-semibold text-foreground">{assignment.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Instructions, submission options, and peer review for this assignment.</p>

      <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-6">
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </Field>

        <Field label="Instructions">
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={6} className={inputCls} placeholder="What should the learner do and submit?" />
        </Field>

        <div className="rounded-xl bg-muted p-4">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground">EMBEDDED QUIZ (OPTIONAL)</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A combined auto-graded component. The learner must pass both the quiz AND receive a passing manual grade for this assignment to count toward completion.
          </p>
          {assignment.quiz_id ? (
            <div className="mt-3 flex items-center gap-3">
              <Link href={`/admin/learn/${courseId}/quiz/${assignment.quiz_id}`} className="text-sm font-semibold text-primary hover:underline">Manage quiz →</Link>
              <button onClick={removeQuiz} className="text-xs font-semibold text-red-600 hover:underline">Remove</button>
            </div>
          ) : (
            <button onClick={addQuiz} className="mt-3 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">
              Add a quiz component
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={allowFileUpload} onChange={(e) => setAllowFileUpload(e.target.checked)} />
          Allow a file upload alongside the required written submission
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={peerReviewEnabled} onChange={(e) => setPeerReviewEnabled(e.target.checked)} />
          Enable peer review for this assignment
        </label>

        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className={inputCls}>
            <option value="draft">Draft (not visible to learners)</option>
            <option value="published">Published</option>
          </select>
        </Field>

        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        {msg ? <p className="text-sm text-primary">{msg}</p> : null}

        <button type="button" onClick={save} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
          Save assignment
        </button>
      </div>
    </div>
  );
}

export default function AdminAssignmentPage({ params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const { id, assignmentId } = use(params);
  return <AssignmentSettingsPage courseId={id} assignmentId={assignmentId} />;
}
