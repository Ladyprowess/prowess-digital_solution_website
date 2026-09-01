"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { completionBanner } from "@/lib/certificates/messages";

type QuestionType = "single_choice" | "multiple_select" | "true_false" | "short_answer";
type QuizOption = { id: string; option_text: string; position: number };
type QuizQuestion = { id: string; questionType: QuestionType; questionText: string; position: number; options: QuizOption[] };
type QuizMeta = {
  id: string;
  title: string;
  description: string | null;
  quizType: "knowledge_check" | "assessment";
  passMarkPercent: number | null;
  allowRetry: boolean;
  showCorrectAnswer: "immediately" | "after_submission";
};
type ExistingAttempt = { id: string; status: "in_progress" | "submitted"; score_percent: number | null; passed: boolean | null } | null;

// isCorrect/explanation are only present when the server chose to reveal
// them (knowledge check, or show_correct_answer='immediately') - see
// answers/route.ts. selectedOptionIds/typedAnswer are what THIS client
// submitted, kept locally so navigating back to an already-answered
// question (assessment's Previous button) can still show what was picked,
// even though the question card remounts fresh each time it's shown.
type AnswerResult = {
  locked: true;
  isCorrect?: boolean;
  explanation?: string | null;
  selectedOptionIds: string[] | null;
  typedAnswer: string | null;
};

type SubmitResult = {
  scorePercent: number;
  passed: boolean | null;
  lessonCompleted: boolean;
  answers: { questionId: string; isCorrect: boolean; explanation: string | null }[];
  newlyCompleted: boolean;
  certificateIssued: boolean;
  certificateBlockedReason: "missing_profile_name" | null;
};

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : null;
}

