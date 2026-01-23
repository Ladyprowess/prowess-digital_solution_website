"use client";

import { useEffect, useMemo, useState } from "react";
import Container from "@/components/Container";

type EventItem = {
  id: string;
  title: string;
  type: string;
  description?: string | null;
  date: string; // could be YYYY-MM-DD or ISO string
  time?: string | null;
  duration?: string | null;
  location?: string | null;
  price?: number | null;
  spots_left?: number | null;
  cover_url?: string | null;
  registration_url?: string | null;
};

const EVENT_TYPES = ["All", "Webinar", "Workshop", "Business Clinic"];

function formatDate(isoLike: string) {
  const d = new Date(isoLike);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function toISODateOnly(input: string) {
  if (!input) return "";
  return input.slice(0, 10); // works for YYYY-MM-DD and ISO
}

function isPastEvent(dateISO: string) {
  const todayISO = new Date().toISOString().slice(0, 10);
  return toISODateOnly(dateISO) < todayISO;
}

export default function EventsPage() {
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingPast, setLoadingPast] = useState(false);

  const [upcoming, setUpcoming] = useState<EventItem[]>([]);
  const [past, setPast] = useState<EventItem[]>([]);

  const [upcomingError, setUpcomingError] = useState<string | null>(null);
  const [pastError, setPastError] = useState<string | null>(null);

  const [type, setType] = useState("All");
  const [month, setMonth] = useState("All");
  const [q, setQ] = useState("");

  const [showPast, setShowPast] = useState(false);

  // modal state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<EventItem | null>(null);

  // subscribe state
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subMsg, setSubMsg] = useState<string | null>(null);

  const months = useMemo(
    () => [
      { label: "All Months", value: "All" },
      { label: "January", value: "1" },
      { label: "February", value: "2" },
      { label: "March", value: "3" },
      { label: "April", value: "4" },
      { label: "May", value: "5" },
      { label: "June", value: "6" },
      { label: "July", value: "7" },
      { label: "August", value: "8" },
      { label: "September", value: "9" },
      { label: "October", value: "10" },
      { label: "November", value: "11" },
      { label: "December", value: "12" },
    ],
    []
  );

  function openModal(item: EventItem) {
    setSelected(item);
    setOpen(true);
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    setOpen(false);
    setSelected(null);
    document.body.style.overflow = "";
  }

  function buildParams(scope: "upcoming" | "past", limit: string, searchText?: string) {
    const params = new URLSearchParams();
    params.set("scope", scope);
    params.set("limit", limit);

    // only send filters when not All
    if (type !== "All") params.set("type", type);
    if (month !== "All") params.set("month", month);

    const query = (searchText ?? q).trim();
    if (query) params.set("q", query);

    return params;
  }

  async function loadUpcoming(searchText?: string) {
    setLoadingUpcoming(true);
    setUpcomingError(null);

    try {
      const params = buildParams("upcoming", "6", searchText);
      const res = await fetch(`/api/events?${params.toString()}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setUpcoming([]);
        setUpcomingError(`Failed to load upcoming events (status ${res.status})`);
        return;
      }

      const raw = ((json?.items || json?.data || json?.events || []) as EventItem[]) || [];
      setUpcoming(raw.filter((e) => !isPastEvent(e.date)));
    } catch (err: any) {
      setUpcoming([]);
      setUpcomingError(err?.message || "Network error loading upcoming events.");
    } finally {
      setLoadingUpcoming(false);
    }
  }

  async function loadPast(searchText?: string) {
    setLoadingPast(true);
    setPastError(null);

    try {
      const params = buildParams("past", "50", searchText);
      const res = await fetch(`/api/events?${params.toString()}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setPast([]);
        setPastError(`Failed to load past events (status ${res.status})`);
        return;
      }

      const raw = ((json?.items || json?.data || json?.events || []) as EventItem[]) || [];
      setPast(raw.filter((e) => isPastEvent(e.date)));
    } catch (err: any) {
      setPast([]);
      setPastError(err?.message || "Network error loading past events.");
    } finally {
      setLoadingPast(false);
    }
  }

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim();

    if (!clean) {
      setSubMsg("Please enter your email.");
      return;
    }

    setSubmitting(true);
    setSubMsg(null);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, source: "events_page" }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setSubMsg(json?.error || "Something went wrong. Please try again.");
        return;
      }

      setSubMsg("You’re subscribed 🎉");
      setEmail("");
    } catch {
      setSubMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // load upcoming on filter change
  useEffect(() => {
    loadUpcoming();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, month]);

  // load past only when open + filters change
  useEffect(() => {
    if (showPast) loadPast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPast, type, month]);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      loadUpcoming(q);
      if (showPast) loadPast(q);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, showPast]);

  // scroll to past section when opened
  useEffect(() => {
    if (!showPast) return;
    const t = setTimeout(() => {
      document.getElementById("past-events")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(t);
  }, [showPast]);

  // close modal on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="pb-16">
      {/* HERO */}
      <section className="py-14 sm:py-20">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
              <span aria-hidden>🗓️</span>
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
              Business Events & Training
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-base text-slate-600 sm:text-lg">
              Practical sessions that help you build structure, make better decisions, and run your business properly.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 text-slate-700">🎓</div>
              <h3 className="text-lg font-semibold text-slate-900">Educational first</h3>
              <p className="mt-2 text-sm text-slate-600">We teach clearly and keep it practical.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 text-slate-700">👥</div>
              <h3 className="text-lg font-semibold text-slate-900">Community</h3>
              <p className="mt-2 text-sm text-slate-600">Meet people who value structure and growth.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 text-slate-700">💡</div>
              <h3 className="text-lg font-semibold text-slate-900">Action steps</h3>
              <p className="mt-2 text-sm text-slate-600">Leave with steps you can apply immediately.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* FILTER BAR */}
      <section className="py-6">
        <Container>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="text-sm font-semibold text-slate-900">Event Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === "All" ? "All Events" : t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-900">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-900">Search</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by title..."
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* UPCOMING */}
      <section className="py-10">
        <Container>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-3xl font-semibold text-slate-900">Upcoming Events</h2>

            <button
              type="button"
              onClick={() => {
                const next = !showPast;
                setShowPast(next);
                if (next) setLoadingPast(true);
              }}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              {showPast && loadingPast ? "Loading past events…" : showPast ? "Hide past events" : "View past events"}
            </button>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {upcomingError ? (
              <div className="text-sm text-red-600">{upcomingError}</div>
            ) : loadingUpcoming ? (
              <div className="text-sm text-slate-600">Loading events…</div>
            ) : upcoming.length === 0 ? (
              <div className="text-sm text-slate-600">No upcoming events right now.</div>
            ) : (
              upcoming.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => openModal(e)}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:shadow-sm"
                >
                  <div className="relative h-44 bg-slate-100">
                    {e.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.cover_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">No image</div>
                    )}

                    <div className="absolute left-4 top-4 rounded-full bg-[var(--steel-teal)] px-3 py-1 text-xs font-semibold text-white">
                      {e.type}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-slate-900">{e.title}</h3>

                    <div className="mt-4 space-y-2 text-sm text-slate-700">
                      <div>📅 {formatDate(e.date)}</div>
                      {e.time ? (
                        <div>
                          🕒 {e.time}
                          {e.duration ? ` (${e.duration})` : ""}
                        </div>
                      ) : null}
                      {e.location ? <div>💻 {e.location}</div> : null}
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
                      <div className="text-lg font-semibold text-slate-900">
                        {e.price && e.price > 0 ? `₦${e.price.toLocaleString()}` : "Free"}
                      </div>
                      <span className="text-sm font-medium text-[var(--steel-teal)]">View details ↳</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Container>
      </section>

      {/* PAST */}
      {showPast && (
        <section id="past-events" className="py-10">
          <Container>
            <h2 className="text-2xl font-semibold text-slate-900">Past Events</h2>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {pastError ? (
                <div className="text-sm text-red-600">{pastError}</div>
              ) : loadingPast ? (
                <div className="text-sm text-slate-600">Loading past events…</div>
              ) : past.length === 0 ? (
                <div className="text-sm text-slate-600">No past events found.</div>
              ) : (
                past.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => openModal(e)}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:shadow-sm"
                  >
                    <div className="relative h-44 bg-slate-100">
                      {e.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.cover_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">No image</div>
                      )}

                      <div className="absolute left-4 top-4 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">
                        Past event
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-slate-900">{e.title}</h3>
                      <div className="mt-3 text-sm text-slate-700">📅 {formatDate(e.date)}</div>
                      <div className="mt-6 border-t border-slate-200 pt-5 text-sm font-medium text-[var(--steel-teal)]">
                        View details ↳
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Container>
        </section>
      )}

      {/* NEVER MISS AN EVENT (Resend subscribe) */}
      <section className="py-14 sm:py-20">
        <Container>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                <span aria-hidden>🔔</span>
              </div>

              <div className="flex-1">
                <h2 className="text-3xl font-semibold text-slate-900 sm:text-5xl">Never Miss an Event</h2>
                <p className="mt-3 max-w-3xl text-base text-slate-600 sm:text-lg">
                  Subscribe to get updates about upcoming events, early-bird pricing, and useful community resources.
                </p>

                <form onSubmit={handleSubscribe} className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm"
                  />
                  <button
                    disabled={submitting}
                    className="rounded-2xl bg-[var(--steel-teal)] px-8 py-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? "Subscribing…" : "Subscribe Now"}
                  </button>
                </form>

                <p className="mt-4 text-sm text-slate-600">
                  We respect your privacy. Unsubscribe at any time. No spam, just useful business guidance.
                </p>

                {subMsg ? <p className="mt-3 text-sm text-slate-700">{subMsg}</p> : null}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* MODAL */}
      {open && selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative z-[61] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className="relative h-52 bg-slate-100">
              {selected.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.cover_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">No image</div>
              )}

              <button
                type="button"
                onClick={closeModal}
                className="absolute right-4 top-4 rounded-xl bg-white/90 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
              >
                Close
              </button>

              <div className="absolute left-4 top-4 rounded-full bg-[var(--steel-teal)] px-3 py-1 text-xs font-semibold text-white">
                {selected.type}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <h3 className="text-2xl font-semibold text-slate-900">{selected.title}</h3>

              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <div>📅 {formatDate(selected.date)}</div>
                {selected.time ? (
                  <div>
                    🕒 {selected.time}
                    {selected.duration ? ` (${selected.duration})` : ""}
                  </div>
                ) : null}
                {selected.location ? <div>💻 {selected.location}</div> : null}
              </div>

              {selected.description ? (
                <p className="mt-5 text-sm leading-6 text-slate-600">{selected.description}</p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-lg font-semibold text-slate-900">
                  {selected.price && selected.price > 0 ? `₦${selected.price.toLocaleString()}` : "Free"}
                </div>

                <div className="flex gap-3">
                  {selected.registration_url ? (
                    <a
                      href={selected.registration_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl bg-[var(--steel-teal)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                    >
                      {isPastEvent(selected.date) ? "View event" : "Register for event"}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="cursor-not-allowed rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
                      disabled
                    >
                      No registration link
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Done
                  </button>
                </div>
              </div>

              {typeof selected.spots_left === "number" ? (
                <p className="mt-4 text-sm text-amber-700">Only {selected.spots_left} spots left</p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
