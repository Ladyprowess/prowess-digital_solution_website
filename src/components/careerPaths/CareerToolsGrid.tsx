import Link from "next/link";
import { TOOL_ICON_PATHS } from "@/lib/tools/icons";

export type CareerTool = { key: string; title: string; description: string; icon_key: string; href: string | null; badge: string };

function ToolIcon({ iconKey }: { iconKey: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d={TOOL_ICON_PATHS[iconKey] || TOOL_ICON_PATHS["business-helper"]} />
    </svg>
  );
}

// Small icon cards linking out to the already-existing /tools content --
// null href (a "coming soon" tool) renders the same card, just not
// clickable, matching /tools' own treatment of unfinished tools.
export function CareerToolsGrid({ tools }: { tools: CareerTool[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => {
        const content = (
          <>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ToolIcon iconKey={tool.icon_key} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{tool.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{tool.description}</p>
            </div>
          </>
        );
        return tool.href ? (
          <Link key={tool.key} href={tool.href} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30">
            {content}
          </Link>
        ) : (
          <div key={tool.key} className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-card p-4 opacity-70">
            {content}
          </div>
        );
      })}
    </div>
  );
}
