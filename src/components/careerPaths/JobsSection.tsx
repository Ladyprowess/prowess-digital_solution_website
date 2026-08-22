"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { PillTabs } from "@/components/PillTabs";

const LOCATION_TABS = [
  { value: "", label: "All" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "on_site", label: "On-site" },
] as const;

// Pre-fetched server-side (real JobCardData, matching /jobs and
// /skills/[slug]'s exact select shape) -- filters client-side by the
// jobs.location_type field already on each row, no re-fetching per tab.
export function JobsSection({ jobs, skillSlugs }: { jobs: JobCardData[]; skillSlugs: string[] }) {
  const [locationType, setLocationType] = useState<(typeof LOCATION_TABS)[number]["value"]>("");

  const filtered = useMemo(
    () => (locationType ? jobs.filter((j) => j.location_type === locationType) : jobs),
    [jobs, locationType]
  );

  if (jobs.length === 0) return null;

  return (
    <div>
      <PillTabs tabs={[...LOCATION_TABS]} active={locationType} onChange={setLocationType} />

      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No {locationType.replace("_", "-")} jobs right now.</p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {filtered.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      )}

      <Link href={`/jobs?skills=${skillSlugs.join(",")}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
        View all jobs →
      </Link>
    </div>
  );
}