function QuestionCard({
  question,
  result,
  onAnswer,
}: {
  question: QuizQuestion;
  result: AnswerResult | null;
  onAnswer: (selectedOptionIds: string[] | null, typedAnswer: string | null) => void;
}) {
  const [selected, setSelected] = useState<string[]>(result?.selectedOptionIds || []);
  const [typed, setTyped] = useState(result?.typedAnswer || "");
  const locked = Boolean(result?.locked);

  function toggleOption(id: string) {
    if (locked) return;
    if (question.questionType === "multiple_select") {
      setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    } else {
      setSelected([id]);
    }
  }

  function submit() {
    if (question.questionType === "short_answer") {
      if (!typed.trim()) return;
      onAnswer(null, typed);
    } else {
      if (selected.length === 0) return;
      onAnswer(selected, null);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">{question.questionText}</p>
      <div className="mt-3 space-y-2">
        {question.questionType === "short_answer" ? (
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={locked}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-70"
            placeholder="Type your answer"
          />
        ) : (
          question.options.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type={question.questionType === "multiple_select" ? "checkbox" : "radio"}
                name={`q-${question.id}`}
                checked={selected.includes(opt.id)}
                disabled={locked}
                onChange={() => toggleOption(opt.id)}
              />
              {opt.option_text}
            </label>
          ))
        )}
      </div>
      {!locked ? (
        <button type="button" onClick={submit} className="mt-3 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
          Check answer
        </button>
      ) : result?.isCorrect !== undefined ? (
        <div className={`mt-3 rounded-lg p-3 text-sm ${result.isCorrect ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
          <p className="font-bold">{result.isCorrect ? "✓ Correct" : "✕ Not quite"}</p>
          {result.explanation && <p className="mt-1 text-foreground/80">{result.explanation}</p>}
        </div>
      ) : (
        <p className="mt-3 text-xs font-semibold text-muted-foreground">Answer locked in.</p>
      )}
    </div>
  );
}

export function QuizRunner({ quizId, onComplete }: { quizId: string; lessonId: string; onComplete: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quiz, setQuiz] = useState<QuizMeta | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [started, setStarted] = useState(false); // assessment only: has "Start Quiz" been clicked
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredResults, setAnsweredResults] = useState<Map<string, AnswerResult>>(new Map());
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const headers = await authHeader();
    const res = await fetch(`/api/quizzes/${quizId}`, { headers: headers || {} }).then((r) => r.json()).catch(() => null);
    if (!res?.ok) {
      setError(res?.error || "Could not load this quiz.");
      setLoading(false);
      return;
    }
    setQuiz(res.quiz);
    setQuestions(res.questions);
    const existing: ExistingAttempt = res.existingAttempt;
    if (existing?.status === "in_progress") {
      setAttemptId(existing.id);
      setStarted(true);
    }
    setLoading(false);
  }, [quizId]);

  useEffect(() => { load(); }, [load]);

  // Needed for both flavors before the first answer can be submitted - no
  // attempt is ever created just by opening the page (see access route
  // review comments this component satisfies).
  async function ensureAttempt(): Promise<string | null> {
    if (attemptId) return attemptId;
    const headers = await authHeader();
    if (!headers) { setError("Please sign in to continue."); return null; }
    const res = await fetch(`/api/quizzes/${quizId}/attempts`, { method: "POST", headers }).then((r) => r.json()).catch(() => null);
    if (!res?.ok) { setError(res?.error || "Could not start this quiz."); return null; }
    setAttemptId(res.attempt.id);
    return res.attempt.id;
  }

  async function answerQuestion(question: QuizQuestion, selectedOptionIds: string[] | null, typedAnswer: string | null) {
    setError("");
    const id = await ensureAttempt();
    if (!id) return;
    const headers = await authHeader();
    if (!headers) return;

    const res = await fetch(`/api/quizzes/${quizId}/attempts/${id}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ questionId: question.id, selectedOptionIds, typedAnswer }),
    }).then((r) => r.json()).catch(() => null);

    if (!res?.ok) {
      setError(res?.error || "Could not submit that answer.");
      return;
    }

    const nextResults = new Map(answeredResults).set(question.id, {
      locked: true,
      isCorrect: res.isCorrect,
      explanation: res.explanation,
      selectedOptionIds,
      typedAnswer,
    });
    setAnsweredResults(nextResults);

    // Knowledge checks have no "Submit Quiz" ceremony - once every question
    // is answered, finalize silently.
    if (quiz?.quizType === "knowledge_check" && nextResults.size === questions.length) {
      await submitAttempt(id);
    }
  }

  async function submitAttempt(id: string) {
    setError("");
    const headers = await authHeader();
    if (!headers) return;
    const res = await fetch(`/api/quizzes/${quizId}/attempts/${id}/submit`, { method: "POST", headers }).then((r) => r.json()).catch(() => null);
    if (!res?.ok) {
      setError(res?.error || "Could not submit this quiz.");
      return;
    }
    setSubmitResult(res);
    if (res.lessonCompleted) onComplete();
  }

  async function handleStart() {
    setError("");
    const id = await ensureAttempt();
    if (id) setStarted(true);
  }

  async function handleTryAgain() {
    setError("");
    setSubmitResult(null);
    setAnsweredResults(new Map());
    setCurrentIndex(0);
    setReviewOpen(false);
    setAttemptId(null);
    const headers = await authHeader();
    if (!headers) return;
    // The prior attempt is now status='submitted', so this correctly
    // creates a fresh attempt rather than resuming the failed one.
    const res = await fetch(`/api/quizzes/${quizId}/attempts`, { method: "POST", headers }).then((r) => r.json()).catch(() => null);
    if (res?.ok) {
      setAttemptId(res.attempt.id);
      setStarted(true);
    }
  }

  if (loading) return <p className="mt-3 text-sm text-muted-foreground">Loading quiz…</p>;
  if (error && !quiz) return <p className="mt-3 text-sm text-destructive">{error}</p>;
  if (!quiz) return null;

  if (quiz.quizType === "knowledge_check") {
    const kcBanner = submitResult ? completionBanner(submitResult) : null;
    return (
      <div className="mt-3 space-y-4 rounded-xl border border-border/60 p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{quiz.title}</p>
          {quiz.description && <p className="mt-0.5 text-sm text-muted-foreground">{quiz.description}</p>}
        </div>
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              result={answeredResults.get(q.id) || null}
              onAnswer={(selectedOptionIds, typedAnswer) => answerQuestion(q, selectedOptionIds, typedAnswer)}
            />
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {submitResult && <p className="text-sm font-semibold text-primary">✓ You&rsquo;ve completed this knowledge check.</p>}
        {kcBanner && (
          <p className="text-sm font-semibold text-foreground">
            {kcBanner.text}
            {kcBanner.type === "certificate" && (
              <a href="/account/certificates" className="ml-2 text-primary hover:underline">View certificates →</a>
            )}
          </p>
        )}
      </div>
    );
  }

  // assessment
  if (submitResult) {
    const assessmentBanner = completionBanner(submitResult);
    return (
      <div className="mt-3 rounded-xl border border-border/60 p-4">
        <p className="text-lg font-bold text-foreground">You scored {submitResult.scorePercent}%</p>
        {submitResult.passed !== null && (
          <p className={`mt-1 text-sm font-semibold ${submitResult.passed ? "text-primary" : "text-destructive"}`}>
            {submitResult.passed ? "✓ Passed" : `Not quite - you need ${quiz.passMarkPercent}% to pass.`}
          </p>
        )}
        {assessmentBanner && (
          <p className="mt-2 text-sm font-semibold text-foreground">
            {assessmentBanner.text}
            {assessmentBanner.type === "certificate" && (
              <a href="/account/certificates" className="ml-2 text-primary hover:underline">View certificates →</a>
            )}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={() => setReviewOpen((v) => !v)} className="text-sm font-semibold text-primary hover:underline">
            {reviewOpen ? "Hide answers" : "Review answers"}
          </button>
          {submitResult.passed === false && quiz.allowRetry && (
            <button type="button" onClick={handleTryAgain} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Try again
            </button>
          )}
        </div>
        {reviewOpen && (
          <div className="mt-4 space-y-3">
            {questions.map((q) => {
              const answer = submitResult.answers.find((a) => a.questionId === q.id);
              return (
                <div key={q.id} className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-semibold text-foreground">{q.questionText}</p>
                  <p className={`mt-1 text-xs font-bold uppercase ${answer?.isCorrect ? "text-primary" : "text-destructive"}`}>
                    {answer?.isCorrect ? "Correct" : "Incorrect"}
                  </p>
                  {answer?.explanation && <p className="mt-1 text-sm text-muted-foreground">{answer.explanation}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mt-3 rounded-xl border border-border/60 p-4 text-center">
        <p className="text-sm font-semibold text-foreground">{quiz.title}</p>
        {quiz.description && <p className="mt-1 text-sm text-muted-foreground">{quiz.description}</p>}
        <p className="mt-2 text-xs text-muted-foreground">{questions.length} question{questions.length === 1 ? "" : "s"}</p>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <button type="button" onClick={handleStart} className="mt-3 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          {attemptId ? "Continue Quiz" : "Start Quiz"}
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentResult = answeredResults.get(currentQuestion.id) || null;
  const allAnswered = questions.every((q) => answeredResults.has(q.id));

  return (
    <div className="mt-3 rounded-xl border border-border/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Question {currentIndex + 1} of {questions.length}</p>
      <div className="mt-3">
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          result={currentResult}
          onAnswer={(selectedOptionIds, typedAnswer) => answerQuestion(currentQuestion, selectedOptionIds, typedAnswer)}
        />
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={() => attemptId && submitAttempt(attemptId)}
            disabled={!allAnswered}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
