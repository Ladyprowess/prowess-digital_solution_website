"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  FileText,
  Library,
  Map,
  Menu,
  Mail,
  Search,
  UsersRound,
  Video,
  X,
} from "lucide-react";

import Container from "@/components/Container";
import { navPrimary } from "@/content/site";
import { ThemeToggle } from "@/components/ThemeToggle";
import { JobAlertsModal } from "@/components/JobAlertsModal";
import { supabase } from "@/lib/supabase";

const menuGroups = [
  {
    title: "Explore",
    items: [
      { href: "/events", label: "Events", description: "Workshops and programmes", icon: UsersRound },
      { href: "/blog", label: "Blog", description: "Articles and practical notes", icon: FileText },
      { href: "/videos", label: "Videos", description: "Lessons and useful talks", icon: Video },
      { href: "/resources", label: "Library", description: "Books, guides and templates", icon: Library },
    ],
  },
  {
    title: "Grow",
    items: [
      { href: "/career-paths", label: "Career Paths", description: "Structured roadmaps", icon: Map },
      { href: "/skills", label: "Skills", description: "Find learning by skill", icon: BookOpen },
      { href: "/work-with-us", label: "Work With Us", description: "Open roles and collaboration", icon: UsersRound },
    ],
  },
  {
    title: "Business",
    items: [
      { href: "/about", label: "About us", description: "The people behind Prowess", icon: BriefcaseBusiness },
      { href: "/contact", label: "Contact", description: "Questions and service enquiries", icon: Mail },
      { href: "/case-studies", label: "Case Studies", description: "Client problems and results", icon: Search },
    ],
  },
] as const;

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

  return (
    <>
    <header className="sticky top-0 z-50">
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <Container>
          <div className="grid h-20 grid-cols-[minmax(140px,220px)_minmax(0,1fr)_auto] items-center gap-3 xl:grid-cols-[minmax(160px,200px)_1fr_260px] xl:gap-8">
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
            <nav className="hidden min-w-0 items-center justify-center gap-3 xl:flex xl:gap-4">

              {primaryLinks.map((item) => {
                const active = !("external" in item) && isActive(item.href);
                const base =
                  "relative rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted whitespace-nowrap";
                const underline = active
                  ? "bg-primary/10 text-primary"
                  : "";

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
                    "flex min-h-10 items-center gap-2 rounded-lg px-3 py-2",
                    "text-sm font-semibold text-foreground whitespace-nowrap",
                    "border border-transparent hover:border-border hover:bg-muted transition",
                    moreOpen ? "border-border bg-muted" : "",
                  ].join(" ")}
                >
                  More
                  <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${moreOpen ? "rotate-180" : ""}`} />
                </button>

                {moreOpen ? (
                  <div
                    role="menu"
                    className="absolute left-1/2 mt-3 w-[640px] -translate-x-1/2 rounded-lg border border-border bg-card p-4 shadow-lg"
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      {menuGroups.map((group) => (
                        <div key={group.title}>
                          <p className="px-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {group.title}
                          </p>
                          <div className="mt-2 space-y-1">
                            {group.items.map((m) => {
                              const Icon = m.icon;
                              const active = isActive(m.href);
                              return (
                                <Link
                                  key={m.href}
                                  href={m.href}
                                  role="menuitem"
                                  onClick={() => setMoreOpen(false)}
                                  className={`flex gap-3 rounded-lg px-2 py-2.5 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                    active ? "bg-primary/10 text-primary" : "text-foreground"
                                  }`}
                                >
                                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Icon size={16} aria-hidden="true" />
                                  </span>
                                  <span>
                                    <span className="block text-sm font-bold">{m.label}</span>
                                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                                      {m.description}
                                    </span>
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <ThemeToggle />
            </nav>

            {/* Desktop CTA */}
            <div className="hidden items-center justify-end gap-3 xl:flex">
              <Link
                href={signedIn ? "/account" : "/account/login"}
                className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-foreground transition hover:bg-muted hover:text-primary whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {signedIn ? "My Account" : "Sign In"}
              </Link>
              <button
                type="button"
                onClick={() => setAlertsOpen(true)}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Get Job Alerts
              </button>
            </div>

            {/* Mobile toggle */}
            <div className="flex items-center justify-end gap-2 xl:hidden" ref={mobileWrapRef}>
              <ThemeToggle />
              <button
                type="button"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileOpen((v) => !v)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
              </button>

              {/* MOBILE DROPDOWN */}
              {mobileOpen ? (
                <>
                  {/* Dimming backdrop over page content behind the menu */}
                  <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-x-0 bottom-0 top-20 z-40 bg-foreground/35 xl:hidden"
                  />

                  {/* Solid, fully opaque menu panel - no see-through content behind text.
                      max-h + overflow-y-auto is load-bearing: this menu has enough
                      links + buttons to be taller than a real phone screen, and
                      without a scroll, whatever's last (the Sign In button) gets
                      pushed off the bottom of the screen with no way to reach it. */}
                  <div className="fixed inset-x-0 top-20 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-border bg-background shadow-xl xl:hidden">
                    <div className="mx-auto w-full max-w-3xl px-4 py-4">
                      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Menu
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {primaryLinks.map((item) => {
                          const active = !("external" in item) && isActive(item.href);

                          const cls = active
                            ? "rounded-lg bg-primary/10 border border-primary/20 px-3 py-3 text-sm font-bold text-primary"
                            : "rounded-lg bg-background px-3 py-3 text-sm font-bold text-foreground border border-border hover:bg-muted";

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

                      <div className="my-4 h-px bg-border" />

                      <div className="space-y-4">
                        {menuGroups.map((group) => (
                          <div key={group.title}>
                            <p className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                              {group.title}
                            </p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              {group.items.map((m) => {
                                const Icon = m.icon;
                                const active = isActive(m.href);
                                return (
                                  <Link
                                    key={m.href}
                                    href={m.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2.5 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                      active ? "border-primary/25 bg-primary/10" : "border-border bg-background"
                                    }`}
                                  >
                                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                      <Icon size={17} aria-hidden="true" />
                                    </span>
                                    <span>
                                      <span className="block text-sm font-bold text-foreground">{m.label}</span>
                                      <span className="block text-xs leading-5 text-muted-foreground">{m.description}</span>
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => { setMobileOpen(false); setAlertsOpen(true); }}
                        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        Get Job Alerts
                      </button>
                      <Link
                        href={signedIn ? "/account" : "/account/login"}
                        onClick={() => setMobileOpen(false)}
                        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-semibold text-foreground hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
