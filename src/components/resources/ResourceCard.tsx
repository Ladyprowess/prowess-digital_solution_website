"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type ResourceItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: string | null;
  category: string | null;
  stage: string | null;
  resource_type: string | null;
  use_case: string | null;
  level: string | null;
  source: string | null;
  external_url: string | null;
  thumbnail_url: string | null;
  access: "free" | "premium";
  price: number | null;
  price_currency: string | null;
  cover_url: string | null;
  cover_path?: string | null;
  file_size: number | null;
  reading_minutes: number | null;
  featured?: boolean;
};

function formatMB(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export default function ResourceCard({ item }: { item: ResourceItem }) {
  // Priority: a real uploaded cover, then an explicit thumbnail_url. Video
  // has its own dedicated /videos experience and VideoCard component --
  // this card never renders a video-type item, so there's no YouTube-
  // thumbnail fallback to reach for here.
  const fallbackCover = item.cover_url || item.thumbnail_url || null;

  const [coverSrc, setCoverSrc] = useState<string | null>(fallbackCover);
  const [coverFailed, setCoverFailed] = useState(false);

  useEffect(() => {
    setCoverSrc(fallbackCover);
    setCoverFailed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.cover_url, item.thumbnail_url]);

  // type/category/stage are the legacy free-text fields (still set on
  // older uploaded resources); resource_type/level are what the current
  // admin form actually writes. Fall back across both so neither an old
  // nor a new resource ends up with a blank badge.
  const typeLabel = item.type || item.resource_type?.replace(/_/g, " ") || "Resource";
  const metaLine = [item.category, item.stage].filter(Boolean).join(" • ");

  return (
    <Link
      href={`/resources/${item.slug}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
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
              {typeLabel}
            </div>
            <p className="text-sm font-semibold text-slate-700">Resource</p>
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

        {(item.file_size || item.reading_minutes) && (
          <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500">
            {item.file_size ? <span>{formatMB(item.file_size)}</span> : null}
            {item.reading_minutes ? <span>{item.file_size ? "• " : ""}{item.reading_minutes} min read</span> : null}
          </div>
        )}

        <div className="mt-5">
          <span className="block w-full rounded-xl bg-[var(--steel-teal)] px-4 py-3 text-center text-sm font-semibold text-white transition group-hover:opacity-90">
            {item.access === "premium" ? "View resource" : "Read Online"}
          </span>
        </div>
      </div>
    </Link>
  );
}
