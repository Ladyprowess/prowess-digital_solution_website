"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { QuizRunner } from "@/components/learn/QuizRunner";
import { downloadAssignmentFile } from "@/lib/assignments/downloadFile";

type ActiveSubmission = {
  id: string;
  submission_text: string;
  file_name: string | null;
  status: "submitted" | "graded";
  score_percent: number | null;
  passed: boolean | null;
  feedback: string | null;
  submitted_at: string;
};

type Assignment = {
  id: string;
  title: string;
  instructions: string;
  quizId: string | null;
  allowFileUpload: boolean;
  peerReviewEnabled: boolean;
};

type ReceivedReview = { rating: number | null; feedback: string; created_at: string };
type PeerReviewProgress = { done: number; required: number } | null;
type Candidate = { submissionId: string; submissionText: string; fileAvailable: boolean };

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : null;
}

export function AssignmentRunner({ assignmentId, lessonId }: { assignmentId: string; lessonId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<ActiveSubmission | null>(null);
  const [receivedReviews, setReceivedReviews] = useState<ReceivedReview[]>([]);
  const [peerReviewProgress, setPeerReviewProgress] = useState<PeerReviewProgress>(null);

  const [submissionText, setSubmissionText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [candidate, setCandidate] = useState<Candidate | null | "none">(null);
  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const headers = await authHeader();
    const res = await fetch(`/api/assignments/${assignmentId}`, { headers: headers || {} }).then((r) => r.json()).catch(() => null);
    if (!res?.ok) {
      setError(res?.error || "Could not load this assignment.");
      setLoading(false);
      return;
    }
    setAssignment(res.assignment);
    setActiveSubmission(res.activeSubmission);
    setReceivedReviews(res.receivedReviews || []);
    setPeerReviewProgress(res.peerReviewProgress);
    setShowForm(!res.activeSubmission);
    setLoading(false);
  }, [assignmentId]);

  useEffect(() => { (async () => { await load(); })(); }, [load]);

  async function submit() {
    if (!submissionText.trim()) return;
    setSubmitting(true);
    setError("");
    const headers = await authHeader();
    if (!headers) { setSubmitting(false); return; }

    const formData = new FormData();
    formData.append("submissionText", submissionText.trim());
    if (file) formData.append("file", file);

    const res = await fetch(`/api/assignments/${assignmentId}/submissions`, { method: "POST", headers, body: formData })
      .then((r) => r.json()).catch(() => ({ ok: false, error: "Something went wrong." }));

    setSubmitting(false);
    if (!res.ok) { setError(res.error || "Something went wrong."); return; }
    setSubmissionText("");
    setFile(null);
    load();
  }

  async function findNextToReview() {
    setReviewError("");
    setCandidate(null);
    const headers = await authHeader();
    if (!headers) return;
    const res = await fetch(`/api/assignments/${assignmentId}/peer-review/next`, { headers }).then((r) => r.json()).catch(() => null);
    if (!res?.ok) { setReviewError(res?.error || "Could not find a submission to review."); return; }
    setCandidate(res.submission || "none");
    setReviewRating(null);
    setReviewFeedback("");
  }

  async function submitReview() {
    if (!candidate || candidate === "none" || !reviewFeedback.trim()) return;
    setReviewBusy(true);
    setReviewError("");
    const headers = await authHeader();
    if (!headers) { setReviewBusy(false); return; }

    const res = await fetch(`/api/assignments/${assignmentId}/peer-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ submissionId: candidate.submissionId, rating: reviewRating, feedback: reviewFeedback.trim() }),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: "Something went wrong." }));

    setReviewBusy(false);
    if (!res.ok) { setReviewError(res.error || "Something went wrong."); return; }
    setCandidate(null);
    setReviewRating(null);
    setReviewFeedback("");
    setPeerReviewProgress((prev) => (prev ? { ...prev, done: prev.done + 1 } : prev));
  }

  if (loading) return <p className="mt-3 text-sm text-muted-foreground">Loading assignment…</p>;
  if (error && !assignment) return <p className="mt-3 text-sm text-destructive">{error}</p>;
  if (!assignment) return null;

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-border/60 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{assignment.title}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{assignment.instructions}</p>
      </div>

      {assignment.quizId && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Part 1 - Quiz</p>
          <QuizRunner quizId={assignment.quizId} lessonId={lessonId} onComplete={() => {}} />
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {assignment.quizId ? "Part 2 - Submission" : "Your submission"}
        </p>

        {activeSubmission && (
          <div className="mt-2 rounded-lg bg-muted p-3">
            <p className="text-sm font-semibold text-foreground">
              {activeSubmission.status === "graded"
                ? activeSubmission.passed ? "✓ Graded - Passed" : "Graded - Not passed yet"
                : "Submitted - awaiting grading"}
            </p>
            {activeSubmission.status === "graded" && (
              <>
                {activeSubmission.score_percent != null && (
                  <p className="mt-1 text-sm text-muted-foreground">Score: {activeSubmission.score_percent}%</p>
                )}
                {activeSubmission.feedback && <p className="mt-1 text-sm text-muted-foreground">{activeSubmission.feedback}</p>}
              </>
            )}
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{activeSubmission.submission_text}</p>
            {activeSubmission.file_name && (
              <button
                type="button"
                onClick={() => downloadAssignmentFile(activeSubmission.id, activeSubmission.file_name || undefined)}
                className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
              >
                View my submitted file ({activeSubmission.file_name})
              </button>
            )}
            <button type="button" onClick={() => setShowForm((v) => !v)} className="mt-2 block text-xs font-semibold text-primary hover:underline">
              {showForm ? "Cancel resubmission" : "Resubmit"}
            </button>
          </div>
        )}

        {receivedReviews.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Peer feedback</p>
            {receivedReviews.map((r, i) => (
              <div key={i} className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                {r.rating != null && <span className="mr-2 text-amber-500">{"★".repeat(r.rating)}</span>}
                {r.feedback}
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="mt-3">
            <textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              maxLength={4000}
              rows={4}
              placeholder="Write your submission…"
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
            />
            {assignment.allowFileUpload && (
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-2 block text-sm text-muted-foreground"
              />
            )}
            {error && <p className="mt-2 text-sm font-semibold text-destructive">{error}</p>}
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !submissionText.trim()}
              className="mt-3 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : activeSubmission ? "Resubmit" : "Submit"}
            </button>
          </div>
        )}
      </div>

      {assignment.peerReviewEnabled && activeSubmission && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Review a peer&apos;s submission {peerReviewProgress && `- ${peerReviewProgress.done} of ${peerReviewProgress.required} course reviews done`}
          </p>

          {(!candidate || candidate === "none") && (
            <button type="button" onClick={findNextToReview} className="mt-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">
              {candidate === "none" ? "Check again" : "Find a submission to review"}
            </button>
          )}

          {candidate === "none" && <p className="mt-2 text-sm text-muted-foreground">No submissions available to review right now.</p>}

          {candidate && candidate !== "none" && (
            <div className="mt-2 rounded-lg bg-muted p-3">
              <p className="whitespace-pre-wrap text-sm text-foreground">{candidate.submissionText}</p>
              {candidate.fileAvailable && (
                <button
                  type="button"
                  onClick={() => downloadAssignmentFile(candidate.submissionId)}
                  className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
                >
                  View attached file
                </button>
              )}
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setReviewRating(n)} className="text-amber-500">
                    {reviewRating != null && n <= reviewRating ? "★" : "☆"}
                  </button>
                ))}
              </div>
              <textarea
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                maxLength={4000}
                rows={3}
                placeholder="Your feedback for this learner…"
                className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
              />
              {reviewError && <p className="mt-2 text-sm font-semibold text-destructive">{reviewError}</p>}
              <button
                type="button"
                onClick={submitReview}
                disabled={reviewBusy || !reviewFeedback.trim()}
                className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {reviewBusy ? "Submitting…" : "Submit review"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
