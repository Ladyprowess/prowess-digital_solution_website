"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// The first nested admin route in this codebase: a career path now has
// enough sub-content (responsibilities, roadmap, career options, projects)
// that cramming it all into one top-form-plus-table page (the convention
// every other admin content page uses) would produce an unreasonably long
// single page. This layout is the shared tab bar every one of those
// sub-pages renders under.
const TABS = [
  { slug: "", label: "Career Path" },
  { slug: "responsibilities", label: "Responsibilities" },
  { slug: "roadmap", label: "Roadmap" },
  { slug: "roles", label: "Career Options" },
  { slug: "projects", label: "Projects" },
] as const;

export default function CareerPathEditorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();
  const isNew = id === "new";

  return (
    <div>
      <Link href="/admin/career-paths" className="text-sm font-semibold text-primary hover:underline">
        &larr; All career paths
      </Link>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((tab) => {
          const href = `/admin/career-paths/${id}${tab.slug ? `/${tab.slug}` : ""}`;
          const active = pathname === href;
          const disabled = isNew && tab.slug !== "";
          return disabled ? (
            <span
              key={tab.slug}
              title="Save the career path first"
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground/40"
            >
              {tab.label}
            </span>
          ) : (
            <Link
              key={tab.slug}
              href={href}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
