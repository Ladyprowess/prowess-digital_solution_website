"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { OpportunityCard, type OpportunityCardData } from "@/components/opportunities/OpportunityCard";
import { OpportunityTypeTabs } from "@/components/opportunities/OpportunityTypeTabs";

type TypeLookup = { id: string; slug: string; name: string };

// Pre-fetched server-side (real OpportunityCardData) -- reuses the
// existing OpportunityTypeTabs pill row as-is, scoped to only the types
// actually present among this career path's opportunities (not every
// type sitewide, which would mostly show empty tabs here).
export function OpportunitiesSection({
  opportunities,
  types,
  skillSlugs,
}: {
  opportunities: OpportunityCardData[];
  types: TypeLookup[];
  skillSlugs: string[];
}) {
  const [activeSlug, setActiveSlug] = useState("");

  const activeName = types.find((t) => t.slug === activeSlug)?.name;
  const filtered = useMemo(
    () => (activeName ? opportunities.filter((o) => o.type === activeName) : opportunities),
    [opportunities, activeName]
  );

  if (opportunities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">No matching opportunities yet</p>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">Relevant internships, grants, programs and calls will appear here when they are published.</p>
            </div>
          </div>
          <Link href={`/opportunities?skills=${skillSlugs.join(",")}`} className="inline-flex min-h-10 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          View all opportunities
        </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {types.length > 1 && <OpportunityTypeTabs types={types} active={activeSlug} onChange={setActiveSlug} />}

      <div className={`grid gap-5 sm:grid-cols-2 ${types.length > 1 ? "mt-4" : ""}`}>
        {filtered.map((o) => <OpportunityCard key={o.id} opportunity={o} />)}
      </div>

      <Link href={`/opportunities?skills=${skillSlugs.join(",")}`} className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        View all opportunities
      </Link>
    </div>
  );
}
