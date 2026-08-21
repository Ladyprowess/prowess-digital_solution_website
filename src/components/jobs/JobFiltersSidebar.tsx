"use client";

import { useState } from "react";
import type { JobFilters } from "@/lib/jobs/filters";
import { DATE_POSTED_OPTIONS } from "@/lib/jobs/constants";

type Lookup = { id: string; slug: string; name: string };
type SkillLookup = { slug: string; name: string };

const selectCls = "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground";
const groupCls = "border-b border-border py-5 first:pt-0 last:border-b-0";
const labelCls = "text-xs font-semibold uppercase tracking-widest text-muted-foreground";

const LOCATION_TYPES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "on_site", label: "On-site" },
];
const EXPERIENCE_LEVELS = [
  { value: "entry", label: "No experience / Entry" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "executive", label: "Executive" },
];

export function JobFiltersSidebar({
  filters,
  onChange,
  categories,
  types,
  skills,
}: {
  filters: JobFilters;
  onChange: (patch: Partial<JobFilters>) => void;
  categories: Lookup[];
  types: Lookup[];
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
          placeholder="Job title, skill, keyword..."
          className={`${selectCls} mt-2`}
        />
      </div>

      <div className={groupCls}>
        <p className={labelCls}>Location</p>
        <div className="mt-2 grid gap-2">
          <select value={filters.locationType} onChange={(e) => onChange({ locationType: e.target.value })} className={selectCls}>
            <option value="">Remote & on-site</option>
            {LOCATION_TYPES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <input
            value={filters.country}
            onChange={(e) => onChange({ country: e.target.value })}
            placeholder="Country, e.g. Nigeria"
            className={selectCls}
          />
        </div>
      </div>

      <div className={groupCls}>
        <p className={labelCls}>Category</p>
        <select value={filters.category} onChange={(e) => onChange({ category: e.target.value })} className={`${selectCls} mt-2`}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      <div className={groupCls}>
        <p className={labelCls}>Job type</p>
        <select value={filters.type} onChange={(e) => onChange({ type: e.target.value })} className={`${selectCls} mt-2`}>
          <option value="">All job types</option>
          {types.map((t) => <option key={t.id} value={t.slug}>{t.name}</option>)}
        </select>
      </div>

      <div className={groupCls}>
        <p className={labelCls}>Experience level</p>
        <select value={filters.experience} onChange={(e) => onChange({ experience: e.target.value })} className={`${selectCls} mt-2`}>
          <option value="">All experience levels</option>
          {EXPERIENCE_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
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

      <div className={groupCls}>
        <p className={labelCls}>Salary</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input value={filters.salaryMin} onChange={(e) => onChange({ salaryMin: e.target.value })} type="number" placeholder="Min" className={selectCls} />
          <input value={filters.salaryMax} onChange={(e) => onChange({ salaryMax: e.target.value })} type="number" placeholder="Max" className={selectCls} />
        </div>
        <input value={filters.currency} onChange={(e) => onChange({ currency: e.target.value })} placeholder="Currency, e.g. USD" className={`${selectCls} mt-2`} />
      </div>

      <div className={groupCls}>
        <p className={labelCls}>Date posted</p>
        <select value={filters.datePosted} onChange={(e) => onChange({ datePosted: e.target.value })} className={`${selectCls} mt-2`}>
          {DATE_POSTED_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      <div className={groupCls}>
        <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
          <input type="checkbox" checked={filters.closingSoon} onChange={(e) => onChange({ closingSoon: e.target.checked })} />
          Closing soon
        </label>
      </div>

      <div className={groupCls}>
        <p className={labelCls}>Company</p>
        <input
          value={filters.company}
          onChange={(e) => onChange({ company: e.target.value })}
          placeholder="Search companies..."
          className={`${selectCls} mt-2`}
        />
      </div>
    </div>
  );
}
