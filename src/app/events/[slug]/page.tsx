"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Archive, CalendarDays, CheckCircle2, Clock, ImageIcon, Loader2, Mail, MapPin, Phone, User, Video } from "lucide-react";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { formatMoney } from "@/lib/formatMoney";
import { CurrencyToggle } from "@/components/CurrencyToggle";

type EventRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: string | null;
  date: string;
  time: string | null;
  duration: string | null;
  location: string | null;
  cover_url: string | null;
  registration_type: "free" | "paid";
  price_usd: number | null;
  price_ngn: number | null;
  registration_count: number | null;
};

type MediaRow = {
  id: string;
  media_type: "image" | "video";
  url: string;
  caption: string | null;
};

function youtubeEmbedUrl(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function formatDateTime(event: EventRow) {
  const date = new Date(`${event.date}T${event.time || "00:00"}`);
  return date.toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: event.time ? "numeric" : undefined,
    minute: event.time ? "2-digit" : undefined,
  });
}

function PageState({
  title,
  description,
  loading,
}: {
  title: string;
  description: string;
  loading?: boolean;
}) {
  return (
    <Container>
      <div className="py-16">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-primary">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Archive className="h-5 w-5" aria-hidden />}
          </div>
          <h1 className="mt-4 text-xl font-semibold text-foreground">{title}</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
          {!loading ? (
            <Link
              href="/events"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Back to events
            </Link>
          ) : null}
        </div>
      </div>
    </Container>
  );
}

