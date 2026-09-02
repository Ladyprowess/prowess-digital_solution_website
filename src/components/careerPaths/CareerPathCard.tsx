"use client";

import Link from "next/link";
import { CAREER_PATH_ICON_PATHS } from "@/lib/careerPaths/icons";
import { stripHtmlForMeta } from "@/lib/stripHtml";

export type CareerPathCardData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: "beginner" | "intermediate" | "advanced" | null;
  category?: string | null;
  featured: boolean;
  iconKey: string;
  skillsCount: number;
  learningCount: number;
  jobsCount: number;
};

function CareerPathIcon({ iconKey }: { iconKey: string }) {
  const d = CAREER_PATH_ICON_PATHS[iconKey] || CAREER_PATH_ICON_PATHS.path;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

// Calm, no colorForSeed -- follows SkillCard's precedent (a destination
// preview, not a category-hued product card like Job/OpportunityCard).
export function CareerPathCard({ path }: { path: CareerPathCardData }) {
  const description = path.description ? stripHtmlForMeta(path.description, 140) : "";
  const totalSupport = path.skillsCount + path.learningCount + path.jobsCount;
  return (
    <Link
      href={`/career-paths/${path.slug}`}
      className="group flex min-h-[320px] flex-col overflow-hidden rounded-lg border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CareerPathIcon iconKey={path.iconKey} />
        </div>
        <div className="flex flex-col items-end gap-2">
          {path.featured && (
            <span className="flex-shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-primary">Featured</span>
          )}
          {path.category && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold capitalize text-muted-foreground">{path.category}</span>
          )}
        </div>
      </div>

      <div className="mt-5">
        <span className="text-xs font-bold uppercase tracking-wide text-primary">Career path</span>
        <h3 className="mt-2 text-xl font-bold text-foreground">{path.title}</h3>
        {description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>

      <div className="flex-1" />

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
        {[
          { label: "Skills", value: path.skillsCount },
          { label: "Courses", value: path.learningCount },
          { label: "Jobs", value: path.jobsCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-muted/60 px-2 py-3">
            <p className={`text-sm font-bold ${stat.value > 0 ? "text-foreground" : "text-muted-foreground/40"}`}>{stat.value}</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <span className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-primary">
        {totalSupport > 0 ? "Open guided path" : "View path details"}
      </span>
    </Link>
  );
}
