"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

  async function handleAdd() {
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
      setMessage(json?.error || "Failed to add item");
      return;
    }

    setYoutubeUrl("");
    setCaption("");
    setFile(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this item from the archive?")) return;
    await fetch(`/api/events/archive/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-slate-900">Event archive</h1>
        <p className="mt-1 text-sm text-slate-600">
          {eventTitle || eventId} &middot; photos and recordings shown on the public event page once it has passed.
        </p>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900">Add to archive</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900">Type</label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as "image" | "video")}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <option value="image">Photo</option>
                <option value="video">YouTube video</option>
              </select>
            </div>

            {mediaType === "video" ? (
              <div>
                <label className="text-sm font-semibold text-slate-900">YouTube link</label>
                <input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-semibold text-slate-900">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-900">Caption (optional)</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. Group session, day 2 - hands-on portfolio building with the mentees."
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={submitting}
            className="mt-5 rounded-2xl bg-[var(--steel-teal)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Adding…" : "Add to archive"}
          </button>

          {message ? <p className="mt-3 text-sm text-rose-600">{message}</p> : null}
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading archive…</div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Nothing in the archive yet.</div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                {item.media_type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.caption || ""} className="max-h-64 w-full rounded-xl bg-slate-100 object-contain" />
                ) : youtubeEmbedUrl(item.url) ? (
                  <iframe
                    src={youtubeEmbedUrl(item.url)!}
                    className="h-40 w-full rounded-xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <a href={item.url} target="_blank" rel="noreferrer" className="flex h-40 w-full items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-600">
                    Open video link
                  </a>
                )}
                {item.caption ? <p className="mt-2 text-xs text-slate-600">{item.caption}</p> : null}
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="mt-2 text-xs font-semibold text-rose-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
