"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, BookOpen, Clock3, Library, PlayCircle } from "lucide-react";
import { Card, EmptyState } from "@/components/account/AccountUI";
import { attachTitles, hrefFor, ITEM_LABEL } from "@/lib/account/itemLinks";
import { supabase } from "@/lib/supabase";

type LearningRow = { id: string; course_id: string; status: string; progress_percent: number; title?: string; slug?: string };
type VideoProgressRow = {
  id: string;
  status: string;
  progress_percent: number;
  resources: { title: string; slug: string } | null;
};
type SavedLibraryItem = { id: string; item_type: string; item_id: string; title?: string; slug?: string };

function ProgressBar({ value }: { value: number }) {
  const width = Math.min(100, Math.max(0, value));
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border p-4">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-2 w-full animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function LearningPage() {
  const [learning, setLearning] = useState<LearningRow[]>([]);
  const [videos, setVideos] = useState<VideoProgressRow[]>([]);
  const [savedLibrary, setSavedLibrary] = useState<SavedLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data }, { data: videoRows }, { data: savedRows }] = await Promise.all([
        supabase.from("learning_progress").select("id, course_id, status, progress_percent").order("updated_at", { ascending: false }),
        supabase
          .from("video_progress")
          .select("id, status, progress_percent, resources(title, slug)")
          .order("updated_at", { ascending: false })
          .limit(8),
        supabase
          .from("saved_items")
          .select("id, item_type, item_id")
          .in("item_type", ["resource", "course"])
          .order("created_at", { ascending: false })
          .limit(12),
      ]);
      const withTitles = await Promise.all(
        (data || []).map(async (row) => {
          const { data: course } = await supabase.from("courses").select("title, slug").eq("id", row.course_id).maybeSingle();
          return { ...row, title: course?.title || "Untitled course", slug: course?.slug };
        })
      );
      setLearning(withTitles);
      setVideos(((videoRows as unknown as VideoProgressRow[]) || []).filter((row) => row.resources));
      setSavedLibrary(await attachTitles((savedRows || []) as SavedLibraryItem[]));
      setLoading(false);
    })();
  }, []);

  const activeCourses = learning.filter((item) => item.status !== "completed");
  const completedCourses = learning.filter((item) => item.status === "completed");
  const activeVideos = videos.filter((item) => item.status !== "completed");
  const completedVideos = videos.filter((item) => item.status === "completed");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <Library size={14} aria-hidden="true" />
            My library
          </div>
          <h1 className="mt-3 text-2xl font-bold text-foreground">Learning</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Pick up your courses, videos, books, guides, and saved resources from one place.
          </p>
        </div>
        <Link href="/resources" className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Browse library
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <BookOpen className="text-primary" size={18} aria-hidden="true" />
          <p className="mt-3 text-2xl font-bold text-foreground">{loading ? 0 : activeCourses.length}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Courses open</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <PlayCircle className="text-primary" size={18} aria-hidden="true" />
          <p className="mt-3 text-2xl font-bold text-foreground">{loading ? 0 : activeVideos.length}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Videos open</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <Bookmark className="text-primary" size={18} aria-hidden="true" />
          <p className="mt-3 text-2xl font-bold text-foreground">{loading ? 0 : savedLibrary.length}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saved items</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <Clock3 className="text-primary" size={18} aria-hidden="true" />
          <p className="mt-3 text-2xl font-bold text-foreground">{loading ? 0 : completedCourses.length + completedVideos.length}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Completed</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Continue learning" action={<Link href="/learn" className="text-sm font-semibold text-primary hover:underline">Browse</Link>}>
          {loading ? (
            <LoadingRows />
          ) : activeCourses.length === 0 ? (
            <EmptyState text="You have not started a course yet." ctaLabel="Explore courses" ctaHref="/learn" />
          ) : (
            <ul className="space-y-3">
              {activeCourses.map((l) => {
                const href = hrefFor("course", l.slug);
                return (
                  <li key={l.id} className="rounded-lg border border-border px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      {href ? (
                        <Link href={href} className="font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{l.title}</Link>
                      ) : (
                        <span className="font-medium text-foreground">{l.title}</span>
                      )}
                      <span className="flex-shrink-0 text-xs text-muted-foreground">{l.status.replace("_", " ")}</span>
                    </div>
                    <ProgressBar value={l.progress_percent} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Continue watching" action={<Link href="/videos" className="text-sm font-semibold text-primary hover:underline">Videos</Link>}>
          {loading ? (
            <LoadingRows />
          ) : activeVideos.length === 0 ? (
            <EmptyState text="No videos in progress yet." ctaLabel="Watch videos" ctaHref="/videos" />
          ) : (
            <ul className="space-y-3">
              {activeVideos.map((v) => (
                <li key={v.id} className="rounded-lg border border-border px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/videos/${v.resources?.slug}`} className="font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      {v.resources?.title || "Untitled video"}
                    </Link>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">{v.progress_percent}% watched</span>
                  </div>
                  <ProgressBar value={v.progress_percent} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Saved for later" action={<Link href="/account/saved" className="text-sm font-semibold text-primary hover:underline">View all</Link>}>
          {loading ? (
            <LoadingRows />
          ) : savedLibrary.length === 0 ? (
            <EmptyState text="Save books, guides, videos, and courses so they appear here." ctaLabel="Browse resources" ctaHref="/resources" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {savedLibrary.map((item) => {
                const href = hrefFor(item.item_type, item.slug);
                return (
                  <div key={item.id} className="rounded-lg border border-border p-4">
                    <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {ITEM_LABEL[item.item_type] || item.item_type}
                    </span>
                    {href ? (
                      <Link href={href} className="mt-3 block text-sm font-semibold leading-6 text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        {item.title}
                      </Link>
                    ) : (
                      <p className="mt-3 text-sm font-semibold leading-6 text-foreground">{item.title}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
