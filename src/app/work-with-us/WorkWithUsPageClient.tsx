"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";
import AgencyPageHeader from "@/components/AgencyPageHeader";
import { Reveal } from "@/components/Reveal";

type Role = {
  id: string;
  title: string;
  location?: string | null;
  job_type?: string | null;
  level?: string | null;
  summary?: string | null;
  responsibilities?: string | null;
  requirements?: string | null;
  apply_url?: string | null;
  is_published: boolean;
  created_at: string;
};

type RolesResponse = {
  ok?: boolean;
  error?: string;
  items?: Role[];
};

type SubscribeResponse = {
  ok?: boolean;
  error?: string;
};

const CHEVRON = (
  <svg className="h-5 w-5 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
  </svg>
);

function PerkIcon({ path }: { path: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

const perks = [
  { icon: <PerkIcon path="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />, title: "Clear roles", desc: "You will always know what matters and what to do next. No confusion, no shifting targets." },
  { icon: <PerkIcon path="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />, title: "Room to grow", desc: "You will build real skills in writing, systems, and structured thinking that go beyond the job." },
  { icon: <PerkIcon path="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />, title: "Good communication", desc: "Clear updates, honest feedback, and decisions that are explained - not just handed down." },
  { icon: <PerkIcon path="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />, title: "Simple processes", desc: "We use clean tools and documented systems so work flows without friction or guesswork." },
  { icon: <PerkIcon path="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />, title: "Flexible where possible", desc: "We focus on outcomes and good delivery, not where you sit or what time you log in." },
  { icon: <PerkIcon path="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />, title: "Respect for quality", desc: "We prefer work that is correct, clear, and useful - and we take the time to get it right." },
];

export default function WorkWithUsPageClient() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    const loadRoles = async () => {
      setLoadingRoles(true);
      try {
        const res = await fetch("/api/careers/roles", { cache: "no-store" });
        const text = await res.text();
        let json: RolesResponse | null = null;
        try { json = text ? JSON.parse(text) : null; } catch { json = null; }
        if (!res.ok || !json?.ok) throw new Error(json?.error || `Request failed (${res.status}).`);
        setRoles(json.items || []);
      } catch (e) {
        console.error(e);
        setRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    };
    loadRoles();
  }, []);

  const hasOpenings = roles.length > 0;

  return (
    <div className="min-h-screen">

      <AgencyPageHeader
        eyebrow="Careers"
        title={
          <>
            Work with us. <span className="text-primary">Build with purpose.</span>
          </>
        }
        description="At Prowess Digital Solutions, we help founders everywhere build properly. If you think clearly, communicate well, and take quality seriously, you will fit in here."
        primaryAction={{ label: "See Open Roles", href: "#openings" }}
        secondaryAction={{ label: "Our Work Culture", href: "#culture" }}
        proof={[
          "Clear work standards",
          "Practical client problems",
          "A calm, structured team culture",
        ]}
      />

      {/* ── WHAT YOU CAN EXPECT ───────────────────────────────────────────── */}
      <section id="culture" className="bg-background py-20 sm:py-24">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
                Work Culture
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                What you can expect
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                We keep work structured and clear so people can do their best without confusion.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {perks.map((p, i) => (
              <Reveal key={p.title} delay={i * 70}>
                <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] ring-1 ring-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    {p.icon}
                  </div>
                  <h3 className="font-bold text-foreground">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={150}>
            <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
              <p className="text-base font-semibold text-foreground">
                We value clarity over noise.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Every role here is an opportunity to do real, meaningful work that helps businesses grow properly.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── OPEN ROLES ────────────────────────────────────────────────────── */}
      <section id="openings" className="bg-muted py-20 sm:py-24">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
                Open Positions
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Current openings
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                If a role fits you, apply. We like people who think clearly and do work properly.
              </p>
            </div>
          </Reveal>

          <div className="mt-12">
            {loadingRoles ? (
              <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
                <p className="text-sm text-muted-foreground">Loading openings…</p>
              </div>
            ) : hasOpenings ? (
              <div className="grid gap-5 md:grid-cols-2">
                {roles.map((r, i) => (
                  <Reveal key={r.id} delay={i * 90} as="article"
                    className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="p-7">
                      {/* Tags row */}
                      <div className="mb-4 flex flex-wrap gap-2">
                        {r.level && (
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {r.level}
                          </span>
                        )}
                        {r.job_type && (
                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                            {r.job_type}
                          </span>
                        )}
                        {r.location && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            {r.location}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-foreground">{r.title}</h3>

                      {r.summary && (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.summary}</p>
                      )}

                      <details className="group mt-6">
                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-border px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-muted">
                          <span className="group-open:hidden">View role details</span>
                          <span className="hidden group-open:inline">Hide details</span>
                          {CHEVRON}
                        </summary>

                        <div className="mt-5 space-y-5 border-t border-border pt-5">
                          {r.responsibilities && (
                            <div>
                              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Responsibilities
                              </p>
                              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                                {r.responsibilities}
                              </p>
                            </div>
                          )}
                          {r.requirements && (
                            <div>
                              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Requirements
                              </p>
                              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                                {r.requirements}
                              </p>
                            </div>
                          )}
                          {r.apply_url ? (
                            <a
                              href={r.apply_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block w-full rounded-xl bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                            >
                              Apply now →
                            </a>
                          ) : (
                            <div className="rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
                              Application link coming soon.
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  </Reveal>
                ))}
              </div>
            ) : (
              <Reveal>
                <div className="relative overflow-hidden rounded-3xl bg-foreground">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "linear-gradient(color-mix(in oklch, var(--primary) 40%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--primary) 40%, transparent) 1px, transparent 1px)",
                      backgroundSize: "40px 40px",
                    }}
                  />
                  <div className="relative px-8 py-16 text-center sm:px-14">
                    <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-background sm:text-3xl">
                      No open roles right now
                    </h3>
                    <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-background/60">
                      We do not have any open positions at the moment. Drop your email below and we will notify you as soon as something opens up.
                    </p>
                    <div className="mx-auto mt-8 max-w-sm">
                      <CareersNotifyModal />
                    </div>
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </Container>
      </section>

      {/* ── CLOSING CTA ───────────────────────────────────────────────────── */}
      <section className="bg-primary py-20">
        <Container>
          <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
              Do not see your role listed?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-primary-foreground/80">
              If you believe you can add real value to what we are building, reach out anyway.
              We always consider strong, thoughtful applicants.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl bg-card px-8 py-3.5 font-semibold text-primary shadow-lg transition hover:scale-[1.02]"
              >
                Get in Touch
              </a>
              <CareersNotifyInline />
            </div>
          </div>
          </Reveal>
        </Container>
      </section>

    </div>
  );
}

function CareersNotifyInline() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-xl border-2 border-white/40 bg-transparent px-8 py-3.5 font-semibold text-white transition hover:bg-white/10"
      >
        Get notified of openings
      </button>
      {open && <NotifyModal onClose={() => setOpen(false)} />}
    </>
  );
}

function CareersNotifyModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border-2 border-white/30 bg-white/10 px-8 py-3.5 font-semibold text-white transition hover:bg-white/20"
      >
        Get notified of future openings
      </button>
      {open && <NotifyModal onClose={() => setOpen(false)} />}
    </>
  );
}

function NotifyModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    const v = email.trim().toLowerCase();
    if (!v || !v.includes("@")) { setError("Please enter a valid email."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/careers/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v }),
      });
      const text = await res.text();
      let json: SubscribeResponse | null = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Request failed (${res.status}).`);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h4 className="text-xl font-bold text-foreground">Get notified</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Drop your email. We will reach out when a role opens.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {done ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <p className="font-semibold text-emerald-800">You are on the list</p>
            <p className="mt-1 text-sm text-emerald-700">Check your inbox for a confirmation.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Email address
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Saving…" : "Notify me"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
