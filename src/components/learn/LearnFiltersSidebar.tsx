"use client";

import { useState } from "react";
import type { LearnFilters } from "@/lib/learn/filters";
import { LEVELS, ACCESS_OPTIONS } from "@/lib/learn/constants";

type SkillLookup = { slug: string; name: string };

const selectCls = "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground";
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
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className={groupCls}>
        <p className={labelCls}>Keyword</p>
        <input
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Title, topic, keyword..."
          className={`${selectCls} mt-2`}
        />
      </div>

      <div className={groupCls}>
        <p className={labelCls}>Level</p>
        <select value={filters.level} onChange={(e) => onChange({ level: e.target.value })} className={`${selectCls} mt-2`}>
          {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>

      <div className={groupCls}>
        <p className={labelCls}>Access</p>
        <select value={filters.access} onChange={(e) => onChange({ access: e.target.value })} className={`${selectCls} mt-2`}>
          {ACCESS_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>

      <div className={groupCls}>
        <p className={labelCls}>Skills</p>
        <input
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
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
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
