"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ScrollCarousel } from "@/components/ScrollCarousel";
import { VideoCard, type VideoCardData } from "@/components/videos/VideoCard";

type ProgressRow = { progress_percent: number; resources: VideoCardData | null };

// Signed-in only, and only when there's real unfinished progress -- no
// server-side session reading exists in this codebase, so this has to
// fetch after mount, same as VideoPlayer/SaveButton/ResourceBody.
export function ContinueWatching() {
  const [items, setItems] = useState<(VideoCardData & { progressPercent: number })[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) setLoaded(true);
        return;
      }

      const { data } = await supabase
        .from("video_progress")
        .select("progress_percent, resources(id, slug, title, description, category, source, external_url, thumbnail_url, access)")
        .eq("user_id", session.user.id)
        .eq("status", "in_progress")
        .order("updated_at", { ascending: false })
        .limit(8);

      const rows = ((data as unknown as ProgressRow[]) || [])
        .filter((r) => r.resources)
        .map((r) => ({ ...r.resources!, progressPercent: r.progress_percent }));

      if (!cancelled) {
        setItems(rows);
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-border p-4">
            <div className="aspect-video rounded-lg bg-muted" />
            <div className="mt-4 h-4 w-3/4 rounded bg-muted" />
            <div className="mt-3 h-2 w-full rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-card text-primary">
          <PlayCircle size={20} aria-hidden="true" />
        </div>
        <p className="mt-3 text-sm font-semibold text-foreground">No videos in progress yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">When you start watching a video, it will appear here so you can continue from your account.</p>
        <Link href="/videos" className="mt-3 inline-flex min-h-10 items-center rounded-md px-3 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Browse videos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div>
        <ScrollCarousel>
          {items.map((v) => (
            <div key={v.id} className="w-72 flex-shrink-0 snap-start">
              <VideoCard video={v} progressPercent={v.progressPercent} />
            </div>
          ))}
        </ScrollCarousel>
      </div>
    </div>
  );
}
