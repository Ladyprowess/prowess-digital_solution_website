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
  cover_path?: string | null;
  downloads: number;
  rating: number;
  file_size: number;
  reading_minutes: number | null;
  file_path: string; // IMPORTANT: must match storage key in bucket
};

function formatMB(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

// ✅ Public URL builder (supports folders and special characters)
function getPublicPdfUrl(filePath: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const cleanBase = base.replace(/\/$/, "");
  const safePath = filePath
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/");
  return `${cleanBase}/storage/v1/object/public/resources/${safePath}`;
}

export default function ResourceCard({ item }: { item: ResourceItem }) {
  const [loading, setLoading] = useState<null | "preview">(null);
  const [readerUrl, setReaderUrl] = useState<string | null>(null);

  // ✅ Cover display
  const [coverSrc, setCoverSrc] = useState<string | null>(item.cover_url);
  const [coverFailed, setCoverFailed] = useState(false);

  useEffect(() => {
    setCoverSrc(item.cover_url);
    setCoverFailed(false);
  }, [item.cover_url]);

  async function onPreview() {
    setLoading("preview");
    try {
      const url = getPublicPdfUrl(item.file_path);

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
      }

      const isMobile = window.matchMedia("(max-width: 1023px)").matches;

      // ✅ Mobile: open new tab
      if (isMobile) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      // ✅ Desktop: open modal
      setReaderUrl(url);
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

      {/* ✅ Desktop modal (iframe) */}
      {readerUrl ? (
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