"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";

type EventRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:mm
  registration_type: "free" | "paid";
  price_usd: number | null;
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

      setLoading(false);

      if (!res.ok) {
        setPageError(data?.error || "Could not load this event.");
        return;
      }

      setEvent(data.event);
      // Date.now() belongs in an effect, not render - it's an impure call
      // that would otherwise run on every render for no reason.
      const eventStart = new Date(`${data.event.date}T${data.event.time || "00:00"}`);
      const past = eventStart.getTime() < Date.now();
      setIsPast(past);

      // Archive only ever matters once an event has happened, so it's not
      // worth fetching for events still upcoming.
      if (past) {
        const archiveRes = await fetch(`/api/events/archive?event_id=${encodeURIComponent(data.event.id)}`, {
          cache: "no-store",
        });
        const archiveData = await archiveRes.json().catch(() => null);
        setArchive(archiveRes.ok ? archiveData?.items || [] : []);
      }
    }

    loadEvent();
  }, [slug]);

  async function handleRegister() {
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
      }),
    });

    const data = await res.json().catch(() => null);
    setSubmitting(false);

    if (!res.ok) {
      setMsg(data?.error || "Registration failed.");
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

    setMsg("Something went wrong.");
  }

  if (loading) {
    return (
      <Container>
        <div className="py-14 text-sm text-muted-foreground">Loading event…</div>
      </Container>
    );
  }

  if (pageError) {
    return (
      <Container>
        <div className="py-14 text-sm text-red-600">{pageError}</div>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container>
        <div className="py-14 text-sm text-muted-foreground">Event not found.</div>
      </Container>
    );
  }

  const isPaid = event.registration_type === "paid";
  const priceText = isPaid
    ? `$${Number(event.price_usd || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "Free";

  // date/time (not start_datetime, which the admin form never actually
  // writes) is the real source of the event's date - see get-by-slug.
  // isPast itself is computed in the effect above (Date.now() doesn't
  // belong in render), this is just for display.
  const startDate = new Date(`${event.date}T${event.time || "00:00"}`);

  return (
    <div className="pb-16">
      <section className="py-14">
        <Container>
          <div className="mx-auto max-w-2xl">
            <Reveal>
              <h1 className="text-3xl font-semibold text-foreground">{event.title}</h1>

              {event.description ? (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{event.description}</p>
              ) : null}

              <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                <div>
                  <b className="text-foreground">Date:</b> {startDate.toLocaleString("en-GB")}
                </div>
                <div>
                  <b className="text-foreground">Type:</b> {isPaid ? "Paid" : "Free"} • <b className="text-foreground">Price:</b> {priceText}
                </div>
                {event.registration_count ? (
                  <div>
                    <b className="text-foreground">{event.registration_count.toLocaleString()}</b>{" "}
                    {event.registration_count === 1 ? "person has" : "people have"} registered for this event.
                  </div>
                ) : null}
              </div>
            </Reveal>

            {isPast ? (
              <Reveal delay={100}>
                <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
                  <h2 className="text-lg font-semibold text-foreground">This event has ended</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Registration is closed.</p>
                </div>

                {archive.length > 0 ? (
                  <div className="mt-8">
                    <h2 className="text-lg font-semibold text-foreground">Event archive</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {archive.map((item) => (
                        <div key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                          {item.media_type === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.url} alt={item.caption || ""} className="h-48 w-full object-cover" />
                          ) : youtubeEmbedUrl(item.url) ? (
                            <iframe
                              src={youtubeEmbedUrl(item.url)!}
                              className="h-48 w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex h-48 w-full items-center justify-center bg-muted text-sm font-semibold text-foreground"
                            >
                              Watch the recording
                            </a>
                          )}
                          {item.caption ? (
                            <p className="px-4 py-3 text-sm text-muted-foreground">{item.caption}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Reveal>
            ) : (
              <Reveal delay={100}>
                <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-foreground">Register</h2>

                  <div className="mt-4">
                    <label className="text-sm font-semibold text-foreground">Full name</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-semibold text-foreground">Email</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-semibold text-foreground">Phone (optional)</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={submitting}
                    className="mt-6 w-full rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? "Please wait…" : isPaid ? "Pay & Register" : "Register"}
                  </button>

                  {msg ? <p className="mt-4 text-sm text-muted-foreground">{msg}</p> : null}
                </div>
              </Reveal>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
}