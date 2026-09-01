"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type QuestionType = "single_choice" | "multiple_select" | "true_false" | "short_answer";
const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "single_choice", label: "Single choice" },
  { value: "multiple_select", label: "Multiple select" },
  { value: "true_false", label: "True / False" },
  { value: "short_answer", label: "Short answer" },
];

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  quiz_type: "knowledge_check" | "assessment";
  pass_mark_percent: number | null;
  allow_retry: boolean;
  show_correct_answer: "immediately" | "after_submission";
  randomize_questions: boolean;
  randomize_options: boolean;
  required_to_continue: boolean;
  status: "draft" | "published";
};

type Option = { id: string; option_text: string; is_correct: boolean; position: number };
type Question = {
  id: string;
  question_type: QuestionType;
  question_text: string;
  explanation: string | null;
  accepted_answers: string[] | null;
  case_sensitive: boolean;
  position: number;
  options: Option[];
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

function emptyOptions(): { text: string; isCorrect: boolean }[] {
  return [{ text: "", isCorrect: false }, { text: "", isCorrect: false }];
}

function QuizSettingsForm({ quiz, courseId, onSaved }: { quiz: Quiz; courseId: string; onSaved: () => void }) {
  const [title, setTitle] = useState(quiz.title);
  const [description, setDescription] = useState(quiz.description || "");
  const [quizType, setQuizType] = useState(quiz.quiz_type);
  const [passMark, setPassMark] = useState(quiz.pass_mark_percent != null ? String(quiz.pass_mark_percent) : "");
  const [allowRetry, setAllowRetry] = useState(quiz.allow_retry);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(quiz.show_correct_answer);
  const [randomizeQuestions, setRandomizeQuestions] = useState(quiz.randomize_questions);
  const [randomizeOptions, setRandomizeOptions] = useState(quiz.randomize_options);
  const [requiredToContinue, setRequiredToContinue] = useState(quiz.required_to_continue);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function save() {
    setErr(""); setMsg("");
    if (!title.trim()) return setErr("Title is required.");
    if (passMark.trim() && (Number(passMark) < 0 || Number(passMark) > 100)) return setErr("Pass mark must be between 0 and 100.");

    const { error } = await supabase.from("quizzes").update({
      title: title.trim(),
      description: description.trim() || null,
      quiz_type: quizType,
      pass_mark_percent: passMark.trim() ? Number(passMark) : null,
      allow_retry: allowRetry,
      show_correct_answer: showCorrectAnswer,
      randomize_questions: randomizeQuestions,
      randomize_options: randomizeOptions,
      required_to_continue: requiredToContinue,
    }).eq("id", quiz.id);

    if (error) return setErr(error.message);
    setMsg("Saved");
    onSaved();
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Quiz settings</h2>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${quiz.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {quiz.status}
        </span>
      </div>
      <div className="mt-4 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Quiz type">
            <select value={quizType} onChange={(e) => setQuizType(e.target.value as Quiz["quiz_type"])} className={inputCls}>
              <option value="knowledge_check">Knowledge Check</option>
              <option value="assessment">Assessment</option>
            </select>
          </Field>
        </div>
        <Field label="Description (optional)">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
        </Field>
        {quizType === "assessment" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pass mark % (optional)">
              <input type="number" min="0" max="100" value={passMark} onChange={(e) => setPassMark(e.target.value)} className={inputCls} placeholder="e.g. 70" />
            </Field>
            <Field label="Show correct answer">
              <select value={showCorrectAnswer} onChange={(e) => setShowCorrectAnswer(e.target.value as Quiz["show_correct_answer"])} className={inputCls}>
                <option value="immediately">Immediately, per question</option>
                <option value="after_submission">Only after submitting</option>
              </select>
            </Field>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={allowRetry} onChange={(e) => setAllowRetry(e.target.checked)} />
          Allow retry
        </label>

        <div className="rounded-xl bg-muted p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Not yet enforced (settings only)</p>
          <div className="mt-2 grid gap-2">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={randomizeQuestions} onChange={(e) => setRandomizeQuestions(e.target.checked)} />
              Randomize question order
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={randomizeOptions} onChange={(e) => setRandomizeOptions(e.target.checked)} />
              Randomize option order
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={requiredToContinue} onChange={(e) => setRequiredToContinue(e.target.checked)} />
              Required to continue the course
            </label>
          </div>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        <button type="button" onClick={save} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
          Save settings
        </button>
      </div>
      <Link href={`/admin/learn/${courseId}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">&larr; Back to course</Link>
    </div>
  );
}

function QuestionBuilder({ quizId, questions, onChange }: { quizId: string; questions: Question[]; onChange: () => void }) {
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType>("single_choice");
  const [questionText, setQuestionText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState(emptyOptions());
  const [acceptedAnswers, setAcceptedAnswers] = useState<string[]>([""]);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [err, setErr] = useState("");

  function resetForm() {
    setEditingQuestionId(null);
    setQuestionType("single_choice");
    setQuestionText("");
    setExplanation("");
    setOptions(emptyOptions());
    setAcceptedAnswers([""]);
    setCaseSensitive(false);
    setErr("");
  }

  function startEdit(q: Question) {
    setErr("");
    setEditingQuestionId(q.id);
    setQuestionType(q.question_type);
    setQuestionText(q.question_text);
    setExplanation(q.explanation || "");
    if (q.question_type === "short_answer") {
      setAcceptedAnswers(q.accepted_answers && q.accepted_answers.length > 0 ? q.accepted_answers : [""]);
      setCaseSensitive(q.case_sensitive);
    } else {
      setOptions(q.options.length > 0 ? q.options.map((o) => ({ text: o.option_text, isCorrect: o.is_correct })) : emptyOptions());
    }
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function handleTypeChange(type: QuestionType) {
    setQuestionType(type);
    if (type === "true_false") {
      setOptions([{ text: "True", isCorrect: false }, { text: "False", isCorrect: false }]);
    } else if (type !== "short_answer" && options.length < 2) {
      setOptions(emptyOptions());
    }
  }

  function addOption() { setOptions((prev) => [...prev, { text: "", isCorrect: false }]); }
  function updateOptionText(i: number, text: string) { setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, text } : o))); }
  function removeOption(i: number) { setOptions((prev) => prev.filter((_, idx) => idx !== i)); }
  function setSingleCorrect(i: number) { setOptions((prev) => prev.map((o, idx) => ({ ...o, isCorrect: idx === i }))); }
  function toggleMultiCorrect(i: number) { setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, isCorrect: !o.isCorrect } : o))); }

  function addAcceptedAnswer() { setAcceptedAnswers((prev) => [...prev, ""]); }
  function updateAcceptedAnswer(i: number, v: string) { setAcceptedAnswers((prev) => prev.map((a, idx) => (idx === i ? v : a))); }
  function removeAcceptedAnswer(i: number) { setAcceptedAnswers((prev) => prev.filter((_, idx) => idx !== i)); }

  async function saveQuestion() {
    setErr("");
    if (!questionText.trim()) return setErr("Question text is required.");

    const filledOptions = options.filter((o) => o.text.trim());
    const filledAnswers = acceptedAnswers.map((a) => a.trim()).filter(Boolean);

    if (questionType === "short_answer") {
      if (filledAnswers.length < 1) return setErr("Add at least one accepted answer.");
    } else {
      if (filledOptions.length < 2) return setErr("Add at least 2 options.");
      const correctCount = filledOptions.filter((o) => o.isCorrect).length;
      if ((questionType === "single_choice" || questionType === "true_false") && correctCount !== 1) {
        return setErr("Mark exactly one option as correct.");
      }
      if (questionType === "multiple_select" && correctCount < 1) {
        return setErr("Mark at least one option as correct.");
      }
    }

    const payload = {
      question_type: questionType,
      question_text: questionText.trim(),
      explanation: explanation.trim() || null,
      accepted_answers: questionType === "short_answer" ? filledAnswers : null,
      case_sensitive: questionType === "short_answer" ? caseSensitive : false,
    };

    let questionId = editingQuestionId;
    if (editingQuestionId) {
      const { error } = await supabase.from("quiz_questions").update(payload).eq("id", editingQuestionId);
      if (error) return setErr(error.message);
      // Simplest correctness-preserving approach: replace all options
      // rather than diffing which changed.
      await supabase.from("quiz_options").delete().eq("question_id", editingQuestionId);
    } else {
      const { data, error } = await supabase
        .from("quiz_questions")
        .insert({ ...payload, quiz_id: quizId, position: questions.length })
        .select("id")
        .single();
      if (error) return setErr(error.message);
      questionId = data.id;
    }

    if (questionType !== "short_answer" && questionId) {
      const rows = filledOptions.map((o, i) => ({ question_id: questionId, option_text: o.text.trim(), is_correct: o.isCorrect, position: i }));
      const { error: optErr } = await supabase.from("quiz_options").insert(rows);
      if (optErr) return setErr(optErr.message);
    }

    resetForm();
    onChange();
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    await supabase.from("quiz_questions").delete().eq("id", id);
    if (editingQuestionId === id) resetForm();
    onChange();
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-bold text-foreground">Questions</h2>

      {questions.length > 0 && (
        <ul className="mt-4 space-y-2">
          {questions.map((q, i) => (
            <li key={q.id} className="rounded-xl border border-border/60 px-4 py-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {i + 1}. {QUESTION_TYPES.find((t) => t.value === q.question_type)?.label}
                  </span>
                  <p className="mt-0.5 font-medium text-foreground">{q.question_text}</p>
                </div>
                <span className="flex-shrink-0 whitespace-nowrap">
                  <button onClick={() => startEdit(q)} className="mr-3 text-xs font-semibold text-primary hover:underline">Edit</button>
                  <button onClick={() => deleteQuestion(q.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid gap-3 rounded-xl bg-muted p-4">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground">{editingQuestionId ? "EDIT QUESTION" : "ADD QUESTION"}</p>

        <Field label="Question type">
          <select value={questionType} onChange={(e) => handleTypeChange(e.target.value as QuestionType)} className={inputCls}>
            {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>

        <Field label="Question">
          <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={2} className={inputCls} placeholder="Which of these is an organic marketing channel?" />
        </Field>

        <Field label="Explanation (optional, shown after answering)">
          <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} className={inputCls} />
        </Field>

        {questionType === "short_answer" ? (
          <>
            <div>
              <p className="text-xs font-semibold tracking-widest text-muted-foreground">ACCEPTED ANSWERS</p>
              <div className="mt-1.5 space-y-2">
                {acceptedAnswers.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={a} onChange={(e) => updateAcceptedAnswer(i, e.target.value)} className={inputCls} placeholder="e.g. SEO" />
                    <button type="button" onClick={() => removeAcceptedAnswer(i)} className="flex-shrink-0 text-xs font-semibold text-destructive hover:underline">Remove</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addAcceptedAnswer} className="mt-2 text-xs font-semibold text-primary hover:underline">Add accepted answer</button>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
              Case sensitive
            </label>
          </>
        ) : (
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground">OPTIONS</p>
            <div className="mt-1.5 space-y-2">
              {options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type={questionType === "multiple_select" ? "checkbox" : "radio"}
                    name="correct-option"
                    checked={o.isCorrect}
                    onChange={() => (questionType === "multiple_select" ? toggleMultiCorrect(i) : setSingleCorrect(i))}
                    className="flex-shrink-0"
                  />
                  <input
                    value={o.text}
                    onChange={(e) => updateOptionText(i, e.target.value)}
                    className={inputCls}
                    placeholder={questionType === "true_false" ? undefined : "Option text"}
                    disabled={questionType === "true_false"}
                  />
                  {questionType !== "true_false" && (
                    <button type="button" onClick={() => removeOption(i)} className="flex-shrink-0 text-xs font-semibold text-destructive hover:underline">Remove</button>
                  )}
                </div>
              ))}
            </div>
            {questionType !== "true_false" && (
              <button type="button" onClick={addOption} className="mt-2 text-xs font-semibold text-primary hover:underline">Add option</button>
            )}
          </div>
        )}

        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={saveQuestion} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {editingQuestionId ? "Update question" : "Add question"}
          </button>
          {editingQuestionId && (
            <button type="button" onClick={resetForm} className="flex-shrink-0 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuizManageAdmin({ courseId, quizId }: { courseId: string; quizId: string }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishErrors, setPublishErrors] = useState<string[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: quizRow }, { data: questionRows }] = await Promise.all([
      supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle(),
      supabase
        .from("quiz_questions")
        .select("id, question_type, question_text, explanation, accepted_answers, case_sensitive, position")
        .eq("quiz_id", quizId)
        .order("position"),
    ]);
    setQuiz(quizRow || null);

    const questionIds = (questionRows || []).map((q) => q.id);
    const { data: optionRows } = questionIds.length
      ? await supabase.from("quiz_options").select("id, question_id, option_text, is_correct, position").in("question_id", questionIds).order("position")
      : { data: [] };

    const optionsByQuestion = new Map<string, Option[]>();
    for (const o of optionRows || []) {
      const list = optionsByQuestion.get(o.question_id) || [];
      list.push({ id: o.id, option_text: o.option_text, is_correct: o.is_correct, position: o.position });
      optionsByQuestion.set(o.question_id, list);
    }

    setQuestions((questionRows || []).map((q) => ({ ...q, options: optionsByQuestion.get(q.id) || [] })));
    setLoading(false);
  }, [quizId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function publish() {
    if (!quiz) return;
    const errors: string[] = [];
    if (questions.length === 0) errors.push("Add at least one question.");
    for (const q of questions) {
      if (q.question_type === "single_choice" || q.question_type === "true_false") {
        if (q.options.filter((o) => o.is_correct).length !== 1) errors.push(`"${q.question_text}" needs exactly one correct option.`);
      } else if (q.question_type === "multiple_select") {
        if (q.options.filter((o) => o.is_correct).length < 1) errors.push(`"${q.question_text}" needs at least one correct option.`);
      } else if (q.question_type === "short_answer") {
        if (!q.accepted_answers || q.accepted_answers.length === 0) errors.push(`"${q.question_text}" needs at least one accepted answer.`);
      }
    }
    if (quiz.quiz_type === "assessment" && quiz.pass_mark_percent != null && (quiz.pass_mark_percent < 0 || quiz.pass_mark_percent > 100)) {
      errors.push("Pass mark must be between 0 and 100.");
    }
    if (errors.length > 0) { setPublishErrors(errors); return; }

    const { error } = await supabase.from("quizzes").update({ status: "published" }).eq("id", quizId);
    if (error) { setPublishErrors([error.message]); return; }
    setPublishErrors([]);
    loadAll();
  }

  async function unpublish() {
    await supabase.from("quizzes").update({ status: "draft" }).eq("id", quizId);
    loadAll();
  }

  if (loading) return <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>;
  if (!quiz) return <p className="py-16 text-center text-sm text-muted-foreground">Quiz not found.</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-foreground">{quiz.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage this quiz&rsquo;s settings and questions.</p>

      <div className="mt-6">
        <QuizSettingsForm quiz={quiz} courseId={courseId} onSaved={loadAll} />
      </div>

      <QuestionBuilder quizId={quizId} questions={questions} onChange={loadAll} />

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        {publishErrors.length > 0 && (
          <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-red-600">
            {publishErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )}
        {quiz.status === "published" ? (
          <button type="button" onClick={unpublish} className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
            Unpublish (move back to draft)
          </button>
        ) : (
          <button type="button" onClick={publish} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Publish quiz
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminQuizManagePage({ params }: { params: Promise<{ id: string; quizId: string }> }) {
  const { id, quizId } = use(params);
  return <QuizManageAdmin courseId={id} quizId={quizId} />;
}
