"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import AgencyPageHeader from "@/components/AgencyPageHeader";
import { Reveal } from "@/components/Reveal";

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="inline shrink-0 -mt-0.5 mr-1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="inline shrink-0 -mt-0.5 mr-1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function LaptopIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="inline shrink-0 -mt-0.5 mr-1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.625c.621 0 1.125.504 1.125 1.125v.375M3.75 4.5H21m-17.25 0v9.75A2.25 2.25 0 006 16.5h12a2.25 2.25 0 002.25-2.25V4.5" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

type EventItem = {
  id: string;

  // NEW (for internal registration page)
  slug?: string | null;

  title: string;

  // Your current field
  type: string;

  description?: string | null;

  // Your current fields
  date: string; // YYYY-MM-DD or ISO-like string
  time?: string | null;
  duration?: string | null;
  location?: string | null;

  // Your current fields
  price?: number | null;
  spots_left?: number | null;
  cover_url?: string | null;

  // Old external link (still supported as fallback)
  registration_url?: string | null;

  // Optional: if your API starts returning these later, we’ll use them
  start_datetime?: string | null; // ISO datetime
  registration_type?: "free" | "paid" | null;
  price_usd?: number | null;
};

type RawEventItem = Partial<EventItem> & {
  event_type?: string | null;
  startDatetime?: string | null;
  start_date?: string | null;
};

type EventsResponse = {
  items?: RawEventItem[];
  data?: RawEventItem[];
  events?: RawEventItem[];
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
  return input.slice(0, 10);
}

function isPastEvent(dateISO: string) {
  const todayISO = new Date().toISOString().slice(0, 10);
  return toISODateOnly(dateISO) < todayISO;
}

/**
 * Normalise events coming from API.
 * This makes the UI work whether you return:
 * - date/time fields (old)
 * OR
 * - start_datetime / price_usd / slug (new)
 */
function normaliseEvent(e: RawEventItem): EventItem {
  const start = e.start_datetime || e.startDatetime || e.start_date || null;

  // date: prefer explicit e.date, else derive from start_datetime
  const date = e.date
    ? String(e.date)
    : start
      ? String(start).slice(0, 10)
      : "";

  // price: prefer price_usd (authoritative post-migration), else legacy price
  const price =
    typeof e.price_usd === "number"
      ? e.price_usd
      : typeof e.price === "number"
        ? e.price
        : null;

  // slug: prefer e.slug
  const slug = e.slug ? String(e.slug) : null;

  return {
    id: String(e.id),
    slug,
    title: String(e.title || ""),
    type: String(e.type || e.event_type || "Event"),
    description: e.description ?? null,
    date,
    time: e.time ?? null,
    duration: e.duration ?? null,
    location: e.location ?? null,
    price,
    spots_left: typeof e.spots_left === "number" ? e.spots_left : null,
    cover_url: e.cover_url ?? null,
    registration_url: e.registration_url ?? null,

    start_datetime: start ? String(start) : null,
    registration_type: e.registration_type ?? null,
    price_usd: typeof e.price_usd === "number" ? e.price_usd : null,
  };
}

