"use client";

import { useState } from "react";
import Link from "next/link";
import { JobAlertsModal } from "@/components/JobAlertsModal";

export function OpportunitiesEmptyState({
  hasActiveFilters,
  typeLabel,
  onClearFilters,
  onExploreType,
}: {
  hasActiveFilters: boolean;
  typeLabel: string | null;
  onClearFilters: () => void;
  onExploreType: () => void;
}) {
  const [alertsOpen, setAlertsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <p className="text-lg font-semibold text-foreground">No opportunities found</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {hasActiveFilters
          ? "We couldn't find opportunities matching your current filters."
          : "No opportunities are published yet. Check back soon, or get notified when new ones go live."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Clear filters
          </button>
        )}
        {typeLabel && (
          <button
            type="button"
            onClick={onExploreType}
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Explore {typeLabel}
          </button>
        )}
        <Link href="/jobs" className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
          View Jobs
        </Link>
        <button
          type="button"
          onClick={() => setAlertsOpen(true)}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Get Opportunity Alerts
        </button>
      </div>
      <JobAlertsModal open={alertsOpen} onClose={() => setAlertsOpen(false)} />
    </div>
  );
}
