"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { supabase } from "@/lib/supabase";

type Lookup = { id: string; slug: string; name: string };

type JobCard = {
  id: string;
  slug: string;
  title: string;
  location_type: "remote" | "hybrid" | "on_site";
  country: string | null;
  city: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  deadline_at: string | null;
  featured: boolean;
  companies: { name: string } | null;
  job_categories: { name: string } | null;
  job_types: { name: string } | null;
};

const EXPERIENCE_LEVELS = ["entry", "junior", "mid", "senior", "executive"] as const;

const selectCls = "rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground";

function locationLabel(j: JobCard) {
  if (j.location_type === "remote") return "Remote";
  return [j.location_type === "hybrid" ? "Hybrid" : "On-site", j.city, j.country].filter(Boolean).join(" · ");
}

function salaryLabel(j: JobCard) {
  if (!j.salary_min && !j.salary_max) return null;
  const cur = j.salary_currency || "";
  if (j.salary_min && j.salary_max) return `${cur} ${j.salary_min.toLocaleString()}–${j.salary_max.toLocaleString()}`;
  return `${cur} ${(j.salary_min || j.salary_max)?.toLocaleString()}`;
}

export default function JobsPage() {
  const [categories, setCategories] = useState<Lookup[]>([]);
  const [types, setTypes] = useState<Lookup[]>([]);
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [locationType, setLocationType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");

  useEffect(() => {
    Promise.all([
      supabase.from("job_categories").select("id, slug, name").order("name"),
      supabase.from("job_types").select("id, slug, name").order("name"),
    ]).then(([cats, jobTypes]) => {
      setCategories(cats.data || []);
      setTypes(jobTypes.data || []);
    });
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("jobs")
      .select("id, slug, title, location_type, country, city, salary_min, salary_max, salary_currency, deadline_at, featured, companies(name), job_categories(name), job_types(name)")
      .eq("status", "published")
      // Imported listings get a 30-day expires_at as a staleness safety
      // net (see runImportForSource) - manually created jobs leave it null
      // and never get filtered out here.
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (categoryId) query = query.eq("category_id", categoryId);
    if (typeId) query = query.eq("type_id", typeId);
    if (locationType) query = query.eq("location_type", locationType);
    if (experienceLevel) query = query.eq("experience_level", experienceLevel);
    if (search.trim()) query = query.ilike("title", `%${search.trim()}%`);

    const { data } = await query.limit(30);
    setJobs(((data as unknown as JobCard[]) || []));
    setLoading(false);
  }, [categoryId, typeId, locationType, experienceLevel, search]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  return (
    <div className="min-h-screen bg-background py-16">
      <Container>
        <Reveal>
          <div className="mb-10 text-center">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Work</div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Jobs worth applying for</h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Remote, tech and entry-level roles, curated for people building their careers.</p>
          </div>
        </Reveal>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job titles…"
            className={`${selectCls} w-full sm:w-64`}
          />
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectCls}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={selectCls}>
            <option value="">All job types</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={locationType} onChange={(e) => setLocationType(e.target.value)} className={selectCls}>
            <option value="">Remote &amp; on-site</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="on_site">On-site</option>
          </select>
          <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className={selectCls}>
            <option value="">All experience levels</option>
            {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : jobs.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <p className="text-foreground font-semibold">No jobs match right now.</p>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing a filter, or check back soon - new roles are added regularly.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((j) => (
              <Link key={j.id} href={`/jobs/${j.slug}`} className="group block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-primary">{j.job_categories?.name || "Job"}</span>
                  {j.featured && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Featured</span>}
                </div>
                <h3 className="mt-2 text-lg font-bold text-foreground">{j.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{j.companies?.name || "Prowess Digital Solutions"}</p>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{locationLabel(j)}</span>
                  {j.job_types?.name && <span>· {j.job_types.name}</span>}
                  {salaryLabel(j) && <span>· {salaryLabel(j)}</span>}
                </div>
                {j.deadline_at && (
                  <p className="mt-3 text-xs text-muted-foreground">Apply by {new Date(j.deadline_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
