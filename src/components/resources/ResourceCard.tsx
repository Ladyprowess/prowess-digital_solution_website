"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock3, FileText, LockKeyhole, MoveRight } from "lucide-react";

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

function formatType(value?: string | null) {
  return (value || "Resource").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
  const typeLabel = item.type || formatType(item.resource_type);
  const metaLine = [item.category, item.stage].filter(Boolean).join(" • ");

  return (
    <Link
      href={`/resources/${item.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-[border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] w-full border-b border-border bg-muted">
        {coverSrc && !coverFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt={item.title}
            className="h-full w-full object-cover"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-background text-primary">
              <BookOpen size={22} strokeWidth={1.7} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">{typeLabel}</p>
            {metaLine && <p className="mt-1 text-xs">{metaLine}</p>}
          </div>
        )}

        <div className="absolute right-3 top-3 rounded-md bg-background/95 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
          {typeLabel}
        </div>
        {item.access === "premium" && (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
            <LockKeyhole size={12} aria-hidden="true" />
            Premium
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {metaLine && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {item.category && (
              <span className="rounded-md bg-muted px-2 py-1 font-medium text-foreground">
                {item.category}
              </span>
            )}
            {item.category && item.stage && <span className="text-muted-foreground">•</span>}
            {item.stage && <span className="text-muted-foreground">{item.stage}</span>}
          </div>
        )}

        <h3 className="mt-4 line-clamp-2 text-base font-semibold leading-snug text-foreground">
          {item.title}
        </h3>

        {item.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.description}</p>}

        <div className="flex-1" />

        {(item.file_size || item.reading_minutes) && (
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
            {item.file_size ? (
              <span className="inline-flex items-center gap-1.5">
                <FileText size={14} aria-hidden="true" />
                {formatMB(item.file_size)}
              </span>
            ) : null}
            {item.reading_minutes ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={14} aria-hidden="true" />
                {item.reading_minutes} min read
              </span>
            ) : null}
          </div>
        )}

        <div className="mt-5 flex min-h-10 items-center justify-between gap-3">
          <span className="text-sm font-semibold text-primary">
            {item.access === "premium" ? "Open resource" : "Read online"}
          </span>
          <MoveRight size={17} className="text-primary transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
