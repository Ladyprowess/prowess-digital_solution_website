"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Download, Inbox, Loader2, MessageSquareText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { downloadAssignmentFile } from "@/lib/assignments/downloadFile";

type Submission = {
  id: string;
  assignment_id: string;
  course_id: string;
  user_id: string;
  submission_text: string;
  file_path: string | null;
  file_name: string | null;
  submitted_at: string;
};

export default function AdminAssignmentsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignmentTitles, setAssignmentTitles] = useState<Record<string, string>>({});
  const [courseTitles, setCourseTitles] = useState<Record<string, string>>({});
  const [learnerNames, setLearnerNames] = useState<Record<string, string>>({});
  const [scoreById, setScoreById] = useState<Record<string, string>>({});
  const [feedbackById, setFeedbackById] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [resultById, setResultById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: pending } = await supabase
      .from("assignment_submissions")
      .select("id, assignment_id, course_id, user_id, submission_text, file_path, file_name, submitted_at")
      .eq("status", "submitted")
      .order("submitted_at", { ascending: true });

    const list = (pending || []) as Submission[];
    setSubmissions(list);

    const assignmentIds = Array.from(new Set(list.map((s) => s.assignment_id)));
    const courseIds = Array.from(new Set(list.map((s) => s.course_id)));
    const userIds = Array.from(new Set(list.map((s) => s.user_id)));

    const [{ data: assignments }, { data: courses }, { data: profiles }] = await Promise.all([
      assignmentIds.length ? supabase.from("assignments").select("id, title").in("id", assignmentIds) : Promise.resolve({ data: [] }),
      courseIds.length ? supabase.from("courses").select("id, title").in("id", courseIds) : Promise.resolve({ data: [] }),
      userIds.length ? supabase.from("member_profiles").select("id, full_name").in("id", userIds) : Promise.resolve({ data: [] }),
    ]);

    setAssignmentTitles(Object.fromEntries((assignments || []).map((a) => [a.id, a.title])));
    setCourseTitles(Object.fromEntries((courses || []).map((c) => [c.id, c.title])));
    setLearnerNames(Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name || "Community member"])));

    setLoading(false);
  }, []);

  useEffect(() => { (async () => { await load(); })(); }, [load]);

  async function grade(id: string, passed: boolean) {
    setBusy(id);
    setResultById((prev) => ({ ...prev, [id]: "" }));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setBusy(null); return; }

    const scoreRaw = scoreById[id];
    const scorePercent = scoreRaw ? Number(scoreRaw) : null;

    const res = await fetch(`/api/admin/assignments/submissions/${id}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ scorePercent, passed, feedback: feedbackById[id] || null }),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: "Something went wrong." }));

    setBusy(null);
    if (!res.ok) {
      setResultById((prev) => ({ ...prev, [id]: res.error || "Something went wrong." }));
      return;
    }
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <ClipboardCheck size={14} aria-hidden="true" />
            Assignments
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-foreground">Assignment grading</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Review learner submissions, download supporting files, and record the official grade.</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-right">
          <p className="text-2xl font-bold text-foreground">{loading ? "..." : submissions.length}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Waiting</p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {loading && (
          <div className="rounded-lg border border-border bg-card p-5" aria-busy="true">
            <div className="flex items-center gap-3">
              <Loader2 size={18} className="animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground">Loading submissions</p>
            </div>
            <div className="mt-5 space-y-3">
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-4/5 rounded bg-muted" />
            </div>
          </div>
        )}
        {!loading && submissions.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Inbox size={20} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">No submissions waiting to be graded</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">New learner submissions will appear here as soon as they are sent in.</p>
          </div>
        )}
        {submissions.map((s) => (
          <div key={s.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">{courseTitles[s.course_id] || "Course"}</p>
                <h2 className="mt-1 text-lg font-bold text-foreground">{assignmentTitles[s.assignment_id] || "Assignment"}</h2>
              </div>
              <div className="rounded-lg bg-muted px-3 py-2 text-right">
                <p className="text-sm font-semibold text-foreground">{learnerNames[s.user_id] || "Learner"}</p>
                <p className="text-xs text-muted-foreground">Submitted {new Date(s.submitted_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-background p-4">
              <div className="mb-2 flex items-center gap-2">
                <MessageSquareText size={16} className="text-primary" aria-hidden="true" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Learner submission</p>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{s.submission_text}</p>
            </div>
            {s.file_name && (
              <button
                type="button"
                onClick={() => downloadAssignmentFile(s.id, s.file_name || undefined)}
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Download size={15} aria-hidden="true" />
                Download file
              </button>
            )}
            {s.file_name && <p className="mt-1 text-xs text-muted-foreground">{s.file_name}</p>}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Score</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Score % (optional)"
                  value={scoreById[s.id] || ""}
                  onChange={(e) => setScoreById((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Feedback</span>
                <input
                  placeholder="Feedback for the learner"
                  value={feedbackById[s.id] || ""}
                  onChange={(e) => setFeedbackById((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </label>
            </div>

            {resultById[s.id] && <p className="mt-2 text-sm font-semibold text-destructive">{resultById[s.id]}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => grade(s.id, true)}
                disabled={busy === s.id}
                className="inline-flex min-h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {busy === s.id ? "Saving..." : "Pass submission"}
              </button>
              <button
                type="button"
                onClick={() => grade(s.id, false)}
                disabled={busy === s.id}
                className="inline-flex min-h-10 items-center rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Needs revision
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
