"use client";

import { useEffect, useState } from "react";
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

  if (!loaded || items.length === 0) return null;

  return (
    <div className="my-6">
      <h2 className="text-lg font-bold text-foreground">Continue watching</h2>
      <div className="mt-4">
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
