"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BuyButton } from "@/components/BuyButton";

type Lesson = { id: string; title: string; content_type: string; content_url: string | null; content_text: string | null; position: number };
type Module = { id: string; title: string; position: number; course_lessons: Lesson[] };

export function CourseContent({
  courseId,
  price,
  currency,
}: {
  courseId: string;
  price: number | null;
  currency: string | null;
}) {
  const [status, setStatus] = useState<"loading" | "entitled" | "locked">("loading");
  const [modules, setModules] = useState<Module[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

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
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  async function toggleComplete(lessonId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const allLessonIds = modules.flatMap((m) => m.course_lessons.map((l) => l.id));
    const next = new Set(completed);

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
          <BuyButton itemType="course" itemId={courseId} price={price} currency={currency} />
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return <p className="mt-10 text-center text-sm text-muted-foreground">No modules have been added to this course yet.</p>;
  }

  return (
    <div className="mt-10 space-y-6">
      {modules.map((m) => (
        <div key={m.id} className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-base font-bold text-foreground">{m.title}</h3>
          <ul className="mt-4 space-y-3">
            {m.course_lessons.sort((a, b) => a.position - b.position).map((l) => (
              <li key={l.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">{l.title}</span>
                  {signedIn && (
                    <button
                      onClick={() => toggleComplete(l.id)}
                      className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${completed.has(l.id) ? "bg-primary/10 text-primary" : "border border-border text-muted-foreground"}`}
                    >
                      {completed.has(l.id) ? "✓ Completed" : "Mark complete"}
                    </button>
                  )}
                </div>
                {l.content_type === "text" && l.content_text && (
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{l.content_text}</p>
                )}
                {l.content_type === "youtube" && l.content_url && (
                  <a href={l.content_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">Watch on YouTube →</a>
                )}
                {["video", "pdf", "external"].includes(l.content_type) && l.content_url && (
                  <a href={l.content_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">Open →</a>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
