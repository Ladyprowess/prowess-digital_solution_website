"use client";

type Lookup = { id: string; slug: string; name: string };

// The primary browse mechanism for opportunities (per the spec: give people
// clear tabs instead of making them dig through a filter sidebar to
// discover what types even exist). This owns the `type` facet - the
// sidebar does not duplicate it with a second Type dropdown.
export function OpportunityTypeTabs({
  types,
  active,
  onChange,
}: {
  types: Lookup[];
  active: string;
  onChange: (slug: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 overflow-x-auto">
      <button
        type="button"
        onClick={() => onChange("")}
        className={`flex-shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
          active === "" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"
        }`}
      >
        All
      </button>
      {types.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.slug)}
          className={`flex-shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
            active === t.slug ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
