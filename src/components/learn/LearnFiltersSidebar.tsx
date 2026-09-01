"use client";

import { useState } from "react";
import type { LearnFilters } from "@/lib/learn/filters";
import { LEVELS, ACCESS_OPTIONS } from "@/lib/learn/constants";

type SkillLookup = { slug: string; name: string };

const selectCls = "min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const groupCls = "border-b border-border py-5 first:pt-0 last:border-b-0";
const labelCls = "text-xs font-semibold uppercase tracking-widest text-muted-foreground";

// Kept short - Level, Access, Skills. Kind is owned by the tabs above.
export function LearnFiltersSidebar({
  filters,
  onChange,
  skills,
}: {
  filters: LearnFilters;
  onChange: (patch: Partial<LearnFilters>) => void;
  skills: SkillLookup[];
}) {
  const [skillSearch, setSkillSearch] = useState("");

  function toggleSkill(slug: string) {
    onChange({ skills: filters.skills.includes(slug) ? filters.skills.filter((s) => s !== slug) : [...filters.skills, slug] });
  }

  const shownSkills = skillSearch.trim()
    ? skills.filter((s) => s.name.toLowerCase().includes(skillSearch.trim().toLowerCase()))
    : skills;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className={groupCls}>
        <label htmlFor="learn-filter-keyword" className={labelCls}>Keyword</label>
        <input
          id="learn-filter-keyword"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Title, topic, keyword..."
          className={`${selectCls} mt-2`}
        />
      </div>

      <div className={groupCls}>
        <label htmlFor="learn-filter-level" className={labelCls}>Level</label>
        <select id="learn-filter-level" value={filters.level} onChange={(e) => onChange({ level: e.target.value })} className={`${selectCls} mt-2`}>
          {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>

      <div className={groupCls}>
        <label htmlFor="learn-filter-access" className={labelCls}>Access</label>
        <select id="learn-filter-access" value={filters.access} onChange={(e) => onChange({ access: e.target.value })} className={`${selectCls} mt-2`}>
          {ACCESS_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>

      <div className={groupCls}>
        <label htmlFor="learn-filter-skills" className={labelCls}>Skills</label>
        <input
          id="learn-filter-skills"
          value={skillSearch}
          onChange={(e) => setSkillSearch(e.target.value)}
          placeholder="Search skills..."
          className={`${selectCls} mt-2`}
        />
        <div className="mt-3 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {shownSkills.slice(0, 40).map((s) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => toggleSkill(s.slug)}
              className={`min-h-8 rounded-full border px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                filters.skills.includes(s.slug) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
