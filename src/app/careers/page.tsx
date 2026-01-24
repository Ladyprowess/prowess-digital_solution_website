"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";

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

export default function CareersPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    const loadRoles = async () => {
      setLoadingRoles(true);

      try {
        const res = await fetch("/api/careers/roles", { cache: "no-store" });
        const text = await res.text();

        let json: any = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          json = null;
        }

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || `Request failed (${res.status}).`);
        }

        setRoles((json.items || []) as Role[]);
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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">

      {/* HERO */}
      <section className="bg-gradient-to-b from-slate-50 to-white px-4 py-20">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            {/* Left */}
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#223433] shadow-sm">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#507c80] text-white">
                  {/* icon should be white */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 17l6-6 4 4 7-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 4h7v7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Careers at Prowess Digital Solutions
              </div>

              <h3 className="text-4xl font-semibold leading-tight text-[#223433] md:text-6xl">
                Work With Us
              </h3>

              <p className="mt-6 text-lg leading-relaxed text-[#4d5f5e] md:text-xl">
                At Prowess Digital Solutions, we help business owners make clear
                decisions and run their work properly. If you think clearly,
                communicate well, and enjoy organised work, you will fit in.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#openings"
                  className="rounded-xl bg-[#507c80] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3d5f62]"
                >
                  View openings
                </a>

                <a
                  href="#experience"
                  className="rounded-xl border border-[#dbe9e8] bg-white px-6 py-3 text-sm font-semibold text-[#223433] hover:bg-[#f6fbfb]"
                >
                  Why work with us
                </a>
              </div>
            </div>

            {/* Right Card (quick perks) */}
            <div className="rounded-2xl border border-[#dbe9e8] bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-[#223433]">
                What you can expect
              </h2>
              <p className="mt-2 text-sm text-[#4d5f5e]">
                We keep work simple and structured, so people can do their best
                work without confusion.
              </p>

              <ul className="mt-6 space-y-4">
                {[
                  "Clear roles and expectations",
                  "Simple processes and clean tools",
                  "Room to learn and grow",
                  "Flexible work style (focused on results)",
                  "Respect for quality and consistency",
                  "Good communication and feedback",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#507c80] text-white">
                      {/* icon should be white */}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="text-sm font-semibold text-[#223433]">
                      {t}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* OPENINGS */}
      <section id="openings" className="px-4 pb-16">

        <Container>
          {loadingRoles ? (
            <div className="rounded-2xl border border-[#dbe9e8] bg-white px-6 py-10 text-center">
              <p className="text-sm text-[#4d5f5e]">Loading openings…</p>
            </div>
          ) : hasOpenings ? (
            <>
              {/* ✅ NO GREEN BOX WHEN ROLES EXIST */}
              <div className="mb-8">
                <h2 className="text-3xl font-semibold text-[#223433] md:text-4xl">
                  Current openings
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#4d5f5e] md:text-base">
                  If a role fits you, apply. We like people who think clearly
                  and do work properly.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {roles.map((r) => (
                  <article
                    key={r.id}
                    className="overflow-hidden rounded-2xl border border-[#dbe9e8] bg-white"
                  >
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold text-[#223433]">
                          {r.title}
                        </h3>
                        {r.level ? (
                          <span className="rounded-full bg-[#eaf6f6] px-3 py-1 text-xs font-semibold text-[#223433]">
                            {r.level}
                          </span>
                        ) : null}
                        {r.job_type ? (
                          <span className="rounded-full bg-[#eaf6f6] px-3 py-1 text-xs font-semibold text-[#223433]">
                            {r.job_type}
                          </span>
                        ) : null}
                        {r.location ? (
                          <span className="rounded-full bg-[#eaf6f6] px-3 py-1 text-xs font-semibold text-[#223433]">
                            {r.location}
                          </span>
                        ) : null}
                      </div>

                      {r.summary ? (
                        <p className="mt-3 text-sm leading-relaxed text-[#4d5f5e]">
                          {r.summary}
                        </p>
                      ) : null}

                      <details className="group mt-5">
                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl bg-[#eaf6f6] px-5 py-4 text-sm font-semibold text-[#223433] hover:bg-[#dff1f1]">
                          <span className="group-open:hidden">
                            View role details
                          </span>
                          <span className="hidden group-open:inline">
                            Hide details
                          </span>

                          <svg
                            className="h-5 w-5 transition-transform group-open:rotate-180"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 9l6 6 6-6"
                            />
                          </svg>
                        </summary>

                        <div className="mt-5 space-y-6">
                          {r.responsibilities ? (
                            <div>
                              <p className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
                                RESPONSIBILITIES
                              </p>
                              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#4d5f5e]">
                                {r.responsibilities}
                              </p>
                            </div>
                          ) : null}

                          {r.requirements ? (
                            <div>
                              <p className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
                                REQUIREMENTS
                              </p>
                              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#4d5f5e]">
                                {r.requirements}
                              </p>
                            </div>
                          ) : null}

                          {r.apply_url ? (
                            <a
                              href={r.apply_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block w-full rounded-xl bg-[#507c80] px-6 py-3 text-center text-sm font-semibold text-white hover:bg-[#3d5f62]"
                            >
                              Apply now
                            </a>
                          ) : (
                            <div className="rounded-xl border border-[#dbe9e8] bg-white p-4">
                              <p className="text-sm font-semibold text-[#223433]">
                                How to apply
                              </p>
                              <p className="mt-1 text-sm text-[#4d5f5e]">
                                Application link will be added soon.
                              </p>
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* ✅ GREEN BOX ONLY WHEN NO OPENINGS */}
              <div className="rounded-2xl bg-[#507c80] px-6 py-12 text-center text-white md:px-10">
                <h2 className="text-3xl font-semibold md:text-4xl">
                  No current openings
                </h2>
                <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-white/90 md:text-lg">
                  We do not have any open roles right now. When a role opens, we
                  will post it here.
                </p>

                <div className="mx-auto mt-8 max-w-md">
                  <GetNotifiedButton />
                </div>
              </div>
            </>
          )}
        </Container>
      </section>

      {/* EXPERIENCE */}
      <section id="experience" className="px-4 pb-20">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="max-w-xl">
              <h2 className="text-4xl font-semibold leading-tight text-[#223433] md:text-5xl">
                The Prowess Digital Solutions Work Experience
              </h2>

              <p className="mt-5 text-base leading-relaxed text-[#4d5f5e] md:text-lg">
                Some people call it "perks" or "benefits". We call it a clear
                work culture. If you work with us, you can expect structure,
                clear communication, and support to do your work properly.
              </p>

              <div className="mt-8 inline-flex items-center gap-3 text-sm font-semibold text-[#223433]">
                <span className="h-[1px] w-10 bg-[#223433]/30" />
                <span>We value clarity over noise</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#223433]/70 bg-white p-8">
              <ul className="space-y-6">
                {[
                  {
                    title: "Structured work and clear priorities",
                    desc: "You will know what matters and what to do next.",
                  },
                  {
                    title: "Supportive feedback and guidance",
                    desc: "We help you improve, not just 'work harder'.",
                  },
                  {
                    title: "Professional growth",
                    desc: "You will build better skills in writing, systems, and thinking.",
                  },
                  {
                    title: "Flexible work hours (where possible)",
                    desc: "We focus on outcomes and good delivery.",
                  },
                  {
                    title: "Respect for quality",
                    desc: "We prefer work that is clean, correct, and useful.",
                  },
                  {
                    title: "Good communication",
                    desc: "Clear updates, clear decisions, and no confusion.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex gap-4">
                    <span className="mt-1 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#223433] text-white">
                      {/* icon should be white */}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>

                    <div>
                      <p className="font-semibold text-[#223433]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-[#4d5f5e]">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

/** Client component (modal + submit to API) */
function GetNotifiedButton() {
  return (
    <div className="w-full">
      <CareersNotifyModal />
    </div>
  );
}

function CareersNotifyModal() {
  "use client";

  const React = require("react");
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState("");

  const submit = async () => {
    setError("");
    const v = String(email || "").trim().toLowerCase();

    if (!v || !v.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/careers/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v }),
      });

      const text = await res.text();
      let json: any = null;

      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Request failed (${res.status}).`);
      }

      setDone(true);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setDone(false);
          setError("");
        }}
        className="w-full rounded-full bg-white px-8 py-4 text-sm font-semibold text-[#223433] hover:bg-[#f6fbfb]"
      >
        Get notified of future opportunities
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-[#dbe9e8] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-xl font-semibold text-[#223433]">
                  Get notified
                </h4>
                <p className="mt-1 text-sm text-[#4d5f5e]">
                  Drop your email. We will message you when a role opens.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-[#223433]/70 hover:bg-[#f6fbfb]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {done ? (
              <div className="mt-6 rounded-xl bg-[#eaf6f6] p-4">
                <p className="font-semibold text-[#223433]">
                  You're on the list ✅
                </p>
                <p className="mt-1 text-sm text-[#4d5f5e]">
                  Please check your inbox for a confirmation email.
                </p>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-4 w-full rounded-xl bg-[#507c80] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3d5f62]"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="mt-6">
                  <label className="text-xs font-semibold tracking-widest text-[#6b7d7b]">
                    EMAIL
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded-xl border border-[#dbe9e8] px-4 py-3 text-sm text-[#223433] outline-none focus:border-[#507c80]"
                  />

                  {error ? (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  ) : null}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="w-full rounded-xl border border-[#dbe9e8] bg-white px-4 py-3 text-sm font-semibold text-[#223433] hover:bg-[#f6fbfb]"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={submit}
                    disabled={loading}
                    className="w-full rounded-xl bg-[#507c80] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[#3d5f62]"
                  >
                    {loading ? "Saving..." : "Notify me"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
