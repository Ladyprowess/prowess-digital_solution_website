"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import Container from "@/components/Container";
import { navPrimary, navMore } from "@/content/site";

const BOOKING_URL = "https://prowessdigitalsolutions.com/consultation";

export default function Navbar() {
  const pathname = usePathname();

  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <header className="sticky top-0 z-50">
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur">
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
                  "relative text-base font-medium text-slate-700 hover:text-slate-900 transition whitespace-nowrap";
                const underline = active
                  ? "after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-full after:bg-[#507c80]"
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
                  <Link key={item.href} href={item.href} className={`${base} ${underline}`}>
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
                    "text-base font-semibold text-slate-800 whitespace-nowrap",
                    "border border-transparent hover:border-slate-200 hover:bg-slate-50 transition",
                    moreOpen ? "border-slate-200 bg-slate-50" : "",
                  ].join(" ")}
                >
                  More
                  <span className={`transition-transform ${moreOpen ? "rotate-180" : ""}`}>⌄</span>
                </button>

                {moreOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl p-2"
                  >
                    {moreLinks.map((m) => (
                      <Link
                        key={m.href}
                        href={m.href}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className="block rounded-xl px-4 py-4 text-lg font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        {m.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex justify-end">
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-[220px] items-center justify-center rounded-xl bg-[#507c80] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-slate-200 hover:bg-[#466e71] transition whitespace-nowrap"
>
                Book a Clarity Session
              </a>
            </div>

            {/* Mobile toggle */}
            <div className="flex justify-end lg:hidden" ref={mobileWrapRef}>
              <button
                type="button"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileOpen((v) => !v)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 hover:bg-slate-50"
              >
                <span className="text-2xl leading-none">{mobileOpen ? "✕" : "☰"}</span>
              </button>

              {/* ✅ MOBILE DROPDOWN (clean + soft background) */}
              {mobileOpen ? (
                <div className="absolute left-0 top-[80px] w-full bg-[#507c80]/10 border-t border-slate-200 shadow-lg">
                  <div className="mx-auto w-full max-w-6xl px-4 py-5">
                    <div className="rounded-3xl bg-white/70 backdrop-blur border border-slate-200 p-4 shadow-sm">
                      {/* Primary links in a 2-column grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {primaryLinks.map((item) => {
                          const active = !("external" in item) && isActive(item.href);

                          const cls = active
                            ? "rounded-2xl bg-[#507c80]/10 border border-[#507c80]/20 px-4 py-4 text-base font-semibold text-slate-900"
                            : "rounded-2xl bg-white px-4 py-4 text-base font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50";

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
                              key={item.href}
                              href={item.href}
                              className={cls}
                              onClick={() => setMobileOpen(false)}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>

                      <div className="my-5 h-px bg-slate-200/70" />

                      {/* More section */}
                      <p className="text-xs font-semibold tracking-widest text-slate-500 px-1">
                        MORE
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        {moreLinks.map((m) => (
                          <Link
                            key={m.href}
                            href={m.href}
                            onClick={() => setMobileOpen(false)}
                            className="rounded-2xl bg-white px-4 py-4 text-base font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50"
                          >
                            {m.label}
                          </Link>
                        ))}
                      </div>

                      {/* Mobile CTA button */}
                      <a
                        href={BOOKING_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 inline-flex w-full items-center justify-center rounded-3xl bg-[#507c80] px-6 py-5 text-lg font-semibold text-white shadow-md shadow-slate-200 hover:bg-[#466e71] transition"
                      >
                        Book Clarity Session
                      </a>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </div>

      <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </header>
  );
}
