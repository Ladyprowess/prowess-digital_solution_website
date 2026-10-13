"use client";

import Link from "next/link";
import React from "react";
const audiencePaths = [
  { key: "business", label: "Grow your business", desc: "Improve your operations, organise your finances and build better business systems.", cta: "Explore business support", href: "/services" },
  { key: "learning", label: "Build your skills", desc: "Discover courses, practical learning resources and career development guides.", cta: "Explore learning", href: "/learn" },
  { key: "work", label: "Find work", desc: "Explore jobs, internships and remote work opportunities.", cta: "Explore jobs", href: "/jobs" },
  { key: "opportunities", label: "Find opportunities", desc: "Discover grants, scholarships, fellowships and relevant programmes.", cta: "Explore opportunities", href: "/opportunities" },
];

// Theme-aware: every color here is a CSS custom property (see globals.css'
// @layer base tokens + .dark overrides), not a hardcoded hex, so this
// section actually responds to the dark mode toggle instead of staying
// pinned to a light palette regardless of theme.
const T = "var(--primary)";
const ink = "var(--foreground)";
const muted = "var(--muted-foreground)";
const border = "var(--border)";

const CSS = `
.homepage-hero a:focus-visible, .homepage-hero input:focus-visible, .homepage-hero button:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 4px;
}
@keyframes fadeUp {
  from { opacity:0; transform:translateY(18px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes scaleIn {
  from { opacity:0; transform:scale(0.96) translateY(10px); }
  to   { opacity:1; transform:scale(1) translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .homepage-hero * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
}
`;

const quickFilters = [
  { label: "Jobs", href: "/jobs" },
  { label: "Grants", href: "/opportunities" },
  { label: "Scholarships", href: "/opportunities" },
  { label: "Courses", href: "/learn" },
  { label: "Events", href: "/events" },
  { label: "Tools", href: "/tools" },
];

export function HeroSection() {
  return (
    <section
      className="homepage-hero"
      aria-labelledby="homepage-heading"
      style={{
        background: "var(--muted)",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='none' stroke='%23507c80' stroke-opacity='0.04' stroke-width='0.6'/%3E%3C/svg%3E")`,
        position: "relative",
        overflowX: "clip",
      }}
    >
      <style>{CSS}</style>

      <div style={{ pointerEvents: "none", position: "absolute", inset: 0, zIndex: 0 }}>
        <div style={{ position: "absolute", top: "0%", right: "8%", width: 680, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(80,124,128,0.07) 0%, transparent 68%)" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "0%", width: 400, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(80,124,128,0.05) 0%, transparent 70%)" }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8" style={{ paddingTop: "5.5rem", paddingBottom: "6.5rem", zIndex: 1 }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-16 xl:gap-20 items-center">

          {/* ─── LEFT ─── */}
          <div className="text-center lg:text-left" style={{ maxWidth: 580, margin: "0 auto", animation: "fadeUp 0.65s ease both" }}>

            <div style={{ fontSize: 12, fontWeight: 700, color: T, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 18, animation: "fadeUp 0.65s ease 0.05s both" }}>
              Prowess Digital Solutions
              <span className="mt-2 block normal-case tracking-normal">Clarity. Structure. Growth.</span>
            </div>

            <h1 id="homepage-heading" style={{ fontSize: "clamp(2.3rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.026em", lineHeight: 1.1, color: ink, marginBottom: 22, animation: "fadeUp 0.65s ease 0.1s both" }}>
              Find the right resources for your <span style={{ color: T }}>next step.</span>
            </h1>

            <p style={{ fontSize: "1.05rem", lineHeight: 1.8, color: muted, marginBottom: 30, animation: "fadeUp 0.65s ease 0.2s both" }}>
              Explore practical resources, career opportunities, learning materials and business support to help you move forward.
            </p>

            {/* Search bar */}
            <form
              action="/search"
              style={{ animation: "fadeUp 0.65s ease 0.28s both" }}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <div className="relative flex-1">
                <svg aria-hidden="true" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={muted} strokeWidth={2} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                <label htmlFor="homepage-search" className="sr-only">Search resources and opportunities</label>
                <input
                  id="homepage-search"
                  type="search"
                  name="q"
                  placeholder="What are you looking for?"
                  style={{ width: "100%", padding: "14px 16px 14px 44px", borderRadius: 12, border: `1.5px solid ${border}`, fontSize: "0.95rem", color: ink, background: "var(--card)" }}
                />
              </div>
              <button
                type="submit"
                className="hero-search-btn"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: T, color: "var(--primary-foreground)", fontWeight: 600, fontSize: "0.9rem", padding: "14px 26px", borderRadius: 12, border: "none", cursor: "pointer", boxShadow: `0 4px 22px rgba(80,124,128,0.32)`, transition: "filter 0.15s ease", whiteSpace: "nowrap" }}
                onMouseEnter={e => (e.currentTarget.style.filter = "brightness(0.9)")}
                onMouseLeave={e => (e.currentTarget.style.filter = "none")}
              >
                Search
              </button>
            </form>

            <div
              className="flex-wrap justify-center lg:justify-start"
              style={{ display: "flex", gap: 10, marginTop: 16, animation: "fadeUp 0.65s ease 0.34s both" }}
            >
              {quickFilters.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="inline-flex min-h-10 items-center"
                  style={{ fontSize: "0.82rem", fontWeight: 600, color: T, background: "color-mix(in oklch, var(--primary) 10%, transparent)", border: `1px solid color-mix(in oklch, var(--primary) 20%, transparent)`, borderRadius: 999, padding: "7px 14px", transition: "background 0.15s ease" }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div
              className="flex-wrap justify-center lg:justify-start"
              style={{ display: "flex", gap: "10px 22px", marginTop: 28, animation: "fadeUp 0.65s ease 0.4s both" }}
            >
              {["Free to browse", "Worldwide + Remote focus", "New opportunities weekly"].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: T, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg aria-hidden="true" width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="var(--primary-foreground)" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span style={{ fontSize: "0.82rem", color: muted, fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── RIGHT - category grid ─── */}
          <div
            className="relative mx-auto w-full"
            style={{ maxWidth: 440, animation: "scaleIn 0.75s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}
          >
            <div
              style={{
                borderRadius: 28,
                border: `1px solid ${border}`,
                background: "var(--card)",
                boxShadow: "0 24px 60px rgba(10,10,15,0.12), 0 4px 14px rgba(10,10,15,0.05)",
                padding: 28,
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                Choose your next step
              </p>
              <div className="flex flex-col gap-2.5">
                {audiencePaths.map((p) => (
                  <Link
                    key={p.key}
                    href={p.href}
                    className="group hover:bg-muted/60"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      borderRadius: 14,
                      border: `1px solid ${p.key === "business" ? T : border}`,
                      padding: "12px 14px",
                      transition: "border-color 0.15s ease, background 0.15s ease",
                    }}
                  >
                    <span>
                      <span style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, color: ink }}>{p.label}</span>
                      <span style={{ display: "block", fontSize: "0.875rem", lineHeight: 1.5, color: muted, marginTop: 4 }}>{p.desc}</span>
                      <span className="mt-2 block text-sm font-semibold text-primary">{p.cta}</span>
                    </span>
                    <svg aria-hidden="true" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={T} strokeWidth={2.4} style={{ flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
