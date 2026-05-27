"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

const T = "#507c80";
const TDark = "#3d5f62";
const TLight = "rgba(80,124,128,0.08)";
const TBorder = "rgba(80,124,128,0.18)";
const ink = "#0A0A0F";
const muted = "#496167";
const border = "#E7E7EC";

const CSS = `
@keyframes floatA {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-9px); }
}
@keyframes floatB {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-6px); }
}
@keyframes floatC {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-11px); }
}
@keyframes floatD {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-7px); }
}
@keyframes livePulse {
  0%,100% { opacity:1; box-shadow: 0 0 0 0 rgba(80,124,128,0.5); }
  50%      { opacity:0.7; box-shadow: 0 0 0 5px rgba(80,124,128,0); }
}
@keyframes fadeUp {
  from { opacity:0; transform:translateY(18px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes slideRight {
  from { opacity:0; transform:translateX(22px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes barGrow {
  from { width: 0%; }
}
@keyframes glowPulse {
  0%,100% { box-shadow: 0 14px 60px rgba(10,10,15,0.09), 0 2px 8px rgba(10,10,15,0.05); }
  50%      { box-shadow: 0 14px 60px rgba(10,10,15,0.09), 0 2px 8px rgba(10,10,15,0.05), 0 0 0 2px rgba(80,124,128,0.13); }
}
@keyframes scoreArc {
  from { stroke-dashoffset: 220; }
}
@keyframes tickIn {
  from { transform: scale(0); opacity:0; }
  to   { transform: scale(1); opacity:1; }
}
.mobile-cards-strip::-webkit-scrollbar { display: none; }
`;

function useCountUp(target: number, duration = 1400, delay = 400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(ease * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [target, duration, delay]);
  return val;
}

