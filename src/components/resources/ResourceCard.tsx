"use client";

import { useEffect, useState } from "react";

export type ResourceItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  stage: string;
  cover_url: string | null;

  // Optional (only if you later add it)
  cover_path?: string | null;

  downloads: number;
  rating: number;
  file_size: number;
  reading_minutes: number | null;
  file_path: string;
};

function formatMB(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export default function ResourceCard({ item }: { item: ResourceItem }) {
  const [loading, setLoading] = useState<null | "preview">(null);
  const [readerUrl, setReaderUrl] = useState<string | null>(null);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

useEffect(() => {
  const mq = window.matchMedia("(max-width: 1023px)");
  const update = () => setIsMobileOrTablet(mq.matches);
  update();
  mq.addEventListener?.("change", update);
  return () => mq.removeEventListener?.("change", update);
}, []);

useEffect(() => {
  if (isMobileOrTablet && readerUrl) {
    setReaderUrl(null);
  }
}, [isMobileOrTablet, readerUrl]);

  // ✅ Cover display (supports fallback if image fails)
  const [coverSrc, setCoverSrc] = useState<string | null>(item.cover_url);
  const [coverFailed, setCoverFailed] = useState(false);

  // OPTIONAL: if you later implement signed cover endpoint + cover_path
  // this will load signed cover URL automatically.
  useEffect(() => {
    let ignore = false;

    async function loadSignedCoverIfNeeded() {
      if (!item.cover_path) {
        setCoverSrc(item.cover_url);
        return;
      }

      try {
        const res = await fetch("/api/resources/cover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cover_path: item.cover_path }),
        });

        const data = await res.json().catch(() => ({}));
        if (!ignore) {
          setCoverSrc(data?.ok ? data.url : item.cover_url);
        }
      } catch {
        if (!ignore) setCoverSrc(item.cover_url);
      }
    }

    loadSignedCoverIfNeeded();

    return () => {
      ignore = true;
    };
  }, [item.cover_path, item.cover_url]);

  async function getSignedUrl() {
    const res = await fetch("/api/resources/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_path: item.file_path }),
    });

    const data = await res.json().catch(() => ({}));
    if (!data?.ok) throw new Error(data?.error || "Could not fetch link.");
    return data.url as string;
  }

  async function onPreview() {
    // ✅ Open immediately (counts as user gesture in Safari)
    const popup = isMobileOrTablet
      ? window.open("about:blank", "_blank", "noopener,noreferrer")
      : null;
  
    try {
      setLoading("preview");
      const url = await getSignedUrl();
      const finalUrl = `${url}#view=FitH`;
  
      if (isMobileOrTablet) {
        // ✅ If Safari blocked it, popup will be null
        if (popup) popup.location.href = finalUrl;
        else alert("Safari blocked the PDF tab. Please allow pop-ups for this site.");
        return;
      }
  
      setReaderUrl(finalUrl);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Cover */}
      <div className="relative h-48 w-full bg-slate-100">
        {coverSrc && !coverFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt={item.title}
            className="h-full w-full object-cover"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-500">
            <div className="mb-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              {item.type}
            </div>
            <p className="text-sm font-semibold text-slate-700">Resource</p>
            <p className="mt-1 text-xs text-slate-500">
              {item.category} • {item.stage}
            </p>
          </div>
        )}

        {/* Badge */}
        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
          {item.type}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-md bg-teal-50 px-2 py-1 font-medium text-slate-700">
            {item.category}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-600">{item.stage}</span>
        </div>

        <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
          {item.title}
        </h3>

        <p className="mt-3 text-slate-600 line-clamp-3">{item.description}</p>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              ↓ {item.downloads.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              ★ {Number(item.rating).toFixed(1)}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span>{formatMB(item.file_size)}</span>
            {item.reading_minutes ? <span>• {item.reading_minutes} min</span> : null}
          </div>
        </div>

        {/* ✅ Single button only */}
        <div className="mt-5">
          <button
            onClick={onPreview}
            disabled={!!loading}
            className="w-full rounded-xl bg-[var(--steel-teal)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading === "preview" ? "Opening..." : "Read Online"}
          </button>
        </div>
      </div>

      {/* ✅ Reader modal */}
      {readerUrl && !isMobileOrTablet ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">
                Preview: {item.title}
              </p>
              <button
                onClick={() => setReaderUrl(null)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="h-[75vh]">
              <iframe
                src={readerUrl}
                className="h-full w-full"
                title={`Preview ${item.title}`}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}