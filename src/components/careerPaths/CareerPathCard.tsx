"use client";

import Link from "next/link";
import { CAREER_PATH_ICON_PATHS } from "@/lib/careerPaths/icons";

export type CareerPathCardData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: "beginner" | "intermediate" | "advanced" | null;
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
  return (
    <Link
      href={`/career-paths/${path.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CareerPathIcon iconKey={path.iconKey} />
        </div>
        {path.featured && (
          <span className="flex-shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">Featured</span>
        )}
      </div>

      <h3 className="mt-4 text-lg font-bold text-foreground">{path.title}</h3>
      {path.level && <span className="mt-1 text-xs font-semibold capitalize text-muted-foreground">{path.level}</span>}
      {path.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{path.description}</p>}

      <div className="flex-1" />

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
        {[
          { label: "Skills", value: path.skillsCount },
          { label: "Learning", value: path.learningCount },
          { label: "Jobs", value: path.jobsCount },
        ].map((stat) => (
          <div key={stat.label}>
            <p className={`text-sm font-bold ${stat.value > 0 ? "text-foreground" : "text-muted-foreground/40"}`}>{stat.value}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <span className="mt-4 text-sm font-semibold text-primary">Explore path →</span>
    </Link>
  );
}