export default function EventRegistrationPage() {
  const params = useParams();
  const slug = String(params.slug);

  const [event, setEvent] = useState<EventRow | null>(null);
  const [isPast, setIsPast] = useState(false);
  const [archive, setArchive] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState<"USD" | "NGN">("USD");

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function loadEvent() {
      setLoading(true);
      setPageError("");

      const res = await fetch(`/api/events/get-by-slug?slug=${encodeURIComponent(slug)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setEvent(null);
        setPageError(data?.error || "Could not load this event.");
        setLoading(false);
        return;
      }

      const loadedEvent = data.event as EventRow;
      setEvent(loadedEvent);
      setCurrency(loadedEvent.price_usd ? "USD" : "NGN");

      const eventStart = new Date(`${loadedEvent.date}T${loadedEvent.time || "00:00"}`);
      const past = eventStart.getTime() < Date.now();
      setIsPast(past);

      if (past) {
        const archiveRes = await fetch(`/api/events/archive?event_id=${encodeURIComponent(loadedEvent.id)}`, {
          cache: "no-store",
        });
        const archiveData = await archiveRes.json().catch(() => null);
        setArchive(archiveRes.ok ? archiveData?.items || [] : []);
      } else {
        setArchive([]);
      }

      setLoading(false);
    }

    loadEvent();
  }, [slug]);

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");

    if (!fullName.trim() || !email.trim()) {
      setMsg("Please enter your full name and email.");
      return;
    }

    if (!event?.id) {
      setMsg("Event not found. Please refresh.");
      return;
    }

    setSubmitting(true);

    const res = await fetch("/api/events/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: event.id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        currency,
      }),
    });

    const data = await res.json().catch(() => null);
    setSubmitting(false);

    if (!res.ok) {
      setMsg(data?.error || "Registration failed. Please try again.");
      return;
    }

    if (data.mode === "free") {
      setFullName("");
      setEmail("");
      setPhone("");
      setMsg("You are registered successfully.");
      return;
    }

    if (data.mode === "paid" && data.authorization_url) {
      window.location.href = data.authorization_url;
      return;
    }

    setMsg("Something went wrong. Please try again.");
  }

  if (loading) {
    return <PageState loading title="Loading event" description="Getting the event details and registration options ready." />;
  }

  if (pageError) {
    return <PageState title="Event could not load" description={pageError} />;
  }

  if (!event) {
    return <PageState title="Event not found" description="This event may have been moved, archived or unpublished." />;
  }

  const isPaid = event.registration_type === "paid";
  const bothCurrenciesAvailable = Boolean(event.price_usd && event.price_ngn);
  const priceAmount = currency === "USD" ? event.price_usd : event.price_ngn;
  const priceText = isPaid && priceAmount ? formatMoney(priceAmount, currency) : "Free";

  return (
    <div className="pb-16">
      <section className="py-12 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
            <Reveal>
              <div>
                <Link
                  href="/events"
                  className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Back to events
                </Link>

                <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
                  <div className="relative aspect-[16/8] bg-muted">
                    {event.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={event.cover_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                        <CalendarDays className="h-10 w-10" aria-hidden />
                        <span className="text-sm">Event cover coming soon</span>
                      </div>
                    )}
                    <div className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      {isPast ? "Archive" : event.type || "Event"}
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      {event.type || "Event"}
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">{event.title}</h1>
                    {event.description ? (
                      <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{event.description}</p>
                    ) : null}

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-border bg-background p-4">
                        <CalendarDays className="h-5 w-5 text-primary" aria-hidden />
                        <p className="mt-3 text-sm font-semibold text-foreground">{formatDateTime(event)}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-background p-4">
                        <Clock className="h-5 w-5 text-primary" aria-hidden />
                        <p className="mt-3 text-sm font-semibold text-foreground">{event.duration || "Duration will be shared"}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-background p-4 sm:col-span-2">
                        <MapPin className="h-5 w-5 text-primary" aria-hidden />
                        <p className="mt-3 text-sm font-semibold text-foreground">{event.location || "Location will be shared with registered attendees"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <aside className="rounded-lg border border-border bg-card p-6">
                {isPast ? (
                  <div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-primary">
                      <Archive className="h-5 w-5" aria-hidden />
                    </div>
                    <h2 className="mt-4 text-xl font-semibold text-foreground">This event has ended</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Registration is closed. Archive items will appear below when photos or recordings are added.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleRegister}>
                    <h2 className="text-xl font-semibold text-foreground">Register for this event</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Secure your spot and receive the event details by email.
                    </p>

                    <div className="mt-5 rounded-lg border border-border bg-background p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Access</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">{priceText}</p>
                      {event.registration_count ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {event.registration_count.toLocaleString()} registered
                        </p>
                      ) : null}
                    </div>

                    {isPaid && bothCurrenciesAvailable ? (
                      <div className="mt-4">
                        <CurrencyToggle value={currency} onChange={setCurrency} />
                      </div>
                    ) : null}

                    <div className="mt-5 space-y-4">
                      <div>
                        <label htmlFor="event-full-name" className="text-sm font-semibold text-foreground">Full name</label>
                        <div className="relative mt-2">
                          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                          <input
                            id="event-full-name"
                            type="text"
                            autoComplete="name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="min-h-10 w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="event-email" className="text-sm font-semibold text-foreground">Email</label>
                        <div className="relative mt-2">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                          <input
                            id="event-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="min-h-10 w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="event-phone" className="text-sm font-semibold text-foreground">Phone optional</label>
                        <div className="relative mt-2">
                          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                          <input
                            id="event-phone"
                            type="tel"
                            autoComplete="tel"
                            inputMode="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="min-h-10 w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-6 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
                      {submitting ? "Please wait..." : isPaid ? "Pay and register" : "Register"}
                    </button>

                    {msg ? <p className="mt-4 text-sm text-muted-foreground">{msg}</p> : null}
                  </form>
                )}
              </aside>
            </Reveal>
          </div>
        </Container>
      </section>

      {isPast ? (
        <section className="py-8">
          <Container>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Archive</p>
              <h2 className="text-2xl font-semibold text-foreground">Photos and recordings</h2>
            </div>

            {archive.length > 0 ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {archive.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-lg border border-border bg-card">
                    {item.media_type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt={item.caption || "Event archive image"} className="max-h-96 w-full bg-muted object-contain" />
                    ) : youtubeEmbedUrl(item.url) ? (
                      <iframe
                        title={item.caption || "Event recording"}
                        src={youtubeEmbedUrl(item.url)!}
                        className="h-56 w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-56 w-full flex-col items-center justify-center gap-3 bg-muted text-sm font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <Video className="h-8 w-8 text-primary" aria-hidden />
                        Watch the recording
                      </a>
                    )}
                    {item.caption ? <p className="px-4 py-3 text-sm text-muted-foreground">{item.caption}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-dashed border-border bg-card p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-primary">
                  <ImageIcon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Archive coming soon</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Photos and recordings will appear here when the team adds them.
                </p>
              </div>
            )}
          </Container>
        </section>
      ) : null}
    </div>
  );
}
