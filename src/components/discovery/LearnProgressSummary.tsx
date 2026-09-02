"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type CourseRef = { id: string; slug: string; title: string };

// Signed-out: renders nothing. Empty courses list: renders nothing (never
// "0 of 0 courses complete"). course_completions is the completion
// AUTHORITY (what "X of Y complete" counts) - learning_progress is used
// only to find a partially-started course for "Continue learning," never
// to infer completion from progress_percent === 100 (a deliberately
// different concept per course_quizzes.sql's Credentials-phase warning).
export function LearnProgressSummary({ courses, context }: { courses: CourseRef[]; context: "career path" | "skill" }) {
  const [signedIn, setSignedIn] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [progressByCourseId, setProgressByCourseId] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const dedupedIds = Array.from(new Set(courses.map((c) => c.id)));
    if (dedupedIds.length === 0) { setLoading(false); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSignedIn(false); setLoading(false); return; }
    setSignedIn(true);

    const [{ data: completions }, { data: progress }] = await Promise.all([
      supabase.from("course_completions").select("course_id").in("course_id", dedupedIds),
      supabase.from("learning_progress").select("course_id, status").in("course_id", dedupedIds),
    ]);

    setCompletedIds(new Set((completions || []).map((c) => c.course_id)));
    setProgressByCourseId(new Map((progress || []).map((p) => [p.course_id, p.status])));
    setLoading(false);
  }, [courses]);

  useEffect(() => { (async () => { await load(); })(); }, [load]);

  const dedupedCourses = Array.from(new Map(courses.map((c) => [c.id, c])).values());

  if (loading || !signedIn || dedupedCourses.length === 0) return null;

  const completedCount = dedupedCourses.filter((c) => completedIds.has(c.id)).length;
  const totalCount = dedupedCourses.length;

  // Curated order (as passed in) - first in_progress, else first not
  // started, else everything's done. Excludes anything already in
  // course_completions - completion and learning_progress are separate
  // concepts, so a formally-completed course can still show
  // learning_progress.status='in_progress' (not every activity needs to be
  // manually ticked for every completion-rule shape) - never suggest
  // "continue learning" on a course the learner already has a
  // certificate/completion for.
  const notYetCompleted = dedupedCourses.filter((c) => !completedIds.has(c.id));
  const inProgress = notYetCompleted.find((c) => progressByCourseId.get(c.id) === "in_progress");
  const notStarted = notYetCompleted.find((c) => !progressByCourseId.has(c.id) || progressByCourseId.get(c.id) === "not_started");
  const continueCourse = inProgress || notStarted;

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-3">
        <CheckCircle2 size={20} className="flex-shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm font-semibold text-foreground">
          You&apos;ve completed {completedCount} of {totalCount} {totalCount === 1 ? "course" : "courses"} for this {context}.
        </p>
      </div>
      {continueCourse ? (
        <Link href={`/learn/${continueCourse.slug}`} className="inline-flex min-h-9 flex-shrink-0 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Continue learning
        </Link>
      ) : (
        <Link href="/learn" className="inline-flex min-h-9 flex-shrink-0 items-center rounded-lg border border-primary/30 px-4 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          You&apos;ve completed every course here - browse more →
        </Link>
      )}
    </div>
  );
}
