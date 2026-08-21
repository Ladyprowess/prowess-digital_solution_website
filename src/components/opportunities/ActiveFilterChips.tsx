"use client";

import type { OpportunityFilters } from "@/lib/opportunities/filters";
import { FUNDING_TYPES, APPLICATION_COSTS, DEADLINE_WINDOWS } from "@/lib/opportunities/constants";

type Lookup = { slug: string; name: string };

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40"
    >
      {label}
      <span aria-hidden="true" className="text-muted-foreground">×</span>
    </button>
  );
}

export function ActiveFilterChips({
  filters,
  types,
  skills,
  onChange,
  onClearAll,
}: {
  filters: OpportunityFilters;
  types: Lookup[];
  skills: Lookup[];
  onChange: (patch: Partial<OpportunityFilters>) => void;
  onClearAll: () => void;
}) {
  const chips: { key: string; label: string; remove: () => void }[] = [];

  if (filters.q) chips.push({ key: "q", label: `"${filters.q}"`, remove: () => onChange({ q: "" }) });
  if (filters.type) {
    const label = types.find((t) => t.slug === filters.type)?.name || filters.type;
    chips.push({ key: "type", label, remove: () => onChange({ type: "" }) });
  }
  if (filters.locationType) {
    const label = filters.locationType === "on_site" ? "On-site" : filters.locationType === "any" ? "Global" : filters.locationType[0].toUpperCase() + filters.locationType.slice(1);
    chips.push({ key: "locationType", label, remove: () => onChange({ locationType: "" }) });
  }
  if (filters.eligibleLocation) chips.push({ key: "eligible", label: `Eligible: ${filters.eligibleLocation}`, remove: () => onChange({ eligibleLocation: "" }) });
  if (filters.fundingType) {
    const label = FUNDING_TYPES.find((f) => f.value === filters.fundingType)?.label || filters.fundingType;
    chips.push({ key: "funding", label, remove: () => onChange({ fundingType: "" }) });
  }
  if (filters.applicationCost) {
    const label = APPLICATION_COSTS.find((c) => c.value === filters.applicationCost)?.label || filters.applicationCost;
    chips.push({ key: "cost", label, remove: () => onChange({ applicationCost: "" }) });
  }
  if (filters.deadlineWindow) {
    const label = DEADLINE_WINDOWS.find((d) => d.value === filters.deadlineWindow)?.label || filters.deadlineWindow;
    chips.push({ key: "deadline", label, remove: () => onChange({ deadlineWindow: "" }) });
  }
  for (const slug of filters.skills) {
    const label = skills.find((s) => s.slug === slug)?.name || slug;
    chips.push({ key: `skill-${slug}`, label, remove: () => onChange({ skills: filters.skills.filter((s) => s !== slug) }) });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map((c) => <Chip key={c.key} label={c.label} onRemove={c.remove} />)}
      <button type="button" onClick={onClearAll} className="text-xs font-semibold text-primary hover:underline">
        Clear all filters
      </button>
    </div>
  );
}
