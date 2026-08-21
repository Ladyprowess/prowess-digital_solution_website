"use client";

// Generic version of the pill-row tab pattern already duplicated in
// OpportunityTypeTabs and LearnTypeTabs (both hardcode their own lookup
// shape). "All" is just a normal entry in `tabs` (value: "") rather than a
// special-cased button, so every call site expresses it the same way.
export type PillTab<T extends string> = { value: T; label: string };

export function PillTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: PillTab<T>[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`flex-shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
            active === tab.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
