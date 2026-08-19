"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import Container from "@/components/Container";
import { navPrimary, navMore } from "@/content/site";
import { ThemeToggle } from "@/components/ThemeToggle";
import { JobAlertsModal } from "@/components/JobAlertsModal";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const pathname = usePathname();

  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  // Detect-only, never redirects (unlike useMemberSession, which is for
  // /account/* pages that require a session) - the navbar renders on every
  // page, including for anonymous visitors who should never be bounced to
  // login just because it checked.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(!!session));
    return () => listener.subscription.unsubscribe();
  }, []);

  const moreRef = useRef<HTMLDivElement | null>(null);
  const mobileWrapRef = useRef<HTMLDivElement | null>(null);

  const primaryLinks = useMemo(() => navPrimary, []);
  const moreLinks = useMemo(() => navMore, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (moreRef.current && !moreRef.current.contains(target)) setMoreOpen(false);
      if (mobileWrapRef.current && !mobileWrapRef.current.contains(target)) setMobileOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMoreOpen(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    setMoreOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
    <header className="sticky top-0 z-50">
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <Container>
          <div className="grid h-20 grid-cols-[minmax(140px,220px)_minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[minmax(160px,200px)_1fr_220px] lg:gap-6">
            {/* Logo */}
            <Link href="/" aria-label="Go to homepage" className="flex items-center">
              <Image
                src="/brand/logo.png"
                alt="Prowess Digital Solutions"
                width={1900}
                height={11}
                priority
                className="h-12 w-auto object-contain"
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex min-w-0 items-center justify-center gap-5 xl:gap-6">

              {primaryLinks.map((item) => {
                const active = !("external" in item) && isActive(item.href);
                const base =
                  "relative text-base font-medium text-foreground hover:text-foreground transition whitespace-nowrap";
                const underline = active
                  ? "after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-full after:bg-primary"
                  : "after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-full after:bg-transparent";

                if ("external" in item && item.external) {
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`${base} ${underline}`}
                    >
                      {item.label}
                    </a>
                  );
                }

                return (
                  <Link key={item.label} href={item.href} className={`${base} ${underline}`}>
                    {item.label}
                  </Link>
                );
              })}

              {/* Desktop More */}
              <div className="relative" ref={moreRef}>
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                  className={[
                    "flex items-center gap-2 rounded-xl px-4 py-2",
                    "text-base font-semibold text-foreground whitespace-nowrap",
                    "border border-transparent hover:border-border hover:bg-muted transition",
                    moreOpen ? "border-border bg-muted" : "",
                  ].join(" ")}
                >
                  More
                  <span className={`transition-transform ${moreOpen ? "rotate-180" : ""}`}>⌄</span>
                </button>

                {moreOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-3 w-80 rounded-2xl border border-border bg-card shadow-xl p-2"
                  >
                    {moreLinks.map((m) => (
                      <Link
                        key={m.href}
                        href={m.href}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className="block rounded-xl px-4 py-4 text-lg font-medium text-foreground hover:bg-muted hover:text-foreground"
                      >
                        {m.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              <ThemeToggle />
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center justify-end gap-3">
              <Link
                href={signedIn ? "/account" : "/account/login"}
                className="text-sm font-semibold text-foreground hover:text-primary transition whitespace-nowrap"
              >
                {signedIn ? "My Account" : "Sign In"}
              </Link>
              <button
                type="button"
                onClick={() => setAlertsOpen(true)}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-border hover:opacity-90 transition whitespace-nowrap"
              >
                Get Job Alerts
              </button>
            </div>

            {/* Mobile toggle */}
            <div className="flex items-center justify-end gap-2 lg:hidden" ref={mobileWrapRef}>
              <ThemeToggle />
              <button
                type="button"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileOpen((v) => !v)}
                className="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-4 py-3 text-foreground hover:bg-muted"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                  )}
                </svg>
              </button>

              {/* MOBILE DROPDOWN */}
              {mobileOpen ? (
                <>
                  {/* Dimming backdrop over page content behind the menu */}
                  <div
                    aria-hidden="true"
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-x-0 bottom-0 top-20 z-40 bg-black/40 lg:hidden"
                  />

                  {/* Solid, fully opaque menu panel - no see-through content behind text.
                      max-h + overflow-y-auto is load-bearing: this menu has enough
                      links + buttons to be taller than a real phone screen, and
                      without a scroll, whatever's last (the Sign In button) gets
                      pushed off the bottom of the screen with no way to reach it. */}
                  <div className="fixed inset-x-0 top-20 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-border bg-background shadow-xl lg:hidden">
                    <div className="mx-auto w-full max-w-6xl px-4 py-5">
                      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
                      {/* Primary links in a 2-column grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {primaryLinks.map((item) => {
                          const active = !("external" in item) && isActive(item.href);

                          const cls = active
                            ? "rounded-2xl bg-primary/10 border border-primary/20 px-4 py-4 text-base font-semibold text-foreground"
                            : "rounded-2xl bg-card px-4 py-4 text-base font-semibold text-foreground border border-border hover:bg-muted";

                          if ("external" in item && item.external) {
                            return (
                              <a
                                key={item.label}
                                href={item.href}
                                target="_blank"
                                rel="noreferrer"
                                className={cls}
                                onClick={() => setMobileOpen(false)}
                              >
                                {item.label}
                              </a>
                            );
                          }

                          return (
                            <Link
                              key={item.label}
                              href={item.href}
                              className={cls}
                              onClick={() => setMobileOpen(false)}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>

                      <div className="my-5 h-px bg-border/70" />

                      {/* More section */}
                      <p className="text-xs font-semibold tracking-widest text-muted-foreground px-1">
                        MORE
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        {moreLinks.map((m) => (
                          <Link
                            key={m.href}
                            href={m.href}
                            onClick={() => setMobileOpen(false)}
                            className="rounded-2xl bg-card px-4 py-4 text-base font-semibold text-foreground border border-border hover:bg-muted"
                          >
                            {m.label}
                          </Link>
                        ))}
                      </div>

                      {/* Mobile CTA button */}
                      <button
                        type="button"
                        onClick={() => { setMobileOpen(false); setAlertsOpen(true); }}
                        className="mt-6 inline-flex w-full items-center justify-center rounded-3xl bg-primary px-6 py-5 text-lg font-semibold text-primary-foreground shadow-md shadow-border hover:opacity-90 transition"
                      >
                        Get Job Alerts
                      </button>
                      <Link
                        href={signedIn ? "/account" : "/account/login"}
                        onClick={() => setMobileOpen(false)}
                        className="mt-3 inline-flex w-full items-center justify-center rounded-3xl border border-border bg-card px-6 py-4 text-base font-semibold text-foreground hover:bg-muted transition"
                      >
                        {signedIn ? "My Account" : "Sign In"}
                      </Link>
                    </div>
                  </div>
                </div>
                </>
              ) : null}
            </div>
          </div>
        </Container>
      </div>
    </header>
    <JobAlertsModal open={alertsOpen} onClose={() => setAlertsOpen(false)} />
    </>
  );
}
