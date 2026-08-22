"use client";

import { useState } from "react";

export type AccordionItem = { id: string; title: string; body: React.ReactNode };

// Generic, hand-rolled (matches every other interactive primitive in this
// codebase - Modal.tsx, Pagination.tsx - none of them use the installed
// but otherwise-unused Radix packages). Single-open: clicking an item
// closes whichever other one was open, matching "each item expands to a
// short explanation" rather than a multi-open reading list.
export function Accordion({ items, defaultOpenId }: { items: AccordionItem[]; defaultOpenId?: string }) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : item.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-foreground">{item.title}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className={`flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {open && <div className="px-5 pb-4 text-sm text-muted-foreground">{item.body}</div>}
          </div>
        );
      })}
    </div>
  );
}
