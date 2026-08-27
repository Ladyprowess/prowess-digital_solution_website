"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ManualGoogleReviews } from "@/components/ManualGoogleReviews";
import { HeroSection } from "@/components/HeroSection";
import { Reveal } from "@/components/Reveal";
import { ListingCard, type ListingCardMeta } from "@/components/ListingCard";
import ResourceCard, { type ResourceItem } from "@/components/resources/ResourceCard";
import { VideoCard, type VideoCardData } from "@/components/videos/VideoCard";
import { ContinueWatching } from "@/components/videos/ContinueWatching";
import { supabase } from "@/lib/supabase";
import { goalCards, popularSearches, whyProwess, newsletterPreferences } from "@/content/site";

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
type LearnCard = { id: string; slug: string; title: string; description: string | null; access: string; price: number | null; price_currency: string | null };
type EventCard = { id: string; slug: string; title: string; date: string; type: string | null };

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center text-sm text-muted-foreground">{children}</p>;
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
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full min-w-0 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex flex-shrink-0 items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90 disabled:opacity-60"
        >
          {status === "loading" ? "Joining…" : "Get Updates"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
        {newsletterPreferences.map((p) => (
          <label key={p.key} className="flex items-center gap-2 text-sm text-muted-foreground">
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
  const [freeResources, setFreeResources] = useState<ResourceItem[]>([]);
  const [curatedHero, setCuratedHero] = useState<ResourceItem | null>(null);
  const [curatedRest, setCuratedRest] = useState<ResourceItem[]>([]);
  const [premiumItems, setPremiumItems] = useState<(LearnCard | ResourceItem)[]>([]);
  const [homepageVideos, setHomepageVideos] = useState<VideoCardData[]>([]);
  const [events, setEvents] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);
  // This page fetches everything exactly once on mount (no filters/re-fetch
  // triggers), so a plain useState here can't go stale the way a per-item
  // component's would need a reset effect for.
  const [heroCoverFailed, setHeroCoverFailed] = useState(false);

  useEffect(() => {
    (async () => {
      const [jobsRes, oppsRes, pathsRes, coursesRes, freeResourcesRes, premiumResourcesRes, curatedHeroRes, curatedRestRes, homepageVideosRes, eventsRes] = await Promise.all([
        // published_at, not created_at -- for imported listings this is the
        // source's real posting date (see supabase/source_published_at.sql),
        // not when Prowess happened to import them. Matches /jobs and
        // /opportunities' own "newest" sort.
        supabase.from("jobs").select("id, slug, title, location_type, country, published_at, featured, companies(name), job_categories(name)").eq("status", "published").or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`).order("published_at", { ascending: false, nullsFirst: false }).limit(4),
        supabase.from("opportunities").select("id, slug, title, organisation_name, published_at, featured, opportunity_types(name)").eq("status", "published").or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`).order("published_at", { ascending: false, nullsFirst: false }).limit(4),
        supabase.from("career_paths").select("id, slug, title, description").eq("status", "published").order("created_at", { ascending: false }).limit(6),
        supabase.from("courses").select("id, slug, title, description, access, price, price_currency").eq("status", "published").order("created_at", { ascending: false }).limit(6),
        // exclude_resource_type keeps videos out of these two -- they get
        // their own dedicated section below instead of double-appearing.
        // exclude_show_on_homepage keeps out anything already shown in the
        // curated "Resources worth exploring" section (nothing stops an
        // admin flagging a resource both show_in_library and
        // show_on_homepage at once).
        fetch("/api/resources?access=free&audience=consumer,both&pageSize=6&sort=recent&exclude_resource_type=video&exclude_show_on_homepage=true").then((r) => r.json()),
        fetch("/api/resources?access=premium&audience=consumer,both&pageSize=4&sort=recent&exclude_resource_type=video&exclude_show_on_homepage=true").then((r) => r.json()),
        // Admin-curated "Resources worth exploring" -- independent of the
        // un-curated Free/Premium feeds above (those are access-driven,
        // this is a deliberate editorial pick via show_on_homepage, same
        // curation concept as the video section below). Fetched as two
        // separate queries rather than one list sliced client-side --
        // /api/resources only ever orders by created_at, so a single
        // pageSize-capped fetch could cut off the actual featured pick
        // before it ever reaches the client if 5+ resources are curated.
        fetch("/api/resources?show_on_homepage=true&featured=true&audience=consumer,both&exclude_resource_type=video&pageSize=1").then((r) => r.json()),
        fetch("/api/resources?show_on_homepage=true&audience=consumer,both&exclude_resource_type=video&pageSize=5").then((r) => r.json()),
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

      const publishedCourses = (coursesRes.data || []) as LearnCard[];
      setCourses(publishedCourses.filter((c) => c.access === "free").slice(0, 4));

      setFreeResources((freeResourcesRes?.items || []) as ResourceItem[]);

      const curatedHeroItems = (curatedHeroRes?.items || []) as ResourceItem[];
      const curatedRestItems = (curatedRestRes?.items || []) as ResourceItem[];
      const hero = curatedHeroItems[0] || curatedRestItems[0] || null;
      setCuratedHero(hero);
      setCuratedRest(curatedRestItems.filter((r) => r.id !== hero?.id).slice(0, 4));

      const premium = [
        ...publishedCourses.filter((c) => c.access === "premium"),
        ...((premiumResourcesRes?.items || []) as ResourceItem[]),
      ].slice(0, 4);
      setPremiumItems(premium);

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
              <Link key={s.label} href={s.href} className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:text-primary">
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {goalCards.map((g, idx) => (
              <Reveal key={g.title} delay={idx * 60}>
                <Link href={g.href} className="group block h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
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
            </div>
          </Reveal>
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">Loading…</p>
          ) : opportunities.length === 0 ? (
            <EmptyState>No opportunities published yet. Check back soon, or <Link href="/#launch" className="font-semibold text-primary hover:underline">get notified</Link> when the first ones go live.</EmptyState>
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
            <p className="text-center text-sm text-muted-foreground">Loading…</p>
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
                  description={c.description}
                />
              ))}
            </div>
          )}
          {careerPathCards.length > 0 && (
            <div className="mt-8 text-center">
              <Link href="/career-paths" className="text-sm font-semibold text-primary hover:underline">Explore all career paths →</Link>
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
            </div>
          </Reveal>
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">Loading…</p>
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
                  eyebrow="Free"
                  title={c.title}
                  description={c.description}
                />
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <Link href="/learn" className="text-sm font-semibold text-primary hover:underline">Explore the learning library →</Link>
          </div>
        </div>
      </section>

      {/* CONTINUE WATCHING -- independent of whether any video is flagged
          show_on_homepage, which defaults false: a signed-in user with real
          progress should see this regardless of homepage curation state.
          No vertical section padding here -- ContinueWatching renders
          nothing at all when empty (the common case: signed out, or no
          progress), so a padded wrapper would leave a blank gap. Its own
          root carries vertical margin instead, only present when it does. */}
      <div className="mx-auto max-w-7xl bg-background px-6 lg:px-8">
        <ContinueWatching />
      </div>

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
              <Link href="/videos" className="text-sm font-semibold text-primary hover:underline">Explore all videos →</Link>
            </div>
          </div>
        </section>
      )}

      {/* RESOURCES WORTH EXPLORING -- admin-curated (show_on_homepage), one
          large featured pick plus a few smaller ones. Independent of the
          un-curated Free/Premium feeds below, which are access-driven, not
          editorially picked. No existing homepage resource section has
          this one-large-plus-several-small layout, so it's new markup
          rather than reused ResourceCard-grid styling. */}
      {!loading && curatedHero && (() => {
        const heroCoverSrc = curatedHero.cover_url || curatedHero.thumbnail_url || null;
        return (
          <section className="bg-muted py-20 sm:py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <Reveal>
                <div className="mb-10 text-center">
                  <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Resources</div>
                  <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Resources worth exploring</h2>
                </div>
              </Reveal>
              <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
                <Reveal>
                  <Link href={`/resources/${curatedHero.slug}`} className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md">
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
                <Link href="/resources" className="text-sm font-semibold text-primary hover:underline">Explore all resources →</Link>
              </div>
            </div>
          </section>
        );
      })()}

      {/* FREE RESOURCES */}
      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="mb-10 text-center">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Start Here. It&rsquo;s Free.</div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Genuinely useful, no cost</h2>
            </div>
          </Reveal>
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">Loading…</p>
          ) : freeResources.length === 0 ? (
            <EmptyState>Free resources are on the way.</EmptyState>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {freeResources.map((r) => (
                <ResourceCard key={r.id} item={r} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PREMIUM */}
      <section className="bg-muted py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="mb-10 text-center">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Go Deeper When You&rsquo;re Ready</div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Premium courses, e-books and guides</h2>
            </div>
          </Reveal>
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">Loading…</p>
          ) : premiumItems.length === 0 ? (
            <EmptyState>Premium content is on the way. Free content comes first.</EmptyState>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {premiumItems.map((item) =>
                "resource_type" in item ? (
                  <ResourceCard key={item.id} item={item} />
                ) : (
                  <ListingCard
                    key={item.id}
                    href={`/learn/${item.slug}`}
                    icon="spark"
                    colorSeed={item.title}
                    eyebrow="Premium"
                    title={item.title}
                    description={item.description}
                    footer={item.price ? `${item.price_currency || "USD"} ${item.price}` : null}
                  />
                )
              )}
            </div>
          )}
          <div className="mt-8 text-center">
            <Link href="/learn" className="text-sm font-semibold text-primary hover:underline">Explore premium resources →</Link>
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/70 py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 lg:px-8 text-center">
          <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 ring-1 ring-white/15">Tools</div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">Tools to help you move forward</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/85">
            Business tools - calculators, trackers, guides and templates - are free to use today. Career tools like CV and interview prep are next.
          </p>
          <Link href="/tools" className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-primary shadow-2xl transition hover:scale-[1.02] hover:bg-white/95">
            Explore All Tools
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
            <p className="text-center text-sm text-muted-foreground">Loading…</p>
          ) : events.length === 0 ? (
            <EmptyState>No upcoming events right now. Check back soon.</EmptyState>
          ) : (
            <div className="grid gap-5 sm:grid-cols-3">
              {events.map((e) => (
                <Link key={e.id} href={`/events/${e.slug}`} className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{e.type || "Event"}</span>
                  <h3 className="mt-1 text-base font-bold text-foreground">{e.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{new Date(e.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <Link href="/events" className="text-sm font-semibold text-primary hover:underline">Explore events →</Link>
          </div>
        </div>
      </section>

      {/* FOR BUSINESSES */}
      <section className="bg-muted py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="mb-10 text-center">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">For Businesses</div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Prowess Digital Solutions also helps businesses grow</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
                Practical digital tools, resources and professional services designed to help businesses operate and grow.
              </p>
            </div>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/tools" className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <h3 className="text-base font-bold text-foreground">Business Tools</h3>
              <p className="mt-1 text-sm text-muted-foreground">Tools for everyday business operations.</p>
            </Link>
            <Link href="/resources" className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <h3 className="text-base font-bold text-foreground">Business Resources</h3>
              <p className="mt-1 text-sm text-muted-foreground">Guides, templates and practical resources.</p>
            </Link>
            <Link href="/videos?audience=business" className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <h3 className="text-base font-bold text-foreground">Business Videos</h3>
              <p className="mt-1 text-sm text-muted-foreground">Strategy, marketing and growth, on video.</p>
            </Link>
            <Link href="/services" className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <h3 className="text-base font-bold text-foreground">Digital Solutions</h3>
              <p className="mt-1 text-sm text-muted-foreground">Professional services for businesses that need extra support.</p>
            </Link>
          </div>
          <div className="mt-8 text-center">
            <Link href="/services" className="text-sm font-semibold text-primary hover:underline">Explore solutions for businesses →</Link>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">One place to keep moving forward.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
              Instead of searching across dozens of websites for jobs, learning resources, career advice and opportunities, Prowess Digital Solutions brings useful things together in one place.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyProwess.map((w) => (
              <div key={w.title}>
                <h3 className="text-base font-bold text-foreground">{w.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{w.desc}</p>
              </div>
            ))}
          </div>
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
