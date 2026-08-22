"use client";

import { useEffect, useState } from "react";

export type SectionNavItem = { id: string; label: string };

// Scrollspy, not a PillTabs usage -- this is self-driven by scroll
// position (IntersectionObserver), not externally controlled. Only shows
// tabs whose target section actually exists in the DOM, so it degrades
// gracefully while later sections (Career Options, Tools, Projects) are
// still being built out phase by phase.
export function SectionNav({ items }: { items: SectionNavItem[] }) {
  const [availableIds, setAvailableIds] = useState<string[]>([]);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    // Checking which sections exist has to happen after mount (server
    // render has no DOM), and setting up the observer depends on that
    // check -- deferred to a microtask so the setState below doesn't run
    // synchronously within the effect body itself.
    let observer: IntersectionObserver | null = null;
    queueMicrotask(() => {
      const present = items.filter((i) => document.getElementById(i.id));
      setAvailableIds(present.map((i) => i.id));
      if (present.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) setActive(visible[0].target.id);
        },
        { rootMargin: "-140px 0px -70% 0px", threshold: 0 }
      );
      present.forEach((i) => {
        const el = document.getElementById(i.id);
        if (el) observer!.observe(el);
      });
    });
    return () => observer?.disconnect();
  }, [items]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 136;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  const visibleTabs = items.filter((i) => availableIds.includes(i.id));
  if (visibleTabs.length === 0) return null;

  return (
    <div className="sticky top-20 z-40 -mx-4 overflow-x-auto border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0">
      <div className="flex flex-nowrap gap-2">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => scrollTo(tab.id)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              active === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
