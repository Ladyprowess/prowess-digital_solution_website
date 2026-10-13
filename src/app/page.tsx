"use client";

import { useEffect, useState } from "react";


import HomeLaunchpad from "@/components/home/HomeLaunchpad";


import { type ListingCardMeta } from "@/components/ListingCard";
import { type ResourceItem } from "@/components/resources/ResourceCard";
import { type VideoCardData } from "@/components/videos/VideoCard";
import { supabase } from "@/lib/supabase";
import { newsletterPreferences } from "@/content/site";



type OpportunityCard = {
  id: string;
  kind: "job" | "opportunity";
  title: string;
  subtitle: string;
  eyebrow: string;
  meta: ListingCardMeta[];
  href: string;
};

type CareerPathCard = { id: string; slug: string; title: string; description: string | null };
type LearnCard = { id: string; slug: string; title: string; description: string | null; access: string; price_usd: number | null; price_ngn: number | null };
type EventCard = { id: string; slug: string; title: string; date: string; type: string | null };

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  function toggle(key: string) {
    setChecked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    const preferences = checked.flatMap((key) => {
      const pref = newsletterPreferences.find((p) => p.key === key);
      return pref ? [pref.key, ...("also" in pref ? pref.also : [])] : [key];
    });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, preferences: preferences.length ? preferences : ["general"], source: "homepage-newsletter" }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("ok");
        setMessage("You're on the list.");
        setEmail("");
        setChecked([]);
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="homepage-newsletter-email" className="sr-only">Email address</label>
        <input
          id="homepage-newsletter-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="min-h-12 w-full min-w-0 rounded-lg border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex min-h-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {status === "loading" ? "Joining..." : "Get updates"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
        {newsletterPreferences.map((p) => (
          <label key={p.key} className="flex min-h-10 items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={checked.includes(p.key)} onChange={() => toggle(p.key)} />
            {p.label}
          </label>
        ))}
      </div>
      {message && <p role="status" className={`mt-3 text-center text-sm ${status === "ok" ? "text-primary" : "text-red-600"}`}>{message}</p>}
    </form>
  );
}

