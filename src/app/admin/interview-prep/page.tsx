"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AdminPagination } from "@/components/admin/AdminPagination";

const PAGE_SIZE = 20;
const DIFFICULTIES = ["general", "entry", "mid", "senior"] as const;

type Question = {
  id: string;
  role_category: string;
  question: string;
  answer_tips: string;
  difficulty: (typeof DIFFICULTIES)[number];
  position: number;
  status: "draft" | "published";
};

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function InterviewPrepAdmin() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [roleCategory, setRoleCategory] = useState("");
  const [question, setQuestion] = useState("");
  const [answerTips, setAnswerTips] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("general");
  const [position, setPosition] = useState("0");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("interview_questions")
      .select("id, role_category, question, answer_tips, difficulty, position, status")
      .order("role_category")
      .order("position");
    setQuestions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter((row) => row.question.toLowerCase().includes(q) || row.role_category.toLowerCase().includes(q));
  }, [questions, search]);

  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return filtered.slice(from, from + PAGE_SIZE);
  }, [filtered, page]);

  function resetForm() {
    setEditingId(null);
    setRoleCategory(""); setQuestion(""); setAnswerTips("");
    setDifficulty("general"); setPosition("0"); setStatus("published");
  }

  function startEdit(row: Question) {
    setEditingId(row.id);
    setRoleCategory(row.role_category);
    setQuestion(row.question);
    setAnswerTips(row.answer_tips);
    setDifficulty(row.difficulty);
    setPosition(String(row.position));
    setStatus(row.status);
    setMsg(""); setErr("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setErr(""); setMsg("");
    if (!roleCategory.trim()) return setErr("Role/category is required.");
    if (!question.trim()) return setErr("Question is required.");
    if (!answerTips.trim()) return setErr("Answer tips are required.");
    setSaving(true);
    try {
      const payload = {
        role_category: roleCategory.trim(),
        question: question.trim(),
        answer_tips: answerTips.trim(),
        difficulty,
        position: Number(position) || 0,
        status,
      };
      if (editingId) {
        const { error } = await supabase.from("interview_questions").update(payload).eq("id", editingId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("interview_questions").insert(payload);
        if (error) throw new Error(error.message);
      }
      setMsg(editingId ? "Question updated." : "Question added.");
      resetForm();
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question? This can't be undone.")) return;
    await supabase.from("interview_questions").delete().eq("id", id);
    setQuestions((prev) => prev.filter((row) => row.id !== id));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Interview Prep</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The question library shown on /tools/interview-prep. Gated to Premium/Pro career access and Premium Membership - only published questions are shown there.
      </p>

      <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-border bg-card p-8">
        <h2 className="text-xl font-semibold text-foreground">{editingId ? "Edit Question" : "Add Question"}</h2>
        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Role / category *">
              <input value={roleCategory} onChange={(e) => setRoleCategory(e.target.value)} className={inputCls} placeholder="e.g. Product Management" />
            </Field>
            <Field label="Difficulty">
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as (typeof DIFFICULTIES)[number])} className={inputCls}>
                {DIFFICULTIES.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Question *">
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} className={`${inputCls} min-h-20`} placeholder="Tell me about a time..." />
          </Field>
          <Field label="Answer tips *">
            <textarea value={answerTips} onChange={(e) => setAnswerTips(e.target.value)} className={`${inputCls} min-h-24`} placeholder="What a strong answer covers..." />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Position (order within category)">
              <input type="number" value={position} onChange={(e) => setPosition(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className={inputCls}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </Field>
          </div>

          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          {msg ? <p className="text-sm text-green-700">{msg}</p> : null}

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90"
            >
              {saving ? "Saving..." : editingId ? "Update question" : "Add question"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="flex-shrink-0 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-5xl rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-foreground">All Questions</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
          />
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : paged.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{questions.length === 0 ? "No questions yet." : "No questions match your search."}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Question</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="py-2 pr-4 text-muted-foreground">{row.role_category}</td>
                    <td className="py-2 pr-4">
                      <button onClick={() => startEdit(row)} className="font-medium text-foreground hover:underline">{row.question}</button>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${row.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <button onClick={() => startEdit(row)} className="mr-3 text-xs font-semibold text-primary hover:underline">Edit</button>
                      <button onClick={() => deleteQuestion(row.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-center text-xs text-muted-foreground">{filtered.length} question{filtered.length === 1 ? "" : "s"}</p>
        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default function AdminInterviewPrepPage() {
  return <InterviewPrepAdmin />;
}
