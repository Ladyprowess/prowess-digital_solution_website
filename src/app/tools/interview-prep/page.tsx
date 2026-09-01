"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ListChecks,
  LockKeyhole,
  Mic,
  MessagesSquare,
  Search,
  Send,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import Container from "@/components/Container";
import { supabase } from "@/lib/supabase";
import { useMemberSession } from "@/lib/useMemberSession";
import { PillTabs, type PillTab } from "@/components/PillTabs";
import { GUIDE_STAGES, INTERVIEW_PREP_GUIDE, type GuideBlock, type GuideStageKey, type GuideSubsection } from "@/content/interviewPrepGuide";

type Question = {
  id: string;
  role_category: string;
  question: string;
  answer_tips: string;
  difficulty: string;
};

const STAGE_ICON: Record<GuideStageKey, LucideIcon> = { before: Search, during: Mic, after: Send };

const GUIDE_INTRO = INTERVIEW_PREP_GUIDE.find((s) => s.id === "why-it-matters")!;
const GUIDE_CHECKLIST = INTERVIEW_PREP_GUIDE.find((s) => s.id === "checklist")!;
const GUIDE_MINDSET = INTERVIEW_PREP_GUIDE.find((s) => s.id === "mindset")!;
const GUIDE_STAGE_SECTIONS = INTERVIEW_PREP_GUIDE.filter((s) => s.stage);

function bulletItems(blocks: GuideBlock[]): string[] {
  const block = blocks.find((b): b is Extract<GuideBlock, { type: "bullets" }> => b.type === "bullets");
  return block?.items || [];
}

function firstParagraph(blocks: GuideBlock[]): string | undefined {
  const block = blocks.find((b): b is Extract<GuideBlock, { type: "paragraph" }> => b.type === "paragraph");
  return block?.text;
}

function GuideBlockView({ block }: { block: GuideBlock }) {
  if (block.type === "paragraph") {
    return <p className="text-sm leading-6 text-muted-foreground">{block.text}</p>;
  }
  if (block.type === "bullets") {
    return (
      <ul className="space-y-1.5">
        {block.items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
            <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="rounded-lg border border-primary/15 bg-primary/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-primary">&ldquo;{block.question}&rdquo;</p>
      <p className="mt-2 text-sm leading-6 text-foreground/80">{block.answer}</p>
    </div>
  );
}

function StageTracker() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {GUIDE_STAGES.map((stage, i) => {
        const Icon = STAGE_ICON[stage.key];
        return (
          <a
            key={stage.key}
            href={`#${stage.key}`}
            className="group rounded-lg border border-border bg-card p-4 transition hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{i + 1}</span>
              <Icon className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-bold text-foreground">{stage.label}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{stage.description}</p>
          </a>
        );
      })}
    </div>
  );
}

function GuideSubsectionCard({ number, heading, blocks }: GuideSubsection) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      {heading && (
        <div className="flex items-center gap-2.5">
          {number && (
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{number}</span>
          )}
          <h3 className="text-sm font-bold text-foreground">{heading}</h3>
        </div>
      )}
      <div className={`space-y-3 ${heading ? "mt-3" : ""}`}>
        {blocks.map((block, bi) => <GuideBlockView key={bi} block={block} />)}
      </div>
    </div>
  );
}

function GuideView() {
  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2.5">
          <Target className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground">{GUIDE_INTRO.title}</h2>
        </div>
        <div className="mt-4 space-y-3">
          {GUIDE_INTRO.subsections[0].blocks.map((block, bi) => <GuideBlockView key={bi} block={block} />)}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-foreground">The three stages of an interview</h2>
        <p className="mt-1 text-sm text-muted-foreground">Jump straight to the stage you need.</p>
        <div className="mt-4">
          <StageTracker />
        </div>
      </div>

      {GUIDE_STAGE_SECTIONS.map((section) => {
        const Icon = STAGE_ICON[section.stage!];
        return (
          <div key={section.id} id={section.id} className="scroll-mt-24">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
            </div>
            <div className="mt-5 space-y-4">
              {section.subsections.map((sub, i) => <GuideSubsectionCard key={sub.heading || i} {...sub} />)}
            </div>
          </div>
        );
      })}

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2.5">
          <ListChecks className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground">{GUIDE_CHECKLIST.title}</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{firstParagraph(GUIDE_CHECKLIST.subsections[0].blocks)}</p>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {bulletItems(GUIDE_CHECKLIST.subsections[0].blocks).map((item) => (
            <li key={item} className="flex items-start gap-2.5 rounded-lg border border-border bg-background p-3 text-sm leading-6 text-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground">{GUIDE_MINDSET.title}</h2>
        </div>
        <ul className="mt-4 space-y-3">
          {bulletItems(GUIDE_MINDSET.subsections[0].blocks).map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm leading-6 text-foreground/90">
              <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function QuestionAccordionItem({ question, open, onToggle }: { question: Question; open: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-lg border bg-card transition-colors ${open ? "border-primary/40" : "border-border"}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 rounded-lg p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="min-w-0">
          <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase text-muted-foreground">{question.role_category}</span>
          <p className="mt-2 text-base font-bold text-foreground">{question.question}</p>
        </div>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180 text-primary" : ""}`}
          aria-hidden="true"
        />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-6 text-muted-foreground">{question.answer_tips}</p>
        </div>
      </div>
    </div>
  );
}

export default function InterviewPrepPage() {
  const { status } = useMemberSession();
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [category, setCategory] = useState<string>("");
  const [view, setView] = useState<"guide" | "practice">("guide");
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);

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
  const viewTabs: PillTab<"guide" | "practice">[] = [
    { value: "guide", label: "Guide" },
    { value: "practice", label: "Practice questions" },
  ];

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
          <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Walk in ready, not just rehearsed.</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">A full guide for before, during, and after the interview, plus a practice library of real questions with tips on what a strong answer covers.</p>
        </Container>
      </section>

      <section className="py-12 sm:py-14">
        <Container>
          {locked ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
              <LockKeyhole className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-foreground">Interview Prep is part of Premium and Pro career access.</p>
              <p className="mt-1 text-sm text-muted-foreground">Upgrade to unlock the full guide and question library.</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Link href="/tools#career" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                  See career plans
                </Link>
                <Link href="/account/membership" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted">
                  Or use Premium Membership
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <PillTabs tabs={viewTabs} active={view} onChange={setView} />
              </div>

              <div className="mt-8">
                {view === "guide" ? (
                  <GuideView />
                ) : questions.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">Questions are being added. Check back soon.</p>
                ) : (
                  <div className="mx-auto max-w-3xl">
                    <PillTabs tabs={tabs} active={category} onChange={setCategory} />
                    <div className="mt-6 space-y-3">
                      {visible.map((q) => (
                        <QuestionAccordionItem
                          key={q.id}
                          question={q}
                          open={openQuestionId === q.id}
                          onToggle={() => setOpenQuestionId((prev) => (prev === q.id ? null : q.id))}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </Container>
      </section>
    </main>
  );
}
