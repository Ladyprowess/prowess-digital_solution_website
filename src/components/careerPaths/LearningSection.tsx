"use client";

import Link from "next/link";
import { LearnCard } from "@/components/learn/LearnCard";
import { ScrollCarousel } from "@/components/ScrollCarousel";
import type { LearnItem } from "@/lib/learn/types";

// Pre-fetched server-side (real LearnCard data, not the lean skill-graph
// teaser shape) -- this island only filters by tab client-side, no
// additional fetching.
export function LearningSection({ items, skillSlugs }: { items: LearnItem[]; skillSlugs: string[] }) {
  if (items.length === 0) {
    return (
      <div>
        <p className="text-sm text-muted-foreground">No courses have been added for this career path yet.</p>
        <Link href={`/learn?skills=${skillSlugs.join(",")}`} className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Browse courses
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">Courses</p>
          <p className="text-sm leading-6 text-muted-foreground">Structured learning selected for this career direction.</p>
        </div>
        <Link href={`/learn?skills=${skillSlugs.join(",")}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Browse courses
        </Link>
      </div>
      <div className="mt-4">
        <ScrollCarousel>
          {items.map((item) => (
            <div key={`${item.kind}-${item.id}`} className="w-72 flex-shrink-0 snap-start">
              <LearnCard item={item} />
            </div>
          ))}
        </ScrollCarousel>
      </div>
    </div>
  );
}