function AnimBar({ pct, delay = 0 }: { pct: number; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div style={{ height: 4, borderRadius: 3, background: "#EDEDF0", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${w}%`, background: T, borderRadius: 3, transition: "width 1.1s cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

function ScoreArc({ score }: { score: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="#EDEDF0" strokeWidth={6} />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke={T} strokeWidth={6}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1)", transitionDelay: "0.5s" }}
      />
    </svg>
  );
}

function Card({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) {
  return (
    <div style={{
      position: "absolute",
      background: "#fff",
      borderRadius: 16,
      border: `1px solid ${border}`,
      boxShadow: "0 4px 28px rgba(10,10,15,0.08), 0 1px 4px rgba(10,10,15,0.04)",
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 8.5, fontWeight: 700, color: muted, textTransform: "uppercase" as const, letterSpacing: "0.09em", marginBottom: 9 }}>
      {children}
    </div>
  );
}

function StatusBadge({ label, tier }: { label: string; tier: "solid" | "mid" | "soft" | "faint" }) {
  const styles = {
    solid: { color: "#fff",    bg: T },
    mid:   { color: TDark,     bg: "rgba(80,124,128,0.14)" },
    soft:  { color: "#2d5559", bg: "rgba(80,124,128,0.08)" },
    faint: { color: muted,     bg: "#F3F3F5" },
  }[tier];
  return (
    <span style={{ fontSize: 8, fontWeight: 700, color: styles.color, background: styles.bg, borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>
      {label}
    </span>
  );
}

export function HeroSection() {
  const bizCount = useCountUp(47,  1500, 500);
  const satisf   = useCountUp(94,  1300, 700);
  const scoreVal = useCountUp(78,  1800, 300);

  const stripRef   = useRef<HTMLDivElement>(null);
  const activeCard = useRef(0);
  const paused     = useRef(false);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;

    const pause  = () => { paused.current = true; };
    const resume = () => {
      setTimeout(() => { paused.current = false; }, 1500);
    };
    el.addEventListener("touchstart", pause,  { passive: true });
    el.addEventListener("touchend",   resume, { passive: true });

    const interval = setInterval(() => {
      if (paused.current || !el) return;
      const cards = 3;
      activeCard.current = (activeCard.current + 1) % cards;
      el.scrollTo({ left: activeCard.current * (el.offsetWidth * 0.78 + 12), behavior: "smooth" });
    }, 3000);

    return () => {
      clearInterval(interval);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend",   resume);
    };
  }, []);

  return (
    <section style={{ background: "#F5F5F7", backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='none' stroke='%23507c80' stroke-opacity='0.04' stroke-width='0.6'/%3E%3C/svg%3E")`, position: "relative", overflowX: "clip" }}>
      <style>{CSS}</style>

      {/* Ambient glows */}
      <div style={{ pointerEvents: "none", position: "absolute", inset: 0, zIndex: 0 }}>
        <div style={{ position: "absolute", top: "0%",  right: "8%",  width: 680, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(80,124,128,0.07) 0%, transparent 68%)" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "0%", width: 400, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(80,124,128,0.05) 0%, transparent 70%)" }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8" style={{ paddingTop: "5.5rem", paddingBottom: "5.5rem", zIndex: 1 }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-16 xl:gap-20 items-center">

          {/* ─── LEFT ─── */}
          <div className="text-center lg:text-left" style={{ maxWidth: 520, margin: "0 auto", animation: "fadeUp 0.65s ease both" }}>

            {/* Badge */}
            <div className="inline-flex" style={{ alignItems: "center", gap: 8, borderRadius: 999, padding: "5px 14px", background: TLight, border: `1px solid ${TBorder}`, marginBottom: 26 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: T, display: "inline-block", flexShrink: 0, animation: "livePulse 2.5s ease-in-out infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2d5559", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Business Guidance for Africa
              </span>
            </div>

            {/* H1 */}
            <h1 style={{ fontSize: "clamp(2.4rem, 4vw, 3.75rem)", fontWeight: 700, letterSpacing: "-0.028em", lineHeight: 1.06, color: ink, marginBottom: 22, animation: "fadeUp 0.65s ease 0.1s both" }}>
              Bringing Structure to{" "}
              <span style={{ color: T }}>Messy Businesses.</span>
            </h1>

            {/* Lead */}
            <p style={{ fontSize: "1.05rem", lineHeight: 1.8, color: muted, marginBottom: 34, animation: "fadeUp 0.65s ease 0.2s both" }}>
              Most business problems are not about effort. They are about clarity. We help you understand exactly what is wrong and build a simple path forward.
            </p>

            {/* CTAs */}
            <div className="justify-center lg:justify-start" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 44, animation: "fadeUp 0.65s ease 0.3s both" }}>
              <Link href="/consultation">
                <button
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T, color: "#fff", fontWeight: 600, fontSize: "0.9rem", padding: "13px 24px", borderRadius: 10, border: "none", cursor: "pointer", boxShadow: `0 4px 22px rgba(80,124,128,0.32)`, transition: "background 0.15s ease" }}
                  onMouseEnter={e => (e.currentTarget.style.background = TDark)}
                  onMouseLeave={e => (e.currentTarget.style.background = T)}
                >
                  Book a Clarity Session
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </Link>
              <Link href="/about">
                <button
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: ink, fontWeight: 600, fontSize: "0.9rem", padding: "12px 22px", borderRadius: 10, border: `1.5px solid ${border}`, cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(80,124,128,0.35)"; e.currentTarget.style.background = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = "transparent"; }}
                >
                  Learn Our Approach
                </button>
              </Link>
            </div>

            {/* Animated stats */}
            <div className="flex justify-center lg:justify-start" style={{ animation: "fadeUp 0.65s ease 0.4s both" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr", gap: "0 16px" }}>
                {[
                  { val: `${bizCount}+`, label: "Businesses structured" },
                  null,
                  { val: `${satisf}%`,   label: "Session satisfaction" },
                  null,
                  { val: "3+",           label: "Years serving Africa" },
                ].map((s, i) =>
                  s === null
                    ? <div key={i} style={{ background: border, height: "100%", alignSelf: "stretch" }} />
                    : <div key={i} className="text-center lg:text-left">
                        <div style={{ fontSize: "clamp(1.3rem, 5vw, 1.7rem)", fontWeight: 700, color: T, lineHeight: 1.1 }}>{s.val}</div>
                        <div style={{ fontSize: "clamp(0.65rem, 2.5vw, 0.75rem)", color: muted, marginTop: 3, lineHeight: 1.4 }}>{s.label}</div>
                      </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── MOBILE CARD STRIP (hidden on lg+) ─── */}
          <div className="lg:hidden" style={{ marginTop: -16 }}>
            <div
              ref={stripRef}
              style={{
                display: "flex",
                gap: 12,
                overflowX: "auto",
                paddingBottom: 8,
                paddingRight: 24,
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              {/* Mobile Card A — Health Score */}
              <div style={{ minWidth: 210, scrollSnapAlign: "start", background: "#fff", borderRadius: 16, border: `1px solid ${border}`, boxShadow: "0 3px 16px rgba(10,10,15,0.07)", overflow: "hidden", flexShrink: 0 }}>
                <div style={{ padding: "14px 14px 0" }}>
                  <Label>Business Health</Label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <ScoreArc score={scoreVal} />
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: ink }}>{scoreVal}</span>
                        <span style={{ fontSize: 7, color: muted }}>/100</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: ink, marginBottom: 3 }}>Needs Structure</div>
                      <div style={{ fontSize: 9, color: muted, lineHeight: 1.5 }}>Clarity gaps found in your operations</div>
                    </div>
                  </div>
                  {[{ label: "Clarity", pct: 58 }, { label: "Structure", pct: 42 }].map((r, i) => (
                    <div key={r.label} style={{ marginBottom: 7 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: muted, marginBottom: 3 }}>
                        <span>{r.label}</span><span style={{ color: ink, fontWeight: 600 }}>{r.pct}%</span>
                      </div>
                      <AnimBar pct={r.pct} delay={800 + i * 150} />
                    </div>
                  ))}
                </div>
                <div style={{ padding: "10px 14px 13px", borderTop: `1px solid ${border}`, marginTop: 10 }}>
                  <div style={{ fontSize: 9, color: T, fontWeight: 700 }}>→ Book a Clarity Session</div>
                </div>
              </div>

              {/* Mobile Card B — Next Session */}
              <div style={{ minWidth: 200, scrollSnapAlign: "start", background: "#fff", borderRadius: 16, border: `1px solid ${border}`, boxShadow: "0 3px 16px rgba(10,10,15,0.07)", overflow: "hidden", flexShrink: 0, padding: "14px" }}>
                <Label>Next Available</Label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: TLight, border: `1px solid ${TBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={T} strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: ink }}>Thu 29 May</div>
                    <div style={{ fontSize: 9, color: muted }}>2:00 PM WAT</div>
                  </div>
                </div>
                <div style={{ padding: "9px 10px", borderRadius: 8, background: TLight, border: `1px solid ${TBorder}`, marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: ink, marginBottom: 1 }}>Business Clarity Session</div>
                  <div style={{ fontSize: 8.5, color: muted }}>60 min · Video call</div>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  {["10am", "2pm", "4pm"].map((t, i) => (
                    <div key={t} style={{ flex: 1, textAlign: "center", padding: "5px 0", borderRadius: 6, border: `1px solid ${i === 1 ? T : border}`, background: i === 1 ? TLight : "transparent", fontSize: 9, fontWeight: i === 1 ? 700 : 400, color: i === 1 ? T : muted }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Card C — Client Journey */}
              <div style={{ minWidth: 195, scrollSnapAlign: "start", background: "#fff", borderRadius: 16, border: `1px solid ${border}`, boxShadow: "0 3px 16px rgba(10,10,15,0.07)", overflow: "hidden", flexShrink: 0, padding: "14px" }}>
                <Label>Your Journey</Label>
                {[
                  { step: "Discovery call",  done: true,  active: false },
                  { step: "Clarity Session", done: true,  active: false },
                  { step: "Business Audit",  done: false, active: true  },
                  { step: "Structure Plan",  done: false, active: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: item.done ? T : item.active ? TLight : "transparent", border: `1.5px solid ${item.done ? T : item.active ? T : border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {item.done && <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      {item.active && !item.done && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T }} />}
                    </div>
                    <span style={{ fontSize: 10, color: item.done ? "#aaa" : item.active ? ink : muted, fontWeight: item.active ? 700 : 400, textDecoration: item.done ? "line-through" : "none", flex: 1 }}>
                      {item.step}
                    </span>
                    {item.active && <span style={{ fontSize: 8, fontWeight: 700, color: T, background: TLight, borderRadius: 3, padding: "1px 6px" }}>Now</span>}
                  </div>
                ))}
                <div style={{ marginTop: 4, padding: "9px 10px", borderRadius: 8, background: TLight, border: `1px solid ${TBorder}` }}>
                  <div style={{ fontSize: 9.5, color: T, fontWeight: 700 }}>Next: Business Audit</div>
                  <div style={{ fontSize: 8.5, color: muted, marginTop: 1 }}>Thu 29 May · Confirmed</div>
                </div>
              </div>
            </div>

            {/* Scroll hint dots */}
            <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 12 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: i === 0 ? 16 : 6, height: 6, borderRadius: 3, background: i === 0 ? T : border, transition: "width 0.3s" }} />
              ))}
            </div>
          </div>

          {/* ─── RIGHT - Animated Dashboard Composition ─── */}
          <div className="hidden lg:block" style={{ position: "relative", height: 580, animation: "slideRight 0.7s ease 0.2s both" }}>

            {/* CARD 1 - Business Health Score (top-left, behind, floatA) */}
            <Card style={{ top: 10, left: 0, width: 172, zIndex: 5, animation: "floatA 7s ease-in-out infinite", boxShadow: "0 2px 14px rgba(10,10,15,0.05)" }}>
              <div style={{ padding: "14px 13px 0" }}>
                <Label>Business Health</Label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <ScoreArc score={scoreVal} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: ink }}>{scoreVal}</span>
                      <span style={{ fontSize: 7, color: muted, marginTop: -1 }}>/100</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: ink, marginBottom: 2 }}>Needs Structure</div>
                    <div style={{ fontSize: 8.5, color: muted, lineHeight: 1.5 }}>Clarity gaps found in operations</div>
                  </div>
                </div>
                {[
                  { label: "Clarity", pct: 58 },
                  { label: "Structure", pct: 42 },
                  { label: "Systems", pct: 31 },
                ].map((r, i) => (
                  <div key={r.label} style={{ marginBottom: 7 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8.5, color: muted, marginBottom: 3 }}>
                      <span>{r.label}</span><span style={{ color: ink, fontWeight: 600 }}>{r.pct}%</span>
                    </div>
                    <AnimBar pct={r.pct} delay={700 + i * 150} />
                  </div>
                ))}
              </div>
              <div style={{ padding: "9px 13px 12px", borderTop: `1px solid ${border}`, marginTop: 4 }}>
                <div style={{ fontSize: 8.5, color: T, fontWeight: 700 }}>→ Book a Clarity Session</div>
              </div>
            </Card>

            {/* CARD 2 - Next Available Session (bottom-left, front, floatB) */}
            <Card style={{ bottom: 22, left: 8, width: 164, zIndex: 20, animation: "floatB 8s ease-in-out 1s infinite" }}>
              <div style={{ padding: "13px 13px" }}>
                <Label>Next Available</Label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: TLight, border: `1px solid ${TBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={T} strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: ink }}>Thu 29 May</div>
                    <div style={{ fontSize: 8.5, color: muted }}>2:00 PM WAT</div>
                  </div>
                </div>
                <div style={{ padding: "8px 10px", borderRadius: 8, background: TLight, border: `1px solid ${TBorder}`, marginBottom: 10 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: ink, marginBottom: 1 }}>Business Clarity Session</div>
                  <div style={{ fontSize: 8.5, color: muted }}>60 min · Video call</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {["10am", "2pm", "4pm"].map((t, i) => (
                    <div key={t} style={{ flex: 1, textAlign: "center", padding: "5px 0", borderRadius: 6, border: `1px solid ${i === 1 ? T : border}`, background: i === 1 ? TLight : "transparent", fontSize: 8.5, fontWeight: i === 1 ? 700 : 400, color: i === 1 ? T : muted }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* ══════════════════════════════
                MAIN DASHBOARD PANEL
            ══════════════════════════════ */}
            <div style={{
              position: "absolute", top: 28, left: 140, right: 140, bottom: 48,
              background: "#fff", borderRadius: 18, border: `1px solid ${border}`,
              overflow: "hidden", zIndex: 10, display: "flex", flexDirection: "column",
              animation: "glowPulse 5s ease-in-out infinite",
            }}>
              {/* Header */}
              <div style={{ padding: "11px 14px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "#FAFAFA" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: T, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: ink }}>Prowess</span>
                  <span style={{ fontSize: 9.5, color: muted }}>· Client Hub</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: T, animation: "livePulse 2s ease-in-out infinite" }} />
                  <span style={{ fontSize: 8.5, color: T, fontWeight: 600 }}>Live</span>
                </div>
              </div>

              {/* Active clients */}
              <div style={{ padding: "10px 13px 10px", flexShrink: 0 }}>
                <Label>Active Clients This Month</Label>
                {[
                  { name: "Chioma's Store",     stage: "Structure Plan", tier: "solid" as const,  pct: 88 },
                  { name: "Nkemelu Ltd",        stage: "Business Audit", tier: "mid"   as const,  pct: 54 },
                  { name: "FoodBiz Co.",         stage: "Clarity Session", tier: "soft"  as const, pct: 25 },
                ].map((c, i) => (
                  <div key={c.name} style={{ marginBottom: 9 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 9.5, fontWeight: 600, color: ink }}>{c.name}</span>
                      <StatusBadge label={c.stage} tier={c.tier} />
                    </div>
                    <AnimBar pct={c.pct} delay={800 + i * 200} />
                  </div>
                ))}
              </div>

              {/* Session outcomes */}
              <div style={{ padding: "8px 13px 10px", borderTop: `1px solid ${border}`, flexShrink: 0 }}>
                <Label>Recent Session Outcomes</Label>
                {[
                  { outcome: "Business model clarified",    result: "Immediate" },
                  { outcome: "3-month roadmap delivered",   result: "Week 1" },
                  { outcome: "Systems bottleneck found",    result: "Day 1" },
                ].map((item) => (
                  <div key={item.outcome} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 4, background: T, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span style={{ fontSize: 9, color: ink, fontWeight: 500 }}>{item.outcome}</span>
                    </div>
                    <span style={{ fontSize: 8.5, color: muted, marginLeft: 6, flexShrink: 0 }}>{item.result}</span>
                  </div>
                ))}
              </div>

              {/* Journey stages */}
              <div style={{ flex: 1, padding: "8px 13px 12px", borderTop: `1px solid ${border}`, overflow: "hidden" }}>
                <Label>Client Journey Stages</Label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { stage: "Discovery",  done: true  },
                    { stage: "Clarity",    done: true  },
                    { stage: "Audit",      done: false, active: true },
                    { stage: "Structure",  done: false, active: false },
                  ].map((s, i) => (
                    <div key={s.stage} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ width: "100%", height: 28, borderRadius: 6, background: s.done ? T : s.active ? TLight : "#F3F3F5", border: `1px solid ${s.done ? T : s.active ? TBorder : border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4, transition: "all 0.3s" }}>
                        {s.done ? (
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.active ? T : border }} />
                        )}
                      </div>
                      <div style={{ fontSize: 7.5, color: s.done ? T : s.active ? ink : muted, fontWeight: s.done || s.active ? 700 : 400 }}>{s.stage}</div>
                    </div>
                  ))}
                </div>
                {/* Connector line */}
                <div style={{ position: "relative", height: 2, background: "#EDEDF0", borderRadius: 1, margin: "-26px 8px 18px", zIndex: -1 }}>
                  <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "50%", background: T, borderRadius: 1, transition: "width 1.2s ease" }} />
                </div>
              </div>
            </div>
            {/* ══════════════════════════════ */}

            {/* CARD 3 - 90-Day Outcome (top-right, behind, floatC) */}
            <Card style={{ top: 18, right: 0, width: 160, zIndex: 5, animation: "floatC 6s ease-in-out 0.5s infinite", boxShadow: "0 2px 14px rgba(10,10,15,0.05)" }}>
              <div style={{ padding: "13px 13px 13px" }}>
                <Label>90-Day Result</Label>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 11, padding: "8px 9px", borderRadius: 8, background: TLight, border: `1px solid ${TBorder}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: T, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: ink }}>Chioma's Store</div>
                    <div style={{ fontSize: 8, color: muted }}>After clarity session</div>
                  </div>
                </div>
                {[
                  { metric: "Revenue",         val: "↑ 180%" },
                  { metric: "Clarity score",   val: "↑ 94pts" },
                  { metric: "Systems built",   val: "3 new" },
                ].map((r) => (
                  <div key={r.metric} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7, paddingBottom: 7, borderBottom: `1px solid ${border}` }}>
                    <span style={{ fontSize: 9, color: muted }}>{r.metric}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T }}>{r.val}</span>
                  </div>
                ))}
                <div style={{ fontSize: 8.5, color: muted, marginTop: 2, fontStyle: "italic" }}>
                  "We finally know what to fix."
                </div>
              </div>
            </Card>

            {/* CARD 4 - Journey Progress (bottom-right, front, floatD) */}
            <Card style={{ bottom: 16, right: 0, width: 162, zIndex: 20, animation: "floatD 9s ease-in-out 2s infinite" }}>
              <div style={{ padding: "13px 13px 13px" }}>
                <Label>Your Journey</Label>
                {[
                  { step: "Discovery call",       done: true  },
                  { step: "Clarity Session",       done: true  },
                  { step: "Business Audit",        done: false, active: true  },
                  { step: "Structure Plan",        done: false, active: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 5, background: item.done ? T : item.active ? TLight : "transparent", border: `1.5px solid ${item.done ? T : item.active ? T : border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                      {item.done && (
                        <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {item.active && !item.done && (
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: T }} />
                      )}
                    </div>
                    <span style={{ fontSize: 9.5, color: item.done ? "#aaa" : item.active ? ink : muted, fontWeight: item.active ? 700 : item.done ? 400 : 400, textDecoration: item.done ? "line-through" : "none", lineHeight: 1.45 }}>
                      {item.step}
                    </span>
                    {item.active && (
                      <span style={{ fontSize: 7.5, fontWeight: 700, color: T, background: TLight, borderRadius: 3, padding: "1px 5px", marginLeft: "auto", flexShrink: 0, marginTop: 2 }}>Now</span>
                    )}
                  </div>
                ))}
                <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: TLight, border: `1px solid ${TBorder}` }}>
                  <div style={{ fontSize: 9, color: T, fontWeight: 700 }}>Next: Business Audit</div>
                  <div style={{ fontSize: 8.5, color: muted, marginTop: 1 }}>Scheduled · Thu 29 May</div>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </section>
  );
}
