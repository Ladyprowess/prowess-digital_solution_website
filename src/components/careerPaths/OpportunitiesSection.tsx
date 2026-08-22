"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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

  if (opportunities.length === 0) return null;

  return (
    <div>
      {types.length > 1 && <OpportunityTypeTabs types={types} active={activeSlug} onChange={setActiveSlug} />}

      <div className={`grid gap-5 sm:grid-cols-2 ${types.length > 1 ? "mt-4" : ""}`}>
        {filtered.map((o) => <OpportunityCard key={o.id} opportunity={o} />)}
      </div>

      <Link href={`/opportunities?skills=${skillSlugs.join(",")}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
        View all opportunities →
      </Link>
    </div>
  );
}
