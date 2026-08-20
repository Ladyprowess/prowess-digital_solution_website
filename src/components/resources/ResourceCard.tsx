"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getYoutubeThumbnail } from "@/lib/youtube";

export type ResourceItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: string | null;
  category: string | null;
  stage: string | null;
  resource_type: string | null;
  level: string | null;
  source: string | null;
  external_url: string | null;
  thumbnail_url: string | null;
  access: "free" | "premium";
  price: number | null;
  price_currency: string | null;
  cover_url: string | null;
  cover_path?: string | null;
  downloads: number;
  rating: number;
  file_size: number | null;
  reading_minutes: number | null;
};

function formatMB(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export default function ResourceCard({ item }: { item: ResourceItem }) {
  const isVideo = item.resource_type === "video" || item.source === "youtube";
  // Priority: a real uploaded cover, then an explicit thumbnail_url, then -
  // for a YouTube video with neither - the thumbnail YouTube already hosts
  // for every video, so a video never has to fall back to the plain
  // "no cover" state a PDF guide uses.
  const fallbackCover = item.cover_url
    || item.thumbnail_url
    || (item.source === "youtube" && item.external_url ? getYoutubeThumbnail(item.external_url) : null);

  const [coverSrc, setCoverSrc] = useState<string | null>(fallbackCover);
  const [coverFailed, setCoverFailed] = useState(false);

  useEffect(() => {
    setCoverSrc(fallbackCover);
    setCoverFailed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.cover_url, item.thumbnail_url, item.external_url]);

  // type/category/stage are the legacy free-text fields (still set on
  // older uploaded resources); resource_type/level are what the current
  // admin form actually writes. Fall back across both so neither an old
  // nor a new resource ends up with a blank badge.
  const typeLabel = isVideo ? "Video" : item.type || item.resource_type?.replace(/_/g, " ") || "Resource";
  const metaLine = [item.category, item.stage].filter(Boolean).join(" • ");

  return (
    <Link
      href={`/resources/${item.slug}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      {/* Cover */}
      <div className="relative h-48 w-full bg-slate-100">
        {coverSrc && !coverFailed ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverSrc}
              alt={item.title}
              className="h-full w-full object-cover"
              onError={() => setCoverFailed(true)}
            />
            {isVideo && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/35">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[var(--steel-teal)] shadow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </span>
            )}
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-500">
            <div className="mb-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              {typeLabel}
            </div>
            <p className="text-sm font-semibold text-slate-700">{isVideo ? "Video" : "Resource"}</p>
            {metaLine && <p className="mt-1 text-xs text-slate-500">{metaLine}</p>}
          </div>
        )}

        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
          {typeLabel}
        </div>
        {item.access === "premium" && (
          <div className="absolute left-3 top-3 rounded-full bg-[var(--steel-teal)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Premium
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {metaLine && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {item.category && (
              <span className="rounded-md bg-teal-50 px-2 py-1 font-medium text-slate-700">
                {item.category}
              </span>
            )}
            {item.category && item.stage && <span className="text-slate-500">•</span>}
            {item.stage && <span className="text-slate-600">{item.stage}</span>}
          </div>
        )}

        <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
          {item.title}
        </h3>

        {item.description && <p className="mt-3 text-slate-600 line-clamp-3">{item.description}</p>}

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 12m0 0l4.5-4.5M12 12V3" />
              </svg>
              {item.downloads.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {Number(item.rating).toFixed(1)}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            {item.file_size ? <span>{formatMB(item.file_size)}</span> : null}
            {item.reading_minutes ? <span>• {item.reading_minutes} min</span> : null}
          </div>
        </div>

        <div className="mt-5">
          <span className="block w-full rounded-xl bg-[var(--steel-teal)] px-4 py-3 text-center text-sm font-semibold text-white transition group-hover:opacity-90">
            {item.access === "premium" ? "View resource" : isVideo ? "Watch video" : "Read Online"}
          </span>
        </div>
      </div>
    </Link>
  );
}
