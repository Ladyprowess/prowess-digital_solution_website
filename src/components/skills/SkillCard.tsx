"use client";

import Link from "next/link";

export type SkillCardData = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  featured: boolean;
  learningCount: number;
  jobsCount: number;
  opportunitiesCount: number;
};

// Used on /skills (both the Popular Skills showcase and the lighter Browse
// All Skills grid, via `compact`) and reusable on /skills/[slug]'s Related
// Skills section.
export function SkillCard({ skill, compact = false }: { skill: SkillCardData; compact?: boolean }) {
  return (
    <Link
      href={`/skills/${skill.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-md ${compact ? "p-5" : "p-6"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className={`font-bold text-foreground ${compact ? "text-base" : "text-lg"}`}>{skill.name}</h3>
        {skill.featured && (
          <span className="flex-shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">Featured</span>
        )}
      </div>

      {skill.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{skill.description}</p>}

      <div className="flex-1" />

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
        {[
          { label: "Learning", value: skill.learningCount },
          { label: "Jobs", value: skill.jobsCount },
          { label: "Opportunities", value: skill.opportunitiesCount },
        ].map((stat) => (
          <div key={stat.label}>
            <p className={`text-sm font-bold ${stat.value > 0 ? "text-foreground" : "text-muted-foreground/40"}`}>{stat.value}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </Link>
  );
}
