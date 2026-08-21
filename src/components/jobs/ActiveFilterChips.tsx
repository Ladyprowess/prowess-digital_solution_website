"use client";

import type { JobFilters } from "@/lib/jobs/filters";

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
  categories,
  types,
  skills,
  onChange,
  onClearAll,
}: {
  filters: JobFilters;
  categories: Lookup[];
  types: Lookup[];
  skills: Lookup[];
  onChange: (patch: Partial<JobFilters>) => void;
  onClearAll: () => void;
}) {
  const chips: { key: string; label: string; remove: () => void }[] = [];

  if (filters.q) chips.push({ key: "q", label: `"${filters.q}"`, remove: () => onChange({ q: "" }) });
  if (filters.category) {
    const label = categories.find((c) => c.slug === filters.category)?.name || filters.category;
    chips.push({ key: "category", label, remove: () => onChange({ category: "" }) });
  }
  if (filters.type) {
    const label = types.find((t) => t.slug === filters.type)?.name || filters.type;
    chips.push({ key: "type", label, remove: () => onChange({ type: "" }) });
  }
  if (filters.locationType) {
    const label = filters.locationType === "on_site" ? "On-site" : filters.locationType[0].toUpperCase() + filters.locationType.slice(1);
    chips.push({ key: "locationType", label, remove: () => onChange({ locationType: "" }) });
  }
  if (filters.country) chips.push({ key: "country", label: filters.country, remove: () => onChange({ country: "" }) });
  if (filters.experience) chips.push({ key: "experience", label: filters.experience[0].toUpperCase() + filters.experience.slice(1), remove: () => onChange({ experience: "" }) });
  for (const slug of filters.skills) {
    const label = skills.find((s) => s.slug === slug)?.name || slug;
    chips.push({ key: `skill-${slug}`, label, remove: () => onChange({ skills: filters.skills.filter((s) => s !== slug) }) });
  }
  if (filters.salaryMin || filters.salaryMax) {
    chips.push({
      key: "salary",
      label: `Salary ${filters.salaryMin || "0"}–${filters.salaryMax || "any"}`,
      remove: () => onChange({ salaryMin: "", salaryMax: "" }),
    });
  }
  if (filters.datePosted) chips.push({ key: "posted", label: "Recently posted", remove: () => onChange({ datePosted: "" }) });
  if (filters.closingSoon) chips.push({ key: "closingSoon", label: "Closing soon", remove: () => onChange({ closingSoon: false }) });
  if (filters.company) chips.push({ key: "company", label: filters.company, remove: () => onChange({ company: "" }) });

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
