"use client";

import { useState } from "react";
import type { JobFilters } from "@/lib/jobs/filters";

type Lookup = { id: string; slug: string; name: string };

// The filter-aware sibling of the navbar's generic JobAlertsModal ("just
// email me"). Both post to the same /api/subscribe endpoint - this one also
// sends a `filters` payload so the alert can actually match what someone
// was searching for, not just "any new job."
export function JobAlertsSection({
  currentFilters,
  categories,
  skills,
}: {
  currentFilters: JobFilters;
  categories: Lookup[];
  skills: Lookup[];
}) {
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState(currentFilters.category);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(currentFilters.skills);
  const [location, setLocation] = useState(currentFilters.country);
  const [remote, setRemote] = useState(currentFilters.locationType === "remote");
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
          preference: "jobs",
          source: "jobs-page-alerts",
          filterKey: "jobs",
          filters: { category: category || null, skills: selectedSkills, location: location || null, remote, keywords: keywords || null },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("ok");
        setMessage("You're on the list. We'll email you when matching jobs are added.");
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
      <p className="mt-1 text-sm text-muted-foreground">Get notified when jobs matching your interests are added.</p>

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
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
            <option value="">Any category</option>
            {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Keywords, e.g. Cybersecurity"
            className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location, e.g. Nigeria"
            className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
          />
          <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
            <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} />
            Remote only
          </label>
        </div>

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
          {status === "loading" ? "Saving…" : "Get Job Alerts"}
        </button>
        {message && <p className={`text-sm ${status === "ok" ? "text-primary" : "text-red-600"}`}>{message}</p>}
      </form>
    </section>
  );
}
