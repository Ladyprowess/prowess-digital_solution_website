"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { LearnCard } from "@/components/learn/LearnCard";
import { ScrollCarousel } from "@/components/ScrollCarousel";
import type { LearnItem } from "@/lib/learn/types";

// Pre-fetched server-side (real LearnCard data, not the lean skill-graph
// teaser shape) -- this island only filters by tab client-side, no
// additional fetching.
export function LearningSection({ items, skillSlugs }: { items: LearnItem[]; skillSlugs: string[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">Courses are not available yet</p>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">New courses for this career path will appear here once they are published.</p>
            </div>
          </div>
          <Link href={`/learn?skills=${skillSlugs.join(",")}`} className="inline-flex min-h-10 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Browse courses
        </Link>
        </div>
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
