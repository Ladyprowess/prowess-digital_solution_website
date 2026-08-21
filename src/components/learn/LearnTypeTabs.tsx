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
      {KIND_TABS.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value as LearnKind | "")}
          className={`flex-shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
            active === t.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
