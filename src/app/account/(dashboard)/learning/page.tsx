"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, EmptyState } from "@/components/account/AccountUI";
import { hrefFor } from "@/lib/account/itemLinks";
import { supabase } from "@/lib/supabase";

type LearningRow = { id: string; course_id: string; status: string; progress_percent: number; title?: string; slug?: string };

export default function LearningPage() {
  const [learning, setLearning] = useState<LearningRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("learning_progress").select("id, course_id, status, progress_percent").order("updated_at", { ascending: false });
      const withTitles = await Promise.all(
        (data || []).map(async (row) => {
          const { data: course } = await supabase.from("courses").select("title, slug").eq("id", row.course_id).maybeSingle();
          return { ...row, title: course?.title || "Untitled course", slug: course?.slug };
        })
      );
      setLearning(withTitles);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Learning</h1>
      <p className="mt-1 text-sm text-muted-foreground">Pick up your courses where you left off.</p>

      <div className="mt-6">
        <Card title="Continue Learning" action={<Link href="/learn" className="text-sm font-semibold text-primary hover:underline">Browse →</Link>}>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : learning.length === 0 ? (
            <EmptyState text="You haven't started a course yet." ctaLabel="Explore courses" ctaHref="/learn" />
          ) : (
            <ul className="space-y-2">
              {learning.map((l) => {
                const href = hrefFor("course", l.slug);
                return (
                  <li key={l.id} className="rounded-xl border border-border/60 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      {href ? (
                        <Link href={href} className="font-medium text-foreground hover:text-primary hover:underline">{l.title}</Link>
                      ) : (
                        <span className="font-medium text-foreground">{l.title}</span>
                      )}
                      <span className="flex-shrink-0 text-xs text-muted-foreground">{l.status.replace("_", " ")}</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${l.progress_percent}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
