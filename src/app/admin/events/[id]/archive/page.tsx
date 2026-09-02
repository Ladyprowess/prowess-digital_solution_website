"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Archive, ImagePlus, Loader2, Trash2, Video } from "lucide-react";
import { supabase } from "@/lib/supabase";

type MediaRow = {
  id: string;
  event_id: string;
  media_type: "image" | "video";
  url: string;
  caption: string | null;
  created_at: string;
};

function youtubeEmbedUrl(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function AdminEventArchivePage() {
  const params = useParams();
  const eventId = String(params.id);

  const [eventTitle, setEventTitle] = useState("");
  const [items, setItems] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);

    const [{ data: event }, res] = await Promise.all([
      supabase.from("events").select("title").eq("id", eventId).maybeSingle(),
      fetch(`/api/events/archive?event_id=${encodeURIComponent(eventId)}`, { cache: "no-store" }),
    ]);

    const json = await res.json().catch(() => null);

    setEventTitle(event?.title || "");
    setItems(json?.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (mediaType === "video" && !youtubeUrl.trim()) {
      setMessage("Enter a YouTube link.");
      return;
    }
    if (mediaType === "image" && !file) {
      setMessage("Choose an image to upload.");
      return;
    }

    setSubmitting(true);

    const form = new FormData();
    form.append("event_id", eventId);
    form.append("media_type", mediaType);
    form.append("caption", caption.trim());
    if (mediaType === "video") form.append("youtube_url", youtubeUrl.trim());
    if (mediaType === "image" && file) form.append("file", file);

    const res = await fetch("/api/events/archive", { method: "POST", body: form });
    const json = await res.json().catch(() => null);

    setSubmitting(false);

    if (!res.ok) {
      setMessage(json?.error || "Failed to add item.");
      return;
    }

    setYoutubeUrl("");
    setCaption("");
    setFile(null);
    setMessage("Archive item added.");
    await load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/events/archive/${id}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    await load();
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Events</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">Event archive</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Add photos and recordings for {eventTitle || "this event"}. These appear on the public event page after the event has ended.
            </p>
          </div>
          <a
            href="/admin/events"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Back to events
          </a>
        </div>

        <form onSubmit={handleAdd} className="mt-6 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ImagePlus className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Add archive item</h2>
              <p className="text-sm text-muted-foreground">Upload a photo or add a YouTube recording.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="archive-type" className="text-sm font-semibold text-foreground">Type</label>
              <select
                id="archive-type"
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as "image" | "video")}
                className="mt-2 min-h-10 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="image">Photo</option>
                <option value="video">YouTube video</option>
              </select>
            </div>

            {mediaType === "video" ? (
              <div>
                <label htmlFor="youtube-url" className="text-sm font-semibold text-foreground">YouTube link</label>
                <input
                  id="youtube-url"
                  type="url"
                  inputMode="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="mt-2 min-h-10 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="archive-image" className="text-sm font-semibold text-foreground">Image</label>
                <input
                  id="archive-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-2 min-h-10 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label htmlFor="archive-caption" className="text-sm font-semibold text-foreground">Caption optional</label>
              <textarea
                id="archive-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Group session, day 2, portfolio building with the mentees."
                rows={3}
                className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{message || "Archive items stay attached to this event."}</p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ImagePlus className="h-4 w-4" aria-hidden />}
              {submitting ? "Adding..." : "Add to archive"}
            </button>
          </div>
        </form>

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-border bg-card p-3" aria-hidden>
                <div className="h-40 animate-pulse rounded-lg bg-muted" />
                <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-primary">
              <Archive className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">Nothing in the archive yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Add a photo or recording when the session is complete. It will show on the event page for visitors.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-card p-3">
                {item.media_type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.caption || "Event archive image"} className="max-h-64 w-full rounded-lg bg-muted object-contain" />
                ) : youtubeEmbedUrl(item.url) ? (
                  <iframe
                    title={item.caption || "Event recording"}
                    src={youtubeEmbedUrl(item.url)!}
                    className="h-40 w-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted text-sm font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Video className="h-6 w-6 text-primary" aria-hidden />
                    Open video link
                  </a>
                )}
                {item.caption ? <p className="mt-3 text-sm text-muted-foreground">{item.caption}</p> : null}

                {confirmDeleteId === item.id ? (
                  <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <p className="text-sm font-semibold text-foreground">Remove this archive item?</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        Keep it
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
