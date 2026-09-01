"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BuyButton } from "@/components/BuyButton";
import { getYoutubeVideoId, getYoutubeThumbnail, isYoutubeShorts } from "@/lib/youtube";
import { RichText } from "@/components/RichText";
import { loadYoutubeIframeApi, YOUTUBE_PLAYER_STATE, type YouTubePlayer } from "@/lib/youtubePlayer";

type VideoPlayerData = {
  content: string | null;
  file_url: string | null;
  external_url: string | null;
  source: string;
  download_url: string | null;
};

const HEARTBEAT_MS = 15000;
// Only resume mid-video if there's a meaningful position to return to --
// not the first few seconds, and not so close to the end that "resume"
// would just replay the last second.
const MIN_RESUME_SECONDS = 5;

// Same entitlement flow as ResourceBody.tsx (reused via the same
// /api/content/access endpoint), extended with real YouTube IFrame Player
// API progress tracking. No server-side session reading exists anywhere in
// this codebase, so entitlement + progress both have to be fetched here,
// client-side, after mount -- mirrors ResourceBody's status state machine.
export function VideoPlayer({ resourceId, priceUsd, priceNgn }: { resourceId: string; priceUsd: number | null; priceNgn: number | null }) {
  const [status, setStatus] = useState<"loading" | "entitled" | "locked">("loading");
  const [data, setData] = useState<VideoPlayerData | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [resumeSeconds, setResumeSeconds] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSignedIn(!!session);
      setUserId(session?.user.id || null);

      const res = await fetch("/api/content/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ itemType: "resource", itemId: resourceId }),
      });
      const result = await res.json();

      if (!result.ok) {
        setStatus("locked");
        return;
      }
      setData(result.resource);

      if (session?.user.id) {
        const { data: progress } = await supabase
          .from("video_progress")
          .select("status, position_seconds")
          .eq("user_id", session.user.id)
          .eq("resource_id", resourceId)
          .maybeSingle();
        if (progress && progress.status !== "completed" && progress.position_seconds > MIN_RESUME_SECONDS) {
          setResumeSeconds(progress.position_seconds);
        }
      }

      setStatus("entitled");
    })();
  }, [resourceId]);

  const writeProgress = useCallback(
    async (progressStatus: "in_progress" | "completed", positionSeconds: number, durationSeconds: number) => {
      if (!userId) return; // signed-out visitors get no tracking, matches SaveButton's own login-gated pattern
      const percent = durationSeconds > 0 ? Math.min(100, Math.round((positionSeconds / durationSeconds) * 100)) : 0;
      await supabase.from("video_progress").upsert(
        {
          user_id: userId,
          resource_id: resourceId,
          status: progressStatus,
          position_seconds: Math.max(0, Math.round(positionSeconds)),
          progress_percent: percent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,resource_id" }
      );
    },
    [userId, resourceId]
  );

  useEffect(() => {
    if (status !== "entitled" || !data?.external_url) return;
    const youtubeId = getYoutubeVideoId(data.external_url);
    if (!youtubeId || !containerRef.current) return;

    let cancelled = false;

    loadYoutubeIframeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;

      const player = new YT.Player(containerRef.current, {
        videoId: youtubeId,
        playerVars: { rel: 0, ...(resumeSeconds ? { start: Math.round(resumeSeconds) } : {}) },
        events: {
          onStateChange: (event) => {
            const p = event.target;
            if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }

            if (event.data === YOUTUBE_PLAYER_STATE.PAUSED) {
              writeProgress("in_progress", p.getCurrentTime(), p.getDuration());
            } else if (event.data === YOUTUBE_PLAYER_STATE.ENDED) {
              writeProgress("completed", p.getDuration(), p.getDuration());
            } else if (event.data === YOUTUBE_PLAYER_STATE.PLAYING) {
              heartbeatRef.current = setInterval(() => {
                writeProgress("in_progress", p.getCurrentTime(), p.getDuration());
              }, HEARTBEAT_MS);
            }
          },
        },
      });
      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (playerRef.current) {
        // Best-effort final write -- not guaranteed on hard tab-close, only
        // on in-app navigation away. The 15s heartbeat keeps the worst-case
        // loss small.
        try { writeProgress("in_progress", playerRef.current.getCurrentTime(), playerRef.current.getDuration()); }
        catch { /* player may already be torn down */ }
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [status, data, resumeSeconds, writeProgress]);

  if (status === "loading") {
    return <p className="mt-10 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (status === "locked") {
    return (
      <div className="mt-10 rounded-2xl border-2 border-primary/20 bg-muted p-8 text-center">
        <h2 className="text-lg font-bold text-foreground">This is premium</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {signedIn ? "You don't have access to this yet." : "Sign in if you've already bought this, or buy access below."}
        </p>
        <div className="mx-auto mt-6 max-w-xs">
          <BuyButton itemType="resource" itemId={resourceId} priceUsd={priceUsd} priceNgn={priceNgn} />
        </div>
      </div>
    );
  }

  const youtubeId = data?.external_url ? getYoutubeVideoId(data.external_url) : null;
  const isShorts = data?.external_url ? isYoutubeShorts(data.external_url) : false;
  const shortsBackdrop = isShorts && data?.external_url ? getYoutubeThumbnail(data.external_url) : null;
  const downloadUrl = data?.download_url || data?.file_url || null;

  return (
    <div className="mt-10 space-y-6">
      {youtubeId && (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black">
          {shortsBackdrop && (
            // eslint-disable-next-line @next/next/no-img-element -- ambient blurred backdrop, not real content
            <img
              src={shortsBackdrop}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl"
            />
          )}
          {/* A Short's native embed is ~9:16 (confirmed via YouTube's oEmbed) -
              keeping the outer box landscape (consistent with every other
              video on the page) while sizing the actual player to its real
              aspect ratio and centering it, rather than stretching/cropping
              it to fill the full landscape box. */}
          <div className={`relative h-full ${isShorts ? "mx-auto aspect-[9/16]" : "w-full"}`}>
            <div ref={containerRef} className="h-full w-full" />
          </div>
        </div>
      )}

      {data?.content && <RichText html={data.content} />}

      {data?.external_url && !youtubeId && (
        <a
          href={data.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90"
        >
          Watch video →
        </a>
      )}

      {data?.external_url && youtubeId && (
        <a href={data.external_url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-semibold text-primary hover:underline">
          Watch on YouTube →
        </a>
      )}

      {downloadUrl && (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Download →
        </a>
      )}

      {!data?.content && !data?.external_url && !downloadUrl && (
        <p className="text-sm text-muted-foreground">No content has been added to this video yet.</p>
      )}
    </div>
  );
}
