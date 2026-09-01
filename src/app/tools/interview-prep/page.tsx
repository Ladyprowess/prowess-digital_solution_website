"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LockKeyhole, MessagesSquare } from "lucide-react";
import Container from "@/components/Container";
import { supabase } from "@/lib/supabase";
import { useMemberSession } from "@/lib/useMemberSession";
import { PillTabs, type PillTab } from "@/components/PillTabs";

type Question = {
  id: string;
  role_category: string;
  question: string;
  answer_tips: string;
  difficulty: string;
};

export default function InterviewPrepPage() {
  const { status } = useMemberSession();
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [category, setCategory] = useState<string>("");

  useEffect(() => {
    if (status !== "ready") return;
    (async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setLoading(false); return; }

      const res = await fetch("/api/interview-prep", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((r) => r.json()).catch(() => null);

      if (!res?.ok) {
        setLocked(true);
        setLoading(false);
        return;
      }
      setQuestions(res.questions || []);
      setLoading(false);
    })();
  }, [status]);

  const categories = useMemo(() => {
    const set = new Set(questions.map((q) => q.role_category));
    return Array.from(set);
  }, [questions]);

  const tabs: PillTab<string>[] = [{ value: "", label: "All" }, ...categories.map((c) => ({ value: c, label: c }))];
  const visible = category ? questions.filter((q) => q.role_category === category) : questions;

  if (status === "loading" || loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><p className="text-sm text-muted-foreground">Loading…</p></div>;
  }
  if (status === "signed-out") return null;

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-muted py-14 sm:py-16">
        <Container>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <MessagesSquare className="h-3.5 w-3.5" aria-hidden="true" />
            Interview Prep
          </div>
          <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Practice questions, with guidance on how to answer.</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Real interview questions grouped by role, with tips on what a strong answer covers.</p>
        </Container>
      </section>

      <section className="py-12 sm:py-14">
        <Container>
          {locked ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
              <LockKeyhole className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-foreground">Interview Prep is part of Premium and Pro career access.</p>
              <p className="mt-1 text-sm text-muted-foreground">Upgrade to unlock the full question library.</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Link href="/tools#career" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                  See career plans
                </Link>
                <Link href="/account/membership" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted">
                  Or use Premium Membership
                </Link>
              </div>
            </div>
          ) : questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Questions are being added. Check back soon.</p>
          ) : (
            <>
              <PillTabs tabs={tabs} active={category} onChange={setCategory} />
              <div className="mt-6 space-y-4">
                {visible.map((q) => (
                  <div key={q.id} className="rounded-lg border border-border bg-card p-6">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase text-muted-foreground">{q.role_category}</span>
                    <p className="mt-3 text-base font-bold text-foreground">{q.question}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{q.answer_tips}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Container>
      </section>
    </main>
  );
}
