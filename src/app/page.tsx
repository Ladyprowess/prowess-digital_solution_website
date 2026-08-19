"use client";

import React, { useState } from 'react';
import Link from "next/link";
import { ManualGoogleReviews } from "@/components/ManualGoogleReviews";
import { HeroSection } from "@/components/HeroSection";
import { Reveal } from "@/components/Reveal";
import { homeSections, popularSearches, careerPaths } from "@/content/site";

const scopeStats = [
  {
    value: "4.7",
    label: "Rating on Google",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    ),
  },
  {
    value: "5",
    label: "Ways to Move Forward",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
    ),
  },
  {
    value: "Remote + Africa",
    label: "Where We Focus",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM3.6 9h16.8M3.6 15h16.8M12 3a15.3 15.3 0 010 18 15.3 15.3 0 010-18z" />
    ),
  },
  {
    value: "Free",
    label: "To Get Started",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    ),
  },
];

const forBusinesses = [
  {
    title: "Business Services",
    desc: "Diagnostics, systems, and playbooks to help you run a structured, sustainable business.",
    href: "/services",
    cta: "See services",
  },
  {
    title: "Case Studies",
    desc: "Real work we've done with founders and small businesses.",
    href: "/case-studies",
    cta: "View case studies",
  },
  {
    title: "Book a Consultation",
    desc: "Talk to us directly about what your business needs.",
    href: "/consultation",
    cta: "Book a call",
  },
];

function WaitlistForm({ preference, source }: { preference: string; source: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, preference, source }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("ok");
        setMessage("You're on the list. We'll email you when it's live.");
        setEmail("");
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
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
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
          {status === "loading" ? "Joining…" : "Notify Me"}
        </button>
      </form>
      {message && (
        <p className={`mt-3 text-sm ${status === "ok" ? "text-primary" : "text-red-600"}`}>{message}</p>
      )}
    </div>
  );
}

function TagRow({ items }: { items: readonly (string | { label: string; href: string })[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {items.map((item) => {
        const label = typeof item === "string" ? item : item.label;
        const href = typeof item === "string" ? "/#launch" : item.href;
        return (
          <Link
            key={label}
            href={href}
            className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:text-primary"
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

export default function ModernHomePage() {
  return (
    <div className="min-h-screen bg-background" id="top">

      {/* HERO SECTION */}
      <HeroSection />

      {/* POPULAR SEARCHES */}
      <section className="bg-background py-14">
        <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
          <p className="mb-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Popular Searches</p>
          <TagRow items={popularSearches} />
        </div>
      </section>

      {/* SCOPE BAR - honest, no invented numbers */}
      <section className="border-y border-border bg-background py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <p className="max-w-[190px] text-sm font-bold uppercase leading-snug tracking-wide text-foreground">
                Built for people moving their career and business forward
              </p>

              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:flex lg:gap-10">
                {scopeStats.map((stat) => (
                  <div key={stat.label} className="flex items-start gap-2.5">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {stat.icon}
                    </svg>
                    <div>
                      <div className="text-lg font-extrabold text-foreground">{stat.value}</div>
                      <div className="text-xs leading-tight text-muted-foreground">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FIVE PILLARS */}
      <section id="launch" className="bg-background py-20 sm:py-28 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Five Ways to Move Forward</div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                Discover, learn, build, and connect.
              </h2>
              <p className="text-lg text-muted-foreground">
                Prowess Digital Solutions is a platform for discovering opportunities, building skills, and moving your career or business forward. Jobs are one part of it, not the whole thing.
              </p>
            </div>
          </Reveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {homeSections.map((section, idx) => (
              <Reveal key={section.title} delay={idx * 70}>
                <div className="flex h-full flex-col rounded-3xl border border-border bg-card p-7 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">{section.title}</h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                        section.badge === "Live"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {section.badge}
                    </span>
                  </div>
                  <p className="mb-5 text-sm text-muted-foreground">{section.desc}</p>

                  {"tags" in section && section.tags && (
                    <div className="mb-5 flex flex-wrap gap-2">
                      {section.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {"links" in section && section.links && (
                    <div className="mb-5 flex flex-wrap gap-2">
                      {section.links.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}

                  <Link
                    href={section.href}
                    className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                  >
                    {section.cta}
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={210}>
            <div className="mx-auto mt-14 max-w-2xl rounded-3xl border-2 border-primary/20 bg-muted p-10 text-center">
              <h3 className="mb-2 text-xl font-bold text-foreground">Be first to know as new pillars open up</h3>
              <p className="mb-6 text-sm text-muted-foreground">No spam. Just an email when Work, Opportunities, and Learn go live.</p>
              <WaitlistForm preference="general" source="homepage-pillars" />
              <p className="mt-5 text-xs text-muted-foreground">
                Hiring? <Link href="/services" className="font-semibold text-primary hover:underline">Reach us as a business</Link> in the meantime.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* EXPLORE BY CAREER */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
          <Reveal>
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Explore by Career</div>
            <h2 className="mb-10 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Find your path
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <TagRow items={careerPaths} />
          </Reveal>
        </div>
      </section>

      {/* TESTIMONIALS - real Google reviews */}
      <ManualGoogleReviews />

      {/* GET NOTIFIED */}
      <section className="bg-muted py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Ready When You Are</div>
              <h2 className="mb-5 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                Be the first to know what&rsquo;s next on Prowess Digital Solutions.
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                Join the list and get notified as new jobs, opportunities, and courses go live.
              </p>
              <WaitlistForm preference="general" source="homepage-final-cta" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOR BUSINESSES */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">For Businesses</div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                Looking to grow your business instead?
              </h2>
              <p className="text-lg text-muted-foreground">
                Prowess Digital Solutions also works directly with founders and small businesses on structure, systems, and strategy.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {forBusinesses.map((item, idx) => (
              <Reveal key={item.title} delay={idx * 90}>
                <Link
                  href={item.href}
                  className="group block h-full rounded-3xl border border-border bg-card p-7 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
                >
                  <h3 className="mb-2 text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    {item.cta}
                    <svg className="h-4 w-4 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
