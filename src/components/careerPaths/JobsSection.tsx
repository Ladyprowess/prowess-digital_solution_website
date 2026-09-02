"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
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

  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BriefcaseBusiness size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">No matching jobs yet</p>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">When jobs connected to this path are published, they will appear here.</p>
            </div>
          </div>
          <Link href={`/jobs?skills=${skillSlugs.join(",")}`} className="inline-flex min-h-10 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          View all jobs
        </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PillTabs tabs={[...LOCATION_TABS]} active={locationType} onChange={setLocationType} />

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-card px-6 py-6">
          <p className="text-sm font-semibold text-foreground">No {locationType.replace("_", "-")} jobs right now</p>
          <p className="mt-1 text-sm text-muted-foreground">Try another location filter or view all jobs for this career path.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {filtered.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      )}

      <Link href={`/jobs?skills=${skillSlugs.join(",")}`} className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        View all jobs
      </Link>
    </div>
  );
}
