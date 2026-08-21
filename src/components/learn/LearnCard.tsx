"use client";

import Link from "next/link";
import { SaveButton } from "@/components/SaveButton";
import { colorForSeed } from "@/lib/listingColors";
import { stripHtmlForMeta } from "@/lib/stripHtml";
import type { LearnItem } from "@/lib/learn/types";

const KIND_LABELS: Record<LearnItem["kind"], string> = {
  course: "Course",
  video: "Video",
  article: "Article",
  ebook: "Ebook",
  guide: "Guide",
};

const KIND_ICON_PATHS: Record<LearnItem["kind"], string> = {
  course: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  video: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
  article: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-1.519-3.75L12 17.25m0 0l-1.481-3.75M12 17.25V3.75M6.75 21h10.5a2.25 2.25 0 002.25-2.25V6.621a2.25 2.25 0 00-.659-1.591l-3.621-3.621A2.25 2.25 0 0013.629 0.75H6.75A2.25 2.25 0 004.5 3v15.75A2.25 2.25 0 006.75 21z",
  ebook: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  guide: "M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5",
};

function KindIcon({ kind }: { kind: LearnItem["kind"] }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d={KIND_ICON_PATHS[kind]} />
    </svg>
  );
}

function priceLabel(item: LearnItem): string | null {
  if (item.access !== "premium") return null;
  if (!item.price) return "Premium";
  return `${item.price_currency || ""} ${item.price.toLocaleString()}`.trim();
}

export function LearnCard({ item }: { item: LearnItem }) {
  const color = colorForSeed(item.kind);
  const skills = item.skills.slice(0, 3);
  const extraSkills = item.skills.length > 3 ? item.skills.length - 3 : 0;
  const price = priceLabel(item);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={item.href} className="flex flex-1 flex-col">
        <div className="relative h-40 w-full overflow-hidden bg-muted">
          {item.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnail_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="relative flex h-full w-full items-center justify-center">
              <div className={`absolute -right-8 -top-10 h-32 w-32 rounded-full ${color.bar} opacity-20 blur-2xl`} />
              <div className={`absolute -bottom-10 -left-6 h-36 w-36 rounded-full ${color.bar} opacity-10 blur-2xl`} />
              <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${color.chip}`}>
                <KindIcon kind={item.kind} />
              </div>
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-1.5">
            <span className="rounded-full bg-card/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-foreground shadow-sm">
              {KIND_LABELS[item.kind]}
            </span>
            {item.featured && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
                Featured
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-center justify-between gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${item.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {item.access === "premium" ? (price || "Premium") : "Free"}
            </span>
            {item.level && <span className="text-xs capitalize text-muted-foreground">{item.level}</span>}
          </div>

          <h3 className="mt-4 line-clamp-2 text-base font-bold leading-snug text-foreground">{item.title}</h3>
          {item.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{stripHtmlForMeta(item.description, 140)}</p>
          )}

          <div className="flex-1" />

          {skills.length > 0 && (
            <p className="mt-4 truncate text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Skills </span>
              {skills.map((s) => s.name).join(", ")}
              {extraSkills > 0 && ` +${extraSkills}`}
            </p>
          )}
        </div>
      </Link>

      <div className="absolute right-3 top-3" onClick={(e) => e.stopPropagation()}>
        <SaveButton itemType={item.kind === "course" ? "course" : "resource"} itemId={item.id} iconOnly className="bg-card/95 shadow-sm backdrop-blur" />
      </div>
    </div>
  );
}
