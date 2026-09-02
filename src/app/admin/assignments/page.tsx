"use client";

import { useCallback, useEffect, useState } from "react";
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
      <h1 className="text-2xl font-semibold text-foreground">Assignment grading</h1>
      <p className="mt-1 text-sm text-muted-foreground">Submissions waiting to be graded, across every course.</p>

      <div className="mt-8 space-y-4">
        {!loading && submissions.length === 0 && (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">No submissions waiting to be graded.</p>
        )}
        {submissions.map((s) => (
          <div key={s.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                {assignmentTitles[s.assignment_id] || "Assignment"} · {courseTitles[s.course_id] || "Course"}
              </p>
              <p className="text-xs text-muted-foreground">
                {learnerNames[s.user_id] || "…"} · submitted {new Date(s.submitted_at).toLocaleDateString()}
              </p>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{s.submission_text}</p>
            {s.file_name && (
              <button
                type="button"
                onClick={() => downloadAssignmentFile(s.id, s.file_name || undefined)}
                className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
              >
                Download file ({s.file_name})
              </button>
            )}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                min={0}
                max={100}
                placeholder="Score % (optional)"
                value={scoreById[s.id] || ""}
                onChange={(e) => setScoreById((prev) => ({ ...prev, [s.id]: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              <input
                placeholder="Feedback (optional)"
                value={feedbackById[s.id] || ""}
                onChange={(e) => setFeedbackById((prev) => ({ ...prev, [s.id]: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>

            {resultById[s.id] && <p className="mt-2 text-sm font-semibold text-destructive">{resultById[s.id]}</p>}

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => grade(s.id, true)}
                disabled={busy === s.id}
                className="inline-flex min-h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                Pass
              </button>
              <button
                type="button"
                onClick={() => grade(s.id, false)}
                disabled={busy === s.id}
                className="inline-flex min-h-9 items-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
              >
                Fail
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
