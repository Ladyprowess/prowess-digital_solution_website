"use client";

import { useState } from "react";
import type { OpportunityFilters } from "@/lib/opportunities/filters";
import { FUNDING_TYPES, APPLICATION_COSTS, DEADLINE_WINDOWS } from "@/lib/opportunities/constants";

type SkillLookup = { slug: string; name: string };

const selectCls = "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground";
const groupCls = "border-b border-border py-5 first:pt-0 last:border-b-0";
const labelCls = "text-xs font-semibold uppercase tracking-widest text-muted-foreground";

const LOCATION_TYPES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "on_site", label: "On-site" },
  { value: "any", label: "Global" },
];

// Kept deliberately short: six facets, not twenty-five. Type lives in the
// tabs above the results, not here.
export function OpportunityFiltersSidebar({
  filters,
  onChange,
  skills,
}: {
  filters: OpportunityFilters;
  onChange: (patch: Partial<OpportunityFilters>) => void;
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
          placeholder="Title, organisation, keyword..."
          className={`${selectCls} mt-2`}
        />
      </div>

      <div className={groupCls}>
        <p className={labelCls}>Location</p>
        <select value={filters.locationType} onChange={(e) => onChange({ locationType: e.target.value })} className={`${selectCls} mt-2`}>
          <option value="">Any location</option>
          {LOCATION_TYPES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>

      <div className={groupCls}>
        <p className={labelCls}>Eligibility location</p>
        <input
          value={filters.eligibleLocation}
          onChange={(e) => onChange({ eligibleLocation: e.target.value })}
          placeholder="e.g. Nigeria, Africa, Global"
          className={`${selectCls} mt-2`}
        />
        <p className="mt-1 text-xs text-muted-foreground">Who can apply - not necessarily where the program runs.</p>
      </div>

      <div className={groupCls}>
        <p className={labelCls}>Funding</p>
        <select value={filters.fundingType} onChange={(e) => onChange({ fundingType: e.target.value })} className={`${selectCls} mt-2`}>
          <option value="">Any funding</option>
          {FUNDING_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      <div className={groupCls}>
        <p className={labelCls}>Application cost</p>
        <select value={filters.applicationCost} onChange={(e) => onChange({ applicationCost: e.target.value })} className={`${selectCls} mt-2`}>
          <option value="">Any</option>
          {APPLICATION_COSTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className={groupCls}>
        <p className={labelCls}>Deadline</p>
        <select value={filters.deadlineWindow} onChange={(e) => onChange({ deadlineWindow: e.target.value })} className={`${selectCls} mt-2`}>
          {DEADLINE_WINDOWS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
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
