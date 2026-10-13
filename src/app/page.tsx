"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, BriefcaseBusiness, CheckCircle2, Clapperboard, ClipboardCheck, Inbox } from "lucide-react";
import { ManualGoogleReviews } from "@/components/ManualGoogleReviews";
import { HeroSection } from "@/components/HeroSection";
import { Reveal } from "@/components/Reveal";
import { ListingCard, type ListingCardMeta } from "@/components/ListingCard";
import ResourceCard, { type ResourceItem } from "@/components/resources/ResourceCard";
import { VideoCard, type VideoCardData } from "@/components/videos/VideoCard";
import { supabase } from "@/lib/supabase";
import { goalCards, popularSearches, whyProwess, newsletterPreferences } from "@/content/site";
import { formatMoney } from "@/lib/formatMoney";
import { stripHtmlForMeta } from "@/lib/stripHtml";

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

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Inbox size={22} aria-hidden="true" />
      </span>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}

function SectionSkeleton({ count = 3, columns = "lg:grid-cols-3" }: { count?: number; columns?: string }) {
  return (
    <div className={`grid gap-5 sm:grid-cols-2 ${columns}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-lg border border-border bg-card p-5">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="mt-5 h-5 w-3/4 rounded bg-muted" />
          <div className="mt-3 h-3 w-full rounded bg-muted" />
          <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

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
      {message && <p className={`mt-3 text-center text-sm ${status === "ok" ? "text-primary" : "text-red-600"}`}>{message}</p>}
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
  // This page fetches everything exactly once on mount (no filters/re-fetch
  // triggers), so a plain useState here can't go stale the way a per-item
  // component's would need a reset effect for.
  const [heroCoverFailed, setHeroCoverFailed] = useState(false);

  useEffect(() => {
    (async () => {
      const [jobsRes, oppsRes, pathsRes, coursesRes, curatedHeroRes, curatedRestRes, homepageVideosRes, eventsRes] = await Promise.all([
        // published_at, not created_at -- for imported listings this is the
        // source's real posting date (see supabase/source_published_at.sql),
        // not when Prowess happened to import them. Matches /jobs and
        // /opportunities' own "newest" sort.
        supabase.from("jobs").select("id, slug, title, location_type, country, published_at, featured, companies(name), job_categories(name)").eq("status", "published").or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`).order("published_at", { ascending: false, nullsFirst: false }).limit(4),
        supabase.from("opportunities").select("id, slug, title, organisation_name, published_at, featured, opportunity_types(name)").eq("status", "published").or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`).order("published_at", { ascending: false, nullsFirst: false }).limit(4),
        supabase.from("career_paths").select("id, slug, title, description").eq("status", "published").order("created_at", { ascending: false }).limit(6),
        supabase.from("courses").select("id, slug, title, description, access, price_usd, price_ngn").eq("status", "published").order("created_at", { ascending: false }).limit(4),
        // Admin-curated "Resources worth exploring" -- the one and only
        // homepage resources section. Deliberately not access-driven (no
        // more separate Free/Premium feeds): a resource shows here purely
        // because show_on_homepage is checked, whether it's free or paid,
        // an ebook or a guide. Fetched as two separate queries rather than
        // one list sliced client-side -- /api/resources only ever orders by
        // created_at, so a single pageSize-capped fetch could cut off the
        // actual featured pick before it ever reaches the client if 5+
        // resources are curated.
        fetch("/api/resources?show_on_homepage=true&featured=true&exclude_resource_type=video&pageSize=1").then((r) => r.json()),
        fetch("/api/resources?show_on_homepage=true&exclude_resource_type=video&pageSize=5").then((r) => r.json()),
        // Direct query, not /api/resources -- video covers come from
        // thumbnail_url/YouTube, not a signed Storage cover_path, so there's
        // no reason to route through the server for these (unlike the
        // curated-resources fetch above, which needs the route's signing).
        supabase.from("resources").select("id, slug, title, description, category, source, external_url, thumbnail_url, access")
          .eq("status", "published").eq("resource_type", "video").eq("show_on_homepage", true)
          .order("featured", { ascending: false }).order("created_at", { ascending: false }).limit(4),
        supabase.from("events").select("id, slug, title, date, type").eq("status", "published").gte("date", new Date().toISOString()).order("date", { ascending: true }).limit(3),
      ]);

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
      setOpportunities([...jobCards, ...oppCards].slice(0, 6));

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
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background" id="top">

      {/* HERO */}
      <HeroSection />

      {/* POPULAR SEARCHES */}
      <section className="bg-background py-14">
        <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
          <p className="mb-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Popular Searches</p>
          <div className="flex flex-wrap justify-center gap-3">
            {popularSearches.map((s) => (
              <Link key={s.label} href={s.href} className="inline-flex min-h-10 items-center rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT DO YOU WANT TO DO */}
      <section className="border-y border-border bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What are you here to do?
            </h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {goalCards.map((g, idx) => (
              <Reveal key={g.title} delay={idx * 60}>
                <Link href={g.href} className="group block h-full rounded-lg border border-border bg-card p-5 transition-[border-color,background-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <h3 className="mb-2 text-base font-bold text-foreground">{g.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{g.desc}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* LATEST OPPORTUNITIES */}
      <section className="bg-muted py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="mb-10 text-center">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Fresh On Prowess Digital Solutions</div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Opportunities worth knowing about</h2>
              <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">Jobs, grants, internships, fellowships, and openings that can move a person or a business forward.</p>
            </div>
          </Reveal>
          {loading ? (
            <SectionSkeleton />
          ) : opportunities.length === 0 ? (
            <EmptyState>New jobs and opportunities will appear here as soon as they are published. <Link href="/#launch" className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Get notified</Link> when new listings go live.</EmptyState>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {opportunities.map((o) => (
                <ListingCard
                  key={o.id}
                  href={o.href}
                  icon={o.kind === "job" ? "briefcase" : "spark"}
                  colorSeed={o.eyebrow}
                  eyebrow={o.eyebrow}
                  title={o.title}
                  subtitle={o.subtitle}
                  meta={o.meta}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CAREER PATHS */}
      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="mb-10 text-center">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Grow With Intention</div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Where do you want your career to go?</h2>
            </div>
          </Reveal>
          {loading ? (
            <SectionSkeleton />
          ) : careerPathCards.length === 0 ? (
            <EmptyState>Career paths are being built out. This is where guided roadmaps like Cybersecurity or Digital Marketing will live.</EmptyState>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {careerPathCards.map((c) => (
                <ListingCard
                  key={c.id}
                  href={`/career-paths/${c.slug}`}
                  icon="path"
                  colorSeed={c.title}
                  eyebrow="Career Path"
                  title={c.title}
                  description={c.description ? stripHtmlForMeta(c.description, 140) : null}
                />
              ))}
            </div>
          )}
          {careerPathCards.length > 0 && (
            <div className="mt-8 text-center">
              <Link href="/career-paths" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Explore all career paths</Link>
            </div>
          )}
        </div>
      </section>

      {/* LEARN */}
      <section className="bg-muted py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="mb-10 text-center">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Learn</div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Learn something useful</h2>
              <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">Courses and practical lessons for careers, business, digital skills, and everyday growth.</p>
            </div>
          </Reveal>
          {loading ? (
            <SectionSkeleton count={4} columns="lg:grid-cols-4" />
          ) : courses.length === 0 ? (
            <EmptyState>Courses are coming soon.</EmptyState>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {courses.map((c) => (
                <ListingCard
                  key={c.id}
                  href={`/learn/${c.slug}`}
                  icon="spark"
                  colorSeed={c.title}
                  eyebrow={c.access === "premium" ? "Premium" : "Free"}
                  title={c.title}
                  description={c.description ? stripHtmlForMeta(c.description, 140) : null}
                  footer={
                    c.access === "premium" && (c.price_usd || c.price_ngn)
                      ? [
                          c.price_usd ? formatMoney(c.price_usd, "USD") : null,
                          c.price_ngn ? formatMoney(c.price_ngn, "NGN") : null,
                        ].filter(Boolean).join(" / ")
                      : null
                  }
                />
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <Link href="/learn" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Explore the learning library</Link>
          </div>
        </div>
      </section>

      {/* WATCH SOMETHING USEFUL */}
      {!loading && homepageVideos.length > 0 && (
        <section className="bg-background py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Reveal>
              <div className="mb-10 text-center">
                <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Videos</div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Watch something useful</h2>
              </div>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {homepageVideos.map((v) => <VideoCard key={v.id} video={v} />)}
            </div>
            <div className="mt-8 text-center">
              <Link href="/videos" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Explore all videos</Link>
            </div>
          </div>
        </section>
      )}

      {/* FROM THE LIBRARY -- the one and only homepage resources section,
          admin-curated via show_on_homepage. Deliberately not split by
          price - a free guide and a paid ebook sit side by side here, same
          as they will everywhere else in the library. One large featured
          pick plus a few smaller ones. */}
      {!loading && curatedHero && (() => {
        const heroCoverSrc = curatedHero.cover_url || curatedHero.thumbnail_url || null;
        return (
          <section className="bg-muted py-20 sm:py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <Reveal>
                <div className="mb-10 text-center">
                  <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">The Library</div>
                  <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Books, guides, and tools for later</h2>
                  <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">Build a personal shelf of ebooks, templates, articles, and business guides you can save and return to.</p>
                </div>
              </Reveal>
              <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
                <Reveal>
                  <Link href={`/resources/${curatedHero.slug}`} className="group block overflow-hidden rounded-lg border border-border bg-card transition-[border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    {heroCoverSrc && !heroCoverFailed ? (
                      // Fixed aspect ratio, not a pixel height -- this
                      // column is full-width below lg and a 3fr column
                      // above it, so a fixed height (h-64/h-80) forced a
                      // much narrower effective aspect ratio on mobile
                      // than on desktop, cropping cover text off far worse
                      // there. An aspect ratio keeps the crop proportional
                      // at every width instead.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={heroCoverSrc} alt={curatedHero.title} className="aspect-[16/9] w-full object-cover" onError={() => setHeroCoverFailed(true)} />
                    ) : (
                      <div className="flex aspect-[16/9] w-full items-center justify-center bg-muted text-sm text-muted-foreground">No cover image</div>
                    )}
                    <div className="p-6">
                      <span className="text-xs font-bold uppercase tracking-widest text-primary">Featured Resource</span>
                      <h3 className="mt-2 text-xl font-bold text-foreground">{curatedHero.title}</h3>
                      {curatedHero.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{curatedHero.description}</p>}
                    </div>
                  </Link>
                </Reveal>
                {curatedRest.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    {curatedRest.map((r, i) => (
                      <Reveal key={r.id} delay={(i + 1) * 40}>
                        <ResourceCard item={r} />
                      </Reveal>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-8 text-center">
                <Link href="/resources" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Explore all resources</Link>
              </div>
            </div>
          </section>
        );
      })()}

      {/* TOOLS */}
      <section className="bg-primary py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8 text-center">
          <div className="inline-flex items-center rounded-md bg-primary-foreground/10 px-4 py-2 text-xs font-semibold text-primary-foreground ring-1 ring-primary-foreground/15">Tools</div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">Tools to help you move forward</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/85">
            Explore business calculators and trackers alongside CV Builder, CV Checker, Interview Prep and Portfolio Builder. Each tool explains its features and access requirements.
          </p>
          <Link href="/tools" className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary-foreground px-7 text-sm font-semibold text-primary transition-[background-color,transform] duration-150 ease-out hover:scale-[1.01] hover:bg-primary-foreground/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            Explore all tools
          </Link>
        </div>
      </section>

      {/* EVENTS */}
      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="mb-10 text-center">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Connect</div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">What&rsquo;s happening</h2>
            </div>
          </Reveal>
          {loading ? (
            <SectionSkeleton count={3} />
          ) : events.length === 0 ? (
            <EmptyState>There are no upcoming events right now. New workshops, meetups and sessions will appear here when dates are confirmed.</EmptyState>
          ) : (
            <div className="grid gap-5 sm:grid-cols-3">
              {events.map((e) => (
                <Link key={e.id} href={`/events/${e.slug}`} className="block rounded-lg border border-border bg-card p-5 transition-[border-color,background-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{e.type || "Event"}</span>
                  <h3 className="mt-1 text-base font-bold text-foreground">{e.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{new Date(e.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <Link href="/events" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Explore events</Link>
          </div>
        </div>
      </section>

      {/* FOR BUSINESSES */}
      <section className="bg-muted py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] lg:items-end">
              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">For Businesses</div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Build the systems your business keeps needing.</h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  Practical tools, resources and services for founders who want clearer operations, stronger offers and better day to day control.
                </p>
                <Link href="/services" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  Explore business support
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {["Clarify your offer", "Track the numbers", "Document the work"].map((item) => (
                  <div key={item} className="rounded-lg border border-border bg-card p-4">
                    <CheckCircle2 size={18} className="text-primary" aria-hidden="true" />
                    <p className="mt-3 text-sm font-bold text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/tools", icon: ClipboardCheck, title: "Business Tools", desc: "Calculators, trackers and simple helpers for everyday decisions." },
              { href: "/resources", icon: BookOpen, title: "Business Resources", desc: "Guides, SOP templates, checklists and practical reading." },
              { href: "/videos?audience=business", icon: Clapperboard, title: "Business Videos", desc: "Strategy, marketing and growth lessons you can watch." },
              { href: "/services", icon: BriefcaseBusiness, title: "Business Services", desc: "Diagnostics, SOPs, playbooks and dashboards built with you." },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="group flex min-h-44 flex-col rounded-lg border border-border bg-card p-5 transition-[border-color,background-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-primary/35 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-base font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Open
                  <ArrowRight size={15} aria-hidden="true" className="transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Why Prowess Digital Solutions</div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">One place to keep moving forward.</h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                  Find jobs, learning, resources, career direction, business guidance and practical tools without jumping between too many places.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {whyProwess.map((w, index) => (
                  <div key={w.title} className="rounded-lg border border-border bg-card p-5">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">{String(index + 1).padStart(2, "0")}</span>
                    <h3 className="mt-4 text-base font-bold text-foreground">{w.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{w.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ABOUT / FOUNDER PROOF */}
      <section className="bg-muted py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/training.JPG"
              alt="Training a group in person"
              className="w-full rounded-3xl border border-border object-cover shadow-sm"
            />
          </Reveal>
          <Reveal delay={100}>
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Hands-on, not just online</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Built by someone who has actually taught this.</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Before Prowess Digital Solutions was a platform, it was people in a room, learning skills that changed what they could do next. That same hands-on approach shapes every course, resource, and career path here.
            </p>
          </Reveal>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <ManualGoogleReviews />

      {/* GET UPDATES */}
      <section className="bg-muted py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <Reveal>
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Stay Connected</div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Don&rsquo;t miss your next opportunity.</h2>
            <p className="mb-8 text-lg text-muted-foreground">Get new opportunities, resources, learning content and Prowess Digital Solutions updates in your inbox.</p>
            <NewsletterForm />
          </Reveal>
        </div>
      </section>

    </div>
  );
}
