"use client";

import { useState } from "react";
import Link from "next/link";
import { RichText } from "@/components/RichText";

export type RoadmapStageData = {
  id: string;
  title: string;
  description: string | null;
  items: string[] | null;
  skills: { slug: string; name: string }[];
  recommendedCourses: { slug: string; title: string }[];
  recommendedResources: { slug: string; title: string }[];
};

// The visual centerpiece of the detail page: a horizontal progression of
// admin-authored stages, one expanded at a time. Deliberately not built on
// top of the generic Accordion -- a stage needs structured content (a
// skill-pill list and a getSkillGraph-derived "Recommended learning"
// mini-list), not a single body string, so it gets its own small
// expand-in-place component instead.
export function RoadmapStrip({ stages }: { stages: RoadmapStageData[] }) {
  const [openId, setOpenId] = useState<string | null>(stages[0]?.id ?? null);
  const openStage = stages.find((s) => s.id === openId) || null;

  return (
    <div>
      <div className="flex flex-nowrap items-stretch gap-3 overflow-x-auto pb-2">
        {stages.map((stage, i) => (
          <button
            key={stage.id}
            type="button"
            onClick={() => setOpenId(openId === stage.id ? null : stage.id)}
            className={`min-h-24 flex-shrink-0 rounded-lg border px-5 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              openId === stage.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <span className="text-xs font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
            <p className="mt-1 text-sm font-bold text-foreground">{stage.title}</p>
          </button>
        ))}
      </div>

      {openStage && (
        <div className="mt-4 rounded-lg border border-border bg-card p-6">
          {openStage.description && <RichText html={openStage.description} />}

          {openStage.items && openStage.items.length > 0 && (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {openStage.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}

          {openStage.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {openStage.skills.map((s) => (
                <span key={s.slug} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                  {s.name}
                </span>
              ))}
            </div>
          )}

          {(openStage.recommendedCourses.length > 0 || openStage.recommendedResources.length > 0) && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recommended learning</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {openStage.recommendedCourses.map((c) => (
                  <Link key={c.slug} href={`/learn/${c.slug}`} className="rounded-lg border border-border px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    {c.title}
                  </Link>
                ))}
                {openStage.recommendedResources.map((r) => (
                  <Link key={r.slug} href={`/resources/${r.slug}`} className="rounded-lg border border-border px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    {r.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