export default function EventsPage() {
  const router = useRouter();
  const PAGE_SIZE = 6;

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

  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);

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

  function buildParams(scope: "upcoming" | "past", page: number, searchText?: string) {
    const params = new URLSearchParams();
    params.set("scope", scope);
    params.set("limit", String(PAGE_SIZE));
    params.set("page", String(page));

    if (type !== "All") params.set("type", type);
    if (month !== "All") params.set("month", month);

    const query = (searchText ?? q).trim();
    if (query) params.set("q", query);

    return params;
  }

  async function loadUpcoming(page: number, searchText?: string) {
    setLoadingUpcoming(true);
    setUpcomingError(null);

    try {
      const params = buildParams("upcoming", page, searchText);
      const res = await fetch(`/api/events?${params.toString()}`, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as EventsResponse | null;

      if (!res.ok) {
        setUpcoming([]);
        setUpcomingError(`Failed to load upcoming events (status ${res.status})`);
        return;
      }

      const raw = json?.items || json?.data || json?.events || [];
      const normalised = raw.map(normaliseEvent);

      setUpcoming(normalised.filter((e) => !isPastEvent(e.date)));
    } catch (err: unknown) {
      setUpcoming([]);
      setUpcomingError(err instanceof Error ? err.message : "Network error loading upcoming events.");
    } finally {
      setLoadingUpcoming(false);
    }
  }

  async function loadPast(page: number, searchText?: string) {
    setLoadingPast(true);
    setPastError(null);

    try {
      const params = buildParams("past", page, searchText);
      const res = await fetch(`/api/events?${params.toString()}`, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as EventsResponse | null;

      if (!res.ok) {
        setPast([]);
        setPastError(`Failed to load past events (status ${res.status})`);
        return;
      }

      const raw = json?.items || json?.data || json?.events || [];
      const normalised = raw.map(normaliseEvent);

      setPast(normalised.filter((e) => isPastEvent(e.date)));
    } catch (err: unknown) {
      setPast([]);
      setPastError(err instanceof Error ? err.message : "Network error loading past events.");
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
        body: JSON.stringify({ email: clean, preference: "events", source: "events_page" }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setSubMsg(json?.error || "Something went wrong. Please try again.");
        return;
      }

      setSubMsg("You're subscribed.");
      setEmail("");
    } catch {
      setSubMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ✅ Reset pages when filters change
  useEffect(() => {
    setUpcomingPage(1);
    setPastPage(1);
  }, [type, month]);

  // ✅ Debounced search resets pages
  useEffect(() => {
    const t = setTimeout(() => {
      setUpcomingPage(1);
      setPastPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  // ✅ Fetch upcoming whenever page / filters / search change
  useEffect(() => {
    loadUpcoming(upcomingPage, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcomingPage, type, month, q]);

  // ✅ Fetch past whenever open + page / filters / search change
  useEffect(() => {
    if (!showPast) return;
    loadPast(pastPage, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPast, pastPage, type, month, q]);

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
  }, [open]);

  const isUpcomingLastPage = upcoming.length < PAGE_SIZE;
  const isPastLastPage = past.length < PAGE_SIZE;

  function goToInternalEventPage(item: EventItem) {
    // If we have slug, use internal page
    if (item.slug) {
      closeModal();
      router.push(`/events/${item.slug}`);
      return;
    }

    // Fallback to old external link (for old events)
    if (item.registration_url) {
      window.open(item.registration_url, "_blank", "noreferrer");
      return;
    }

    // Nothing available
    setSubMsg("This event does not have a registration page yet.");
  }

  return (
    <div className="pb-16">
      <AgencyPageHeader
        eyebrow="Events and Training"
        title={
          <>
            Business events and <span className="text-primary">training.</span>
          </>
        }
        description="Practical sessions that help you build structure, make better decisions, and run your business properly."
        primaryAction={{ label: "See Upcoming Events", href: "#upcoming-events" }}
        secondaryAction={{ label: "Get Event Updates", href: "#subscribe" }}
        proof={[
          "Practical business training",
          "Clear topics and registration steps",
          "Sessions built for owners and teams",
        ]}
      />

      {/* FILTER BAR */}
      <section className="py-6">
        <Container>
          <Reveal>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="text-sm font-semibold text-foreground">Event Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === "All" ? "All Events" : t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground">Search</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by title..."
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                />
              </div>
            </div>
          </div>
          </Reveal>
        </Container>
      </section>

      {/* UPCOMING */}
      <section className="py-10">
        <Container>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-3xl font-semibold text-foreground">Upcoming Events</h2>

            <button
              type="button"
              onClick={() => setShowPast((v) => !v)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              {showPast ? "Hide past events" : "View past events"}
            </button>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {upcomingError ? (
              <div className="text-sm text-red-600">{upcomingError}</div>
            ) : loadingUpcoming ? (
              <div className="text-sm text-muted-foreground">Loading events…</div>
            ) : upcoming.length === 0 ? (
              <div className="text-sm text-muted-foreground">No upcoming events right now.</div>
            ) : (
              upcoming.map((e, i) => (
                <Reveal key={e.id} delay={i * 70}>
                <button
                  type="button"
                  onClick={() => openModal(e)}
                  className="group w-full overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative h-44 bg-muted">
                    {e.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.cover_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
                    )}

                    <div className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                      {e.type}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-foreground">{e.title}</h3>

                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <div><CalendarIcon />{formatDate(e.date)}</div>
                      {e.time ? (
                        <div>
                          <ClockIcon />{e.time}
                          {e.duration ? ` (${e.duration})` : ""}
                        </div>
                      ) : null}
                      {e.location ? <div><LaptopIcon />{e.location}</div> : null}
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
                      <div className="text-lg font-semibold text-foreground">
                        {e.price && e.price > 0
                          ? `$${e.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "Free"}
                      </div>
                      <span className="text-sm font-medium text-primary">View details →</span>
                    </div>
                  </div>
                </button>
                </Reveal>
              ))
            )}
          </div>

          {/* UPCOMING PAGINATION */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setUpcomingPage((p) => Math.max(1, p - 1))}
              disabled={upcomingPage === 1 || loadingUpcoming}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              Prev
            </button>

            <div className="text-sm font-medium text-muted-foreground">Page {upcomingPage}</div>

            <button
              type="button"
              onClick={() => setUpcomingPage((p) => p + 1)}
              disabled={loadingUpcoming || isUpcomingLastPage}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </Container>
      </section>

      {/* PAST */}
      {showPast && (
        <section id="past-events" className="py-10">
          <Container>
            <h2 className="text-2xl font-semibold text-foreground">Past Events</h2>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {pastError ? (
                <div className="text-sm text-red-600">{pastError}</div>
              ) : loadingPast ? (
                <div className="text-sm text-muted-foreground">Loading past events…</div>
              ) : past.length === 0 ? (
                <div className="text-sm text-muted-foreground">No past events found.</div>
              ) : (
                past.map((e, i) => (
                  <Reveal key={e.id} delay={i * 70}>
                  <button
                    type="button"
                    onClick={() => openModal(e)}
                    className="w-full overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="relative h-44 bg-muted">
                      {e.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.cover_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
                      )}

                      <div className="absolute left-4 top-4 rounded-full bg-foreground/80 px-3 py-1 text-xs font-semibold text-white">
                        Past event
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-foreground">{e.title}</h3>
                      <div className="mt-3 flex items-center text-sm text-muted-foreground"><CalendarIcon />{formatDate(e.date)}</div>
                      <div className="mt-6 border-t border-border pt-5 text-sm font-medium text-primary">
                        View details →
                      </div>
                    </div>
                  </button>
                  </Reveal>
                ))
              )}
            </div>

            {/* PAST PAGINATION */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPastPage((p) => Math.max(1, p - 1))}
                disabled={pastPage === 1 || loadingPast}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                Prev
              </button>

              <div className="text-sm font-medium text-muted-foreground">Page {pastPage}</div>

              <button
                type="button"
                onClick={() => setPastPage((p) => p + 1)}
                disabled={loadingPast || isPastLastPage}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </Container>
        </section>
      )}

      {/* NEVER MISS AN EVENT */}
      <section className="py-14 sm:py-20">
        <Container>
          <Reveal>
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-10">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] ring-1 ring-primary/10 text-primary">
                <BellIcon />
              </div>

              <div className="flex-1">
                <h2 className="text-3xl font-semibold text-foreground sm:text-5xl">Never Miss an Event</h2>
                <p className="mt-3 max-w-3xl text-base text-muted-foreground sm:text-lg">
                  Subscribe to get updates about upcoming events, early-bird pricing, and useful community resources.
                </p>

                <form onSubmit={handleSubscribe} className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full rounded-2xl border border-border bg-background px-5 py-4 text-sm text-foreground"
                  />
                  <button
                    disabled={submitting}
                    className="rounded-2xl bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? "Subscribing…" : "Subscribe Now"}
                  </button>
                </form>

                <p className="mt-4 text-sm text-muted-foreground">
                  We respect your privacy. Unsubscribe at any time. No spam, just useful business guidance.
                </p>

                {subMsg ? <p className="mt-3 text-sm text-muted-foreground">{subMsg}</p> : null}
              </div>
            </div>
          </div>
          </Reveal>
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

          <div className="relative z-[61] w-full max-w-2xl overflow-hidden rounded-3xl bg-card shadow-xl">
            <div className="relative h-52 bg-muted">
              {selected.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.cover_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
              )}

              <button
                type="button"
                onClick={closeModal}
                className="absolute right-4 top-4 rounded-xl bg-card/90 px-3 py-2 text-sm font-semibold text-foreground hover:bg-card"
              >
                Close
              </button>

              <div className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                {selected.type}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <h3 className="text-2xl font-semibold text-foreground">{selected.title}</h3>

              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div><CalendarIcon />{formatDate(selected.date)}</div>
                {selected.time ? (
                  <div>
                    <ClockIcon />{selected.time}
                    {selected.duration ? ` (${selected.duration})` : ""}
                  </div>
                ) : null}
                {selected.location ? <div><LaptopIcon />{selected.location}</div> : null}
              </div>

              {selected.description ? (
                <p className="mt-5 text-sm leading-6 text-muted-foreground">{selected.description}</p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-lg font-semibold text-foreground">
                  {selected.price && selected.price > 0
                    ? `$${selected.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "Free"}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => goToInternalEventPage(selected)}
                    className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    {isPastEvent(selected.date) ? "View event" : "Register for event"}
                  </button>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
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
