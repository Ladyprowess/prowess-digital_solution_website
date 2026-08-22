"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LearnCard } from "@/components/learn/LearnCard";
import { PillTabs } from "@/components/PillTabs";
import { ScrollCarousel } from "@/components/ScrollCarousel";
import { KIND_TABS } from "@/lib/learn/constants";
import type { LearnItem, LearnKind } from "@/lib/learn/types";

// Pre-fetched server-side (real LearnCard data, not the lean skill-graph
// teaser shape) -- this island only filters by tab client-side, no
// additional fetching.
export function LearningSection({ items, skillSlugs }: { items: LearnItem[]; skillSlugs: string[] }) {
  const [kind, setKind] = useState<LearnKind | "">("");

  const filtered = useMemo(() => (kind ? items.filter((i) => i.kind === kind) : items), [items, kind]);

  if (items.length === 0) return null;

  return (
    <div>
      <PillTabs tabs={KIND_TABS.map((t) => ({ value: t.value as LearnKind | "", label: t.label }))} active={kind} onChange={setKind} />

      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No {kind} yet for this career path.</p>
      ) : (
        <div className="mt-4">
          <ScrollCarousel>
            {filtered.map((item) => (
              <div key={`${item.kind}-${item.id}`} className="w-72 flex-shrink-0 snap-start">
                <LearnCard item={item} />
              </div>
            ))}
          </ScrollCarousel>
        </div>
      )}

      <Link href={`/learn?skills=${skillSlugs.join(",")}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
        View all learning →
      </Link>
    </div>
  );
}
