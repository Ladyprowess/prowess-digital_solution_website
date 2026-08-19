"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ManualGoogleReviews } from "@/components/ManualGoogleReviews";
import { HeroSection } from "@/components/HeroSection";
import { Reveal } from "@/components/Reveal";
import { supabase } from "@/lib/supabase";
import { goalCards, popularSearches, whyProwess, newsletterPreferences } from "@/content/site";

type OpportunityCard = {
  id: string;
  kind: "job" | "opportunity";
  title: string;
  subtitle: string;
  meta: string;
  href: string;
};

type CareerPathCard = { id: string; slug: string; title: string; description: string | null };
type LearnCard = { id: string; slug: string; title: string; description: string | null; access: string; price: number | null; price_currency: string | null };
type ResourceCard = { id: string; slug: string; title: string; description: string | null; resource_type: string | null; access: string; price: number | null; price_currency: string | null };
type EventCard = { id: string; slug: string; title: string; date: string; type: string | null };

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

function Badge({ premium }: { premium: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${premium ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
      {premium ? "Premium" : "Free"}
    </span>
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
  const [freeResources, setFreeResources] = useState<ResourceCard[]>([]);
  const [premiumItems, setPremiumItems] = useState<(LearnCard | ResourceCard)[]>([]);
  const [events, setEvents] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [jobsRes, oppsRes, pathsRes, coursesRes, resourcesRes, eventsRes] = await Promise.all([
        supabase.from("jobs").select("id, slug, title, location_type, country, created_at, companies(name)").eq("status", "published").order("created_at", { ascending: false }).limit(4),
        supabase.from("opportunities").select("id, slug, title, organisation_name, created_at, opportunity_types(name)").eq("status", "published").order("created_at", { ascending: false }).limit(4),
        supabase.from("career_paths").select("id, slug, title, description").eq("status", "published").order("created_at", { ascending: false }).limit(6),
        supabase.from("courses").select("id, slug, title, description, access, price, price_currency").eq("status", "published").order("created_at", { ascending: false }).limit(6),
        supabase.from("resources").select("id, slug, title, description, resource_type, access, price, price_currency").eq("status", "published").in("audience", ["consumer", "both"]).order("created_at", { ascending: false }).limit(10),
        supabase.from("events").select("id, slug, title, date, type").eq("status", "published").gte("date", new Date().toISOString()).order("date", { ascending: true }).limit(3),
      ]);

      type JobQueryRow = { id: string; slug: string; title: string; location_type: string; country: string | null; companies: { name: string } | null };
      type OppQueryRow = { id: string; slug: string; title: string; organisation_name: string | null; opportunity_types: { name: string } | null };

      const jobCards: OpportunityCard[] = ((jobsRes.data || []) as unknown as JobQueryRow[]).map((j) => ({
        id: j.id,
        kind: "job",
        title: j.title,
        subtitle: j.companies?.name || "Prowess Digital Solutions",
        meta: j.location_type === "remote" ? "Remote" : [j.location_type, j.country].filter(Boolean).join(" · ") || "Job",
        href: `/jobs/${j.slug}`,
      }));
      const oppCards: OpportunityCard[] = ((oppsRes.data || []) as unknown as OppQueryRow[]).map((o) => ({
        id: o.id,
        kind: "opportunity",
        title: o.title,
        subtitle: o.organisation_name || o.opportunity_types?.name || "Opportunity",
        meta: o.opportunity_types?.name || "Opportunity",
        href: `/opportunities/${o.slug}`,
      }));
      setOpportunities([...jobCards, ...oppCards].slice(0, 6));

      setCareerPathCards(pathsRes.data || []);

      const publishedCourses = (coursesRes.data || []) as LearnCard[];
      setCourses(publishedCourses.filter((c) => c.access === "free").slice(0, 4));

      const publishedResources = (resourcesRes.data || []) as ResourceCard[];
      setFreeResources(publishedResources.filter((r) => r.access === "free").slice(0, 6));

      const premium = [
        ...publishedCourses.filter((c) => c.access === "premium"),
        ...publishedResources.filter((r) => r.access === "premium"),
      ].slice(0, 4);
      setPremiumItems(premium);

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
                <Link key={o.id} href={o.href} className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-primary">{o.kind === "job" ? "Job" : o.meta}</span>
                  <h3 className="mt-1 text-base font-bold text-foreground">{o.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{o.subtitle}</p>
                  <span className="mt-3 inline-block text-sm font-semibold text-primary">View opportunity →</span>
                </Link>
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
                <Link key={c.id} href={`/career-paths/${c.slug}`} className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <h3 className="text-base font-bold text-foreground">{c.title}</h3>
                  {c.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
                </Link>
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
                <Link key={c.id} href={`/learn/${c.slug}`} className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <Badge premium={c.access === "premium"} />
                  <h3 className="mt-3 text-base font-bold text-foreground">{c.title}</h3>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <Link href="/learn" className="text-sm font-semibold text-primary hover:underline">Explore the learning library →</Link>
          </div>
        </div>
      </section>

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
                <Link key={r.id} href={`/resources/${r.slug}`} className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{r.resource_type?.replace("_", " ") || "Resource"}</span>
                  <h3 className="mt-1 text-base font-bold text-foreground">{r.title}</h3>
                </Link>
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
              {premiumItems.map((item) => (
                <Link
                  key={item.id}
                  href={"resource_type" in item ? `/resources/${item.slug}` : `/learn/${item.slug}`}
                  className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <Badge premium />
                  <h3 className="mt-3 text-base font-bold text-foreground">{item.title}</h3>
                  {item.price ? <p className="mt-1 text-sm text-muted-foreground">{item.price_currency || "NGN"} {item.price}</p> : null}
                </Link>
              ))}
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
          <div className="grid gap-5 sm:grid-cols-3">
            <Link href="/tools" className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <h3 className="text-base font-bold text-foreground">Business Tools</h3>
              <p className="mt-1 text-sm text-muted-foreground">Tools for everyday business operations.</p>
            </Link>
            <Link href="/resources" className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <h3 className="text-base font-bold text-foreground">Business Resources</h3>
              <p className="mt-1 text-sm text-muted-foreground">Guides, templates and practical resources.</p>
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
