"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ClipboardCheck, Download, FileText, Loader2, MessageSquareText, RefreshCw, Send, Star, UploadCloud } from "lucide-react";
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

function StatusBadge({ submission }: { submission: ActiveSubmission }) {
  if (submission.status !== "graded") {
    return <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">Awaiting review</span>;
  }
  return submission.passed
    ? <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Passed</span>
    : <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">Needs work</span>;
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

  if (loading) {
    return (
      <div className="mt-4 rounded-lg border border-border bg-card p-5" aria-busy="true">
        <div className="flex items-center gap-3">
          <Loader2 size={18} className="animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">Loading assignment</p>
        </div>
        <div className="mt-5 space-y-3">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-5/6 rounded bg-muted" />
        </div>
      </div>
    );
  }
  if (error && !assignment) {
    return (
      <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-5">
        <p className="text-sm font-semibold text-destructive">Could not load this assignment</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <RefreshCw size={15} aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }
  if (!assignment) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border bg-muted/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <ClipboardCheck size={14} aria-hidden="true" />
              Assignment
            </div>
            <h3 className="mt-3 text-lg font-bold text-foreground">{assignment.title}</h3>
            <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{assignment.instructions}</p>
          </div>
          {activeSubmission && <StatusBadge submission={activeSubmission} />}
        </div>
      </div>

      <div className="space-y-6 p-5">
        {assignment.quizId && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 size={17} className="text-primary" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Part 1 - Quiz</p>
            </div>
            <QuizRunner quizId={assignment.quizId} lessonId={lessonId} onComplete={() => {}} />
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center gap-2">
            <FileText size={17} className="text-primary" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {assignment.quizId ? "Part 2 - Written submission" : "Written submission"}
            </p>
          </div>

          {activeSubmission && (
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {activeSubmission.status === "graded"
                      ? activeSubmission.passed ? "Submission passed" : "Submission needs another attempt"
                      : "Submitted and waiting for admin review"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Submitted {new Date(activeSubmission.submitted_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
                <StatusBadge submission={activeSubmission} />
              </div>

              {activeSubmission.status === "graded" && (
                <div className="mt-4 rounded-lg bg-muted p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Admin feedback</p>
                  {activeSubmission.score_percent != null && (
                    <p className="mt-2 text-sm font-semibold text-foreground">Score: {activeSubmission.score_percent}%</p>
                  )}
                  {activeSubmission.feedback && <p className="mt-1 text-sm leading-6 text-muted-foreground">{activeSubmission.feedback}</p>}
                </div>
              )}

              <div className="mt-4 rounded-lg border border-border bg-card p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your answer</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{activeSubmission.submission_text}</p>
                {activeSubmission.file_name && (
                  <button
                    type="button"
                    onClick={() => downloadAssignmentFile(activeSubmission.id, activeSubmission.file_name || undefined)}
                    className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Download size={15} aria-hidden="true" />
                    Download file
                  </button>
                )}
                {activeSubmission.file_name && <p className="mt-2 text-xs text-muted-foreground">{activeSubmission.file_name}</p>}
              </div>

              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {showForm ? "Cancel resubmission" : "Submit a new version"}
              </button>
            </div>
          )}

          {receivedReviews.length > 0 && (
            <div className="mt-4 space-y-3 rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-2">
                <MessageSquareText size={17} className="text-primary" aria-hidden="true" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Peer feedback received</p>
              </div>
              {receivedReviews.map((r, i) => (
                <div key={i} className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    {r.rating != null ? (
                      <span className="flex items-center gap-0.5 text-primary" aria-label={`${r.rating} out of 5`}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} size={14} fill={index < r.rating! ? "currentColor" : "none"} aria-hidden="true" />
                        ))}
                      </span>
                    ) : <span />}
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="leading-6">{r.feedback}</p>
                </div>
              ))}
            </div>
          )}

          {showForm && (
            <div className={activeSubmission ? "mt-4 rounded-lg border border-border bg-muted/30 p-4" : "rounded-lg border border-border bg-background p-4"}>
              <label htmlFor={`assignment-submission-${assignment.id}`} className="text-sm font-semibold text-foreground">
                {activeSubmission ? "New submission" : "Your answer"}
              </label>
              <textarea
                id={`assignment-submission-${assignment.id}`}
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                maxLength={4000}
                rows={6}
                placeholder="Write your response here. Include the details the admin needs to review your work."
                className="mt-2 w-full rounded-lg border border-border bg-card p-3 text-sm leading-6 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">{submissionText.length}/4000 characters</p>
                {assignment.allowFileUpload && (
                  <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <UploadCloud size={15} aria-hidden="true" />
                    {file ? file.name : "Attach file"}
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>
              {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
              <button
                type="button"
                onClick={submit}
                disabled={submitting || !submissionText.trim()}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Send size={15} aria-hidden="true" />
                {submitting ? "Submitting..." : activeSubmission ? "Resubmit work" : "Submit work"}
              </button>
            </div>
          )}
        </section>

        {assignment.peerReviewEnabled && activeSubmission && (
          <section className="rounded-lg border border-border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquareText size={17} className="text-primary" aria-hidden="true" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Peer review</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Review another learner&apos;s work anonymously. This helps everyone improve before final grading.
                </p>
              </div>
              {peerReviewProgress && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                  {peerReviewProgress.done} of {peerReviewProgress.required} done
                </span>
              )}
            </div>

            {(!candidate || candidate === "none") && (
              <button
                type="button"
                onClick={findNextToReview}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <RefreshCw size={15} aria-hidden="true" />
                {candidate === "none" ? "Check again" : "Find work to review"}
              </button>
            )}

            {candidate === "none" && (
              <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">No peer submissions available right now.</p>
                <p className="mt-1 text-sm text-muted-foreground">Try again later after more learners submit their work.</p>
              </div>
            )}

            {candidate && candidate !== "none" && (
              <div className="mt-4 rounded-lg border border-border bg-card p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Submission to review</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{candidate.submissionText}</p>
                {candidate.fileAvailable && (
                  <button
                    type="button"
                    onClick={() => downloadAssignmentFile(candidate.submissionId)}
                    className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Download size={15} aria-hidden="true" />
                    Download attached file
                  </button>
                )}
                <div className="mt-4">
                  <p className="text-sm font-semibold text-foreground">Rating</p>
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setReviewRating(n)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        aria-label={`Rate ${n} out of 5`}
                      >
                        <Star size={19} fill={reviewRating != null && n <= reviewRating ? "currentColor" : "none"} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
                <label htmlFor={`peer-feedback-${assignment.id}`} className="mt-4 block text-sm font-semibold text-foreground">Feedback</label>
                <textarea
                  id={`peer-feedback-${assignment.id}`}
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  maxLength={4000}
                  rows={4}
                  placeholder="Write practical feedback this learner can use to improve."
                  className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm leading-6 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                {reviewError && <p className="mt-3 text-sm font-semibold text-destructive">{reviewError}</p>}
                <button
                  type="button"
                  onClick={submitReview}
                  disabled={reviewBusy || !reviewFeedback.trim()}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Send size={15} aria-hidden="true" />
                  {reviewBusy ? "Submitting..." : "Submit peer review"}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
