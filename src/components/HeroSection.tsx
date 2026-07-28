"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

const T = "#507c80";
const TDark = "#3d5f62";
const ink = "#0A0A0F";
const muted = "#496167";
const border = "#E7E7EC";

const CSS = `
@keyframes floatA {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-10px); }
}
@keyframes floatB {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-8px); }
}
@keyframes floatC {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-7px); }
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
  * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
}
`;

function StatCard({
  icon,
  label,
  value,
  sub,
  style,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  style: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        width: "clamp(132px, 38vw, 172px)",
        background: "#fff",
        borderRadius: 16,
        border: `1px solid ${border}`,
        boxShadow: "0 12px 32px rgba(10,10,15,0.12), 0 2px 8px rgba(10,10,15,0.05)",
        padding: "13px 15px",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: "clamp(8.5px, 2.4vw, 9.5px)", fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(80,124,128,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: "clamp(18px, 5vw, 22px)", fontWeight: 800, color: ink, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "clamp(8.5px, 2.4vw, 9.5px)", color: muted, marginTop: 3 }}>{sub}</div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section
      style={{
        background: "#F5F5F7",
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-16 xl:gap-20 items-center">

          {/* ─── LEFT ─── */}
          <div className="text-center lg:text-left" style={{ maxWidth: 540, margin: "0 auto", animation: "fadeUp 0.65s ease both" }}>

            <div style={{ fontSize: 12, fontWeight: 700, color: T, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 18, animation: "fadeUp 0.65s ease 0.05s both" }}>
              Clarity. Structure. Growth.
            </div>

            <h1 style={{ fontSize: "clamp(2.3rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.026em", lineHeight: 1.1, color: ink, marginBottom: 22, animation: "fadeUp 0.65s ease 0.1s both" }}>
              We help you turn ideas into a business that{" "}
              <span style={{ color: T, fontStyle: "italic" }}>lasts</span>.
            </h1>

            <p style={{ fontSize: "1.05rem", lineHeight: 1.8, color: muted, marginBottom: 30, animation: "fadeUp 0.65s ease 0.2s both" }}>
              We help entrepreneurs and business owners bring clarity to their ideas, build strong foundations, and implement systems that drive sustainable growth.
            </p>

            <div className="justify-center lg:justify-start" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 30, animation: "fadeUp 0.65s ease 0.3s both" }}>
              <Link href="/services/business-structure-diagnostic">
                <button
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T, color: "#fff", fontWeight: 600, fontSize: "0.9rem", padding: "13px 24px", borderRadius: 10, border: "none", cursor: "pointer", boxShadow: `0 4px 22px rgba(80,124,128,0.32)`, transition: "background 0.15s ease" }}
                  onMouseEnter={e => (e.currentTarget.style.background = TDark)}
                  onMouseLeave={e => (e.currentTarget.style.background = T)}
                >
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Start the Diagnostic
                </button>
              </Link>
              <Link href="/consultation">
                <button
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: ink, fontWeight: 600, fontSize: "0.9rem", padding: "12px 22px", borderRadius: 10, border: `1.5px solid ${border}`, cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(80,124,128,0.35)"; e.currentTarget.style.background = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = "transparent"; }}
                >
                  Book a Consultation
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </Link>
            </div>

            <div
              className="flex-wrap justify-center lg:justify-start"
              style={{ display: "flex", gap: "10px 22px", animation: "fadeUp 0.65s ease 0.4s both" }}
            >
              {["Practical Solutions", "Hands-On Guidance", "Real Results"].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: T, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span style={{ fontSize: "0.82rem", color: muted, fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── RIGHT - Photo + honest floating stat cards ─── */}
          <div
            className="relative mx-auto"
            style={{ maxWidth: 460, width: "100%", animation: "scaleIn 0.75s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}
          >
            <div
              style={{
                position: "relative",
                borderRadius: 28,
                overflow: "hidden",
                border: `1px solid ${border}`,
                boxShadow: "0 24px 60px rgba(10,10,15,0.12), 0 4px 14px rgba(10,10,15,0.05)",
                aspectRatio: "1 / 1",
              }}
            >
              <Image
                src="/images/peace.png"
                alt="Prowess Digital Solutions consultant at work"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 460px"
                style={{ objectFit: "cover" }}
              />
            </div>

            <StatCard
              style={{ top: -12, right: -8, animation: "floatA 7s ease-in-out infinite" }}
              label="Session Format"
              value="60–90 min"
              sub="Focused, one-on-one"
              icon={
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={T} strokeWidth={2.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <StatCard
              style={{ top: "42%", right: -14, animation: "floatB 8s ease-in-out 1s infinite" }}
              label="Fixed Scope Offers"
              value="4"
              sub="Diagnostic to Full Support"
              icon={
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={T} strokeWidth={2.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              }
            />

            <StatCard
              style={{ bottom: -10, right: -6, animation: "floatC 9s ease-in-out 0.5s infinite" }}
              label="Client Rating"
              value="4.7"
              sub="On Google, verified reviews"
              icon={
                <svg width="12" height="12" viewBox="0 0 20 20" fill={T}>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              }
            />
          </div>

        </div>
      </div>
    </section>
  );
}