export default function ModernHomePage() {
  const [opportunities, setOpportunities] = useState<OpportunityCard[]>([]);
  const [careerPathCards, setCareerPathCards] = useState<CareerPathCard[]>([]);
  const [courses, setCourses] = useState<LearnCard[]>([]);
  const [curatedHero, setCuratedHero] = useState<ResourceItem | null>(null);
  const [curatedRest, setCuratedRest] = useState<ResourceItem[]>([]);
  const [homepageVideos, setHomepageVideos] = useState<VideoCardData[]>([]);
  const [events, setEvents] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
      const [jobsRes, oppsRes, pathsRes, coursesRes, curatedHeroRes, curatedRestRes, homepageVideosRes, eventsRes] = await Promise.all([
        // published_at, not created_at -- for imported listings this is the
        // source's real posting date (see supabase/source_published_at.sql),
        // not when Prowess happened to import them. Matches /jobs and
        // /opportunities' own "newest" sort.
        supabase.from("jobs").select("id, slug, title, location_type, country, published_at, featured, companies(name), job_categories(name)").eq("status", "published").or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`).order("published_at", { ascending: false, nullsFirst: false }).limit(4).abortSignal(controller.signal),
        supabase.from("opportunities").select("id, slug, title, organisation_name, published_at, featured, opportunity_types(name)").eq("status", "published").or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`).order("published_at", { ascending: false, nullsFirst: false }).limit(4).abortSignal(controller.signal),
        supabase.from("career_paths").select("id, slug, title, description").eq("status", "published").order("created_at", { ascending: false }).limit(6).abortSignal(controller.signal),
        supabase.from("courses").select("id, slug, title, description, access, price_usd, price_ngn").eq("status", "published").order("created_at", { ascending: false }).limit(4).abortSignal(controller.signal),
        // Admin-curated "Resources worth exploring" -- the one and only
        // homepage resources section. Deliberately not access-driven (no
        // more separate Free/Premium feeds): a resource shows here purely
        // because show_on_homepage is checked, whether it's free or paid,
        // an ebook or a guide. Fetched as two separate queries rather than
        // one list sliced client-side -- /api/resources only ever orders by
        // created_at, so a single pageSize-capped fetch could cut off the
        // actual featured pick before it ever reaches the client if 5+
        // resources are curated.
        fetch("/api/resources?show_on_homepage=true&featured=true&exclude_resource_type=video&pageSize=1", { signal: controller.signal }).then((r) => r.ok ? r.json() : { error: true }).catch(() => ({ error: true })),
        fetch("/api/resources?show_on_homepage=true&exclude_resource_type=video&pageSize=5", { signal: controller.signal }).then((r) => r.ok ? r.json() : { error: true }).catch(() => ({ error: true })),
        // Direct query, not /api/resources -- video covers come from
        // thumbnail_url/YouTube, not a signed Storage cover_path, so there's
        // no reason to route through the server for these (unlike the
        // curated-resources fetch above, which needs the route's signing).
        supabase.from("resources").select("id, slug, title, description, category, source, external_url, thumbnail_url, access")
          .eq("status", "published").eq("resource_type", "video").eq("show_on_homepage", true)
          .order("featured", { ascending: false }).order("created_at", { ascending: false }).limit(4).abortSignal(controller.signal),
        supabase.from("events").select("id, slug, title, date, type").eq("status", "published").gte("date", new Date().toISOString()).order("date", { ascending: true }).limit(3).abortSignal(controller.signal),
      ]);

      if (cancelled) return;
      setLoadError([jobsRes, oppsRes, pathsRes, coursesRes, curatedHeroRes, curatedRestRes, homepageVideosRes, eventsRes].some(r => Boolean(r?.error)));

      type JobQueryRow = { id: string; slug: string; title: string; location_type: string; country: string | null; featured: boolean; companies: { name: string } | null; job_categories: { name: string } | null };
      type OppQueryRow = { id: string; slug: string; title: string; organisation_name: string | null; featured: boolean; opportunity_types: { name: string } | null };

      const jobCards: OpportunityCard[] = ((jobsRes.data || []) as unknown as JobQueryRow[]).map((j) => ({
        id: j.id,
        kind: "job",
        title: j.title,
        subtitle: j.companies?.name || "Prowess Digital Solutions",
        eyebrow: j.job_categories?.name || "Job",
        meta: j.location_type === "remote" ? [{ icon: "pin", text: "Remote" }] : [{ icon: "pin", text: [j.location_type, j.country].filter(Boolean).join(" · ") || "Job" }],
        href: `/jobs/${j.slug}`,
      }));
      const oppCards: OpportunityCard[] = ((oppsRes.data || []) as unknown as OppQueryRow[]).map((o) => ({
        id: o.id,
        kind: "opportunity",
        title: o.title,
        subtitle: o.organisation_name || o.opportunity_types?.name || "Opportunity",
        eyebrow: o.opportunity_types?.name || "Opportunity",
        meta: [],
        href: `/opportunities/${o.slug}`,
      }));
      setOpportunities([...jobCards, ...oppCards]);

      setCareerPathCards(pathsRes.data || []);

      // Free and premium courses together, same "don't split by price"
      // principle now applied everywhere on the homepage - a course card
      // shows its own Free/Premium badge instead of living in a separate
      // price-tiered section.
      setCourses((coursesRes.data || []) as LearnCard[]);

      const curatedHeroItems = (curatedHeroRes?.items || []) as ResourceItem[];
      const curatedRestItems = (curatedRestRes?.items || []) as ResourceItem[];
      const hero = curatedHeroItems[0] || curatedRestItems[0] || null;
      setCuratedHero(hero);
      setCuratedRest(curatedRestItems.filter((r) => r.id !== hero?.id).slice(0, 4));

      setHomepageVideos((homepageVideosRes.data || []) as VideoCardData[]);
      setEvents((eventsRes.data || []) as EventCard[]);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [attempt]);

  return <HomeLaunchpad
    opportunities={opportunities} courses={courses} paths={careerPathCards}
    resources={curatedHero ? [curatedHero, ...curatedRest] : curatedRest}
    videos={homepageVideos} events={events} loading={loading} error={loadError}
    retry={() => setAttempt(value => value + 1)} newsletter={<NewsletterForm />}
  />;
}
