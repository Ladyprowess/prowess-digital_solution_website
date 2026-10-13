"use client";

import { KIND_TABS } from "@/lib/learn/constants";
import type { LearnKind } from "@/lib/learn/types";

export function LearnTypeTabs({
  active,
  onChange,
}: {
  active: LearnKind | "";
  onChange: (kind: LearnKind | "") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {KIND_TABS.map((t) => {
        const tabActive = active === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value as LearnKind | "")}
            className={`min-h-10 flex-shrink-0 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              tabActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
