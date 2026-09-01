"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BuyButton } from "@/components/BuyButton";
import { getYoutubeThumbnail } from "@/lib/youtube";
import { RichText } from "@/components/RichText";
import { QuizRunner } from "@/components/learn/QuizRunner";
import { completionBanner, activityBanner, type CompletionBanner } from "@/lib/certificates/messages";

type Lesson = { id: string; title: string; content_type: string; content_url: string | null; content_text: string | null; quiz_id: string | null; position: number };
type Module = { id: string; title: string; position: number; course_lessons: Lesson[] };

export function CourseContent({
  courseId,
  priceUsd,
  priceNgn,
}: {
  courseId: string;
  priceUsd: number | null;
  priceNgn: number | null;
}) {
  const [status, setStatus] = useState<"loading" | "entitled" | "locked">("loading");
  const [modules, setModules] = useState<Module[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [banner, setBanner] = useState<CompletionBanner | null>(null);
  const [activityLine, setActivityLine] = useState<string | null>(null);

  const evaluateCompletion = useCallback(async (accessToken: string, lessonId?: string) => {
    const res = await fetch(`/api/courses/${courseId}/evaluate-completion`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(lessonId ? { lessonId } : {}),
    }).then((r) => r.json()).catch(() => null);
    if (res?.ok) {
      const next = completionBanner(res);
      if (next) setBanner(next);
      const activity = activityBanner(res);
      if (activity) setActivityLine(activity);
    }
  }, [courseId]);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSignedIn(!!session);

    const res = await fetch("/api/content/access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ itemType: "course", itemId: courseId }),
    });
    const data = await res.json();

    if (!data.ok) {
      setStatus("locked");
      return;
    }
    setModules(data.modules || []);
    setStatus("entitled");

    if (session) {
      const lessonIds = (data.modules || []).flatMap((m: Module) => m.course_lessons.map((l) => l.id));
      if (lessonIds.length > 0) {
        const { data: done } = await supabase.from("lesson_completions").select("lesson_id").in("lesson_id", lessonIds);
        setCompleted(new Set((done || []).map((d) => d.lesson_id)));
      }

      // Catch-up path: a learner who already satisfied this course's rules
      // before an admin turned on certificate issuance (or before the rules
      // existed at all) gets evaluated just by opening the page - safe to
      // call on every load since the evaluator is idempotent.
      if (session.access_token) evaluateCompletion(session.access_token);
    }
  }, [courseId, evaluateCompletion]);

  useEffect(() => { load(); }, [load]);

  async function toggleComplete(lessonId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const allLessonIds = modules.flatMap((m) => m.course_lessons.map((l) => l.id));
    const next = new Set(completed);

    const markingComplete = !next.has(lessonId);

    if (next.has(lessonId)) {
      await supabase.from("lesson_completions").delete().eq("user_id", session.user.id).eq("lesson_id", lessonId);
      next.delete(lessonId);
    } else {
      await supabase.from("lesson_completions").insert({ user_id: session.user.id, lesson_id: lessonId });
      next.add(lessonId);
    }
    setCompleted(next);

    const progressPercent = allLessonIds.length ? Math.round((next.size / allLessonIds.length) * 100) : 0;
    await supabase.from("learning_progress").upsert(
      {
        user_id: session.user.id,
        course_id: courseId,
        status: progressPercent === 100 ? "completed" : progressPercent > 0 ? "in_progress" : "not_started",
        progress_percent: progressPercent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_id" }
    );

    if (markingComplete && session.access_token) await evaluateCompletion(session.access_token, lessonId);
  }

  if (status === "loading") {
    return <p className="mt-10 text-center text-sm text-muted-foreground">Loading course content…</p>;
  }

  if (status === "locked") {
    return (
      <div className="mt-10 rounded-2xl border-2 border-primary/20 bg-muted p-8 text-center">
        <h2 className="text-lg font-bold text-foreground">This course is premium</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {signedIn ? "You don't have access to this course yet." : "Sign in if you've already purchased this, or buy access below."}
        </p>
        <div className="mx-auto mt-6 max-w-xs">
          <BuyButton itemType="course" itemId={courseId} priceUsd={priceUsd} priceNgn={priceNgn} />
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return <p className="mt-10 text-center text-sm text-muted-foreground">No modules have been added to this course yet.</p>;
  }

  return (
    <div className="mt-10 space-y-6">
      {banner && (
        <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 text-sm font-semibold text-foreground">
          {banner.text}
          {banner.type === "certificate" && (
            <a href="/account/certificates" className="ml-2 text-primary hover:underline">View certificates →</a>
          )}
        </div>
      )}
      {activityLine && (
        <p className="text-sm font-semibold text-primary">{activityLine}</p>
      )}
      {modules.map((m) => (
        <div key={m.id} className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-base font-bold text-foreground">{m.title}</h3>
          <ul className="mt-4 space-y-3">
            {m.course_lessons.sort((a, b) => a.position - b.position).map((l) => (
              <li key={l.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">{l.title}</span>
                  {signedIn && l.content_type !== "quiz" && (
                    <button
                      onClick={() => toggleComplete(l.id)}
                      className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${completed.has(l.id) ? "bg-primary/10 text-primary" : "border border-border text-muted-foreground"}`}
                    >
                      {completed.has(l.id) ? "✓ Completed" : "Mark complete"}
                    </button>
                  )}
                  {signedIn && l.content_type === "quiz" && completed.has(l.id) && (
                    <span className="flex-shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">✓ Completed</span>
                  )}
                </div>
                {l.content_type === "text" && l.content_text && (
                  <RichText html={l.content_text} className="mt-2" />
                )}
                {l.content_type === "youtube" && l.content_url && (() => {
                  const thumb = getYoutubeThumbnail(l.content_url);
                  return (
                    <a href={l.content_url} target="_blank" rel="noopener noreferrer" className="mt-3 block">
                      {thumb ? (
                        <span className="group relative block aspect-video w-full max-w-xs overflow-hidden rounded-xl border border-border bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element -- external YouTube-hosted thumbnail, not a local/optimizable asset */}
                          <img src={thumb} alt={l.title} className="h-full w-full object-cover" />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/35">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-primary shadow">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            </span>
                          </span>
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-primary hover:underline">Watch on YouTube →</span>
                      )}
                    </a>
                  );
                })()}
                {["video", "pdf", "external"].includes(l.content_type) && l.content_url && (
                  <a href={l.content_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">Open →</a>
                )}
                {l.content_type === "quiz" && l.quiz_id && (
                  <QuizRunner
                    quizId={l.quiz_id}
                    lessonId={l.id}
                    onComplete={() => setCompleted((prev) => new Set(prev).add(l.id))}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
