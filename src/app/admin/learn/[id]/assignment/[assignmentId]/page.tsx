"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, FileUp, HelpCircle, Loader2, Save, Users } from "lucide-react";
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

const inputCls = "min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</label>
      ) : (
        <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      )}
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
  const [confirmRemoveQuiz, setConfirmRemoveQuiz] = useState(false);

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
    await supabase.from("assignments").update({ quiz_id: null }).eq("id", assignmentId);
    setConfirmRemoveQuiz(false);
    load();
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6" aria-busy="true">
        <div className="flex items-center gap-3">
          <Loader2 size={18} className="animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">Loading assignment settings</p>
        </div>
      </div>
    );
  }
  if (!assignment) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm font-semibold text-foreground">Assignment not found</p>
        <Link href={`/admin/learn/${courseId}`} className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Back to course
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href={`/admin/learn/${courseId}`} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <ArrowLeft size={15} aria-hidden="true" />
        Back to course
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <ClipboardCheck size={14} aria-hidden="true" />
            Assignment setup
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-foreground">{assignment.title}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Write the brief, choose what learners can submit, and decide whether peer review is part of the assignment.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {status}
        </span>
      </div>

      <div className="mt-6 grid gap-5 rounded-lg border border-border bg-card p-6">
        <Field label="Title" htmlFor="assignment-title">
          <input id="assignment-title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </Field>

        <Field label="Instructions" htmlFor="assignment-instructions">
          <textarea id="assignment-instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={7} className={`${inputCls} py-3 leading-6`} placeholder="Explain the task, what learners should submit, and how the work will be reviewed." />
        </Field>

        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <div className="flex items-center gap-2">
            <HelpCircle size={17} className="text-primary" aria-hidden="true" />
            <p className="text-xs font-semibold tracking-widest text-muted-foreground">EMBEDDED QUIZ (OPTIONAL)</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            A combined auto-graded component. The learner must pass both the quiz AND receive a passing manual grade for this assignment to count toward completion.
          </p>
          {assignment.quiz_id ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Link href={`/admin/learn/${courseId}/quiz/${assignment.quiz_id}`} className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Manage quiz</Link>
              {confirmRemoveQuiz ? (
                <>
                  <button type="button" onClick={removeQuiz} className="inline-flex min-h-10 items-center rounded-lg border border-destructive/30 bg-destructive/5 px-4 text-sm font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Confirm remove</button>
                  <button type="button" onClick={() => setConfirmRemoveQuiz(false)} className="inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Cancel</button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirmRemoveQuiz(true)} className="inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Remove quiz</button>
              )}
            </div>
          ) : (
            <button type="button" onClick={addQuiz} className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Add a quiz component
            </button>
          )}
        </div>

        <label className="flex min-h-12 items-center gap-3 rounded-lg border border-border bg-background p-4 text-sm text-foreground">
          <input type="checkbox" checked={allowFileUpload} onChange={(e) => setAllowFileUpload(e.target.checked)} />
          <FileUp size={17} className="text-primary" aria-hidden="true" />
          <span>Allow a file upload alongside the required written submission</span>
        </label>

        <label className="flex min-h-12 items-center gap-3 rounded-lg border border-border bg-background p-4 text-sm text-foreground">
          <input type="checkbox" checked={peerReviewEnabled} onChange={(e) => setPeerReviewEnabled(e.target.checked)} />
          <Users size={17} className="text-primary" aria-hidden="true" />
          <span>Enable anonymous peer review for this assignment</span>
        </label>

        <Field label="Status" htmlFor="assignment-status">
          <select id="assignment-status" value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className={inputCls}>
            <option value="draft">Draft (not visible to learners)</option>
            <option value="published">Published</option>
          </select>
        </Field>

        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        {msg ? <p className="text-sm text-primary">{msg}</p> : null}

        <button type="button" onClick={save} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Save size={15} aria-hidden="true" />
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
