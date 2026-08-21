"use client";

import { useState } from "react";
import type { OpportunityFilters } from "@/lib/opportunities/filters";

type Lookup = { id: string; slug: string; name: string };

// Types that map onto an existing granular newsletter preference key
// (/api/subscribe's VALID_PREFERENCES) - everything else (fellowships,
// competitions, accelerators, volunteer, programs, other, freelance) falls
// back to "general" rather than inventing new preference keys.
const TYPE_TO_PREFERENCE: Record<string, string> = {
  internships: "internships",
  grants: "grants",
  scholarships: "scholarships",
};

// The filter-aware sibling of the generic navbar JobAlertsModal, for
// opportunities. Posts to the same /api/subscribe endpoint as job alerts,
// namespaced under filters.opportunities so it never overwrites a saved
// job search for the same email (see /api/subscribe/route.ts).
export function OpportunityAlertsSection({
  currentFilters,
  types,
  skills,
}: {
  currentFilters: OpportunityFilters;
  types: Lookup[];
  skills: Lookup[];
}) {
  const [email, setEmail] = useState("");
  const [type, setType] = useState(currentFilters.type);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(currentFilters.skills);
  const [location, setLocation] = useState(currentFilters.eligibleLocation);
  const [keywords, setKeywords] = useState(currentFilters.q);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  function toggleSkill(slug: string) {
    setSelectedSkills((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          preference: TYPE_TO_PREFERENCE[type] || "general",
          source: "opportunities-page-alerts",
          filterKey: "opportunities",
          filters: { type: type || null, skills: selectedSkills, location: location || null, keywords: keywords || null },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("ok");
        setMessage("You're on the list. We'll email you when matching opportunities are added.");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong.");
    }
  }

  return (
    <section className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-8">
      <h2 className="text-lg font-bold text-foreground">Don&rsquo;t want to keep checking?</h2>
      <p className="mt-1 text-sm text-muted-foreground">Get notified when opportunities matching your interests are added.</p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
            <option value="">Any type</option>
            {types.map((t) => <option key={t.id} value={t.slug}>{t.name}</option>)}
          </select>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Keywords, e.g. Cybersecurity"
            className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
          />
        </div>

        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Eligibility location, e.g. Nigeria, Africa"
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
        />

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 20).map((s) => (
              <button
                key={s.slug}
                type="button"
                onClick={() => toggleSkill(s.slug)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  selectedSkills.includes(s.slug) ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90 disabled:opacity-60"
        >
          {status === "loading" ? "Saving…" : "Get Opportunity Alerts"}
        </button>
        {message && <p className={`text-sm ${status === "ok" ? "text-primary" : "text-red-600"}`}>{message}</p>}
      </form>
    </section>
  );
}
