"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Container from "@/components/Container";

type EventRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  start_datetime: string;
  registration_type: "free" | "paid";
  price_ngn: number | null;
};

export default function EventRegistrationPage() {
  const params = useParams();
  const slug = String(params.slug);

  const [event, setEvent] = useState<EventRow | null>(null);
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
      setMsg("You are registered successfully ✅");
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
        <div className="py-14 text-sm text-slate-600">Loading event…</div>
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
        <div className="py-14 text-sm text-slate-600">Event not found.</div>
      </Container>
    );
  }

  const isPaid = event.registration_type === "paid";
  const priceText = isPaid ? `₦${Number(event.price_ngn || 0).toLocaleString()}` : "Free";

  return (
    <div className="pb-16">
      <section className="py-14">
        <Container>
          <div className="mx-auto max-w-2xl">
            <h1 className="text-3xl font-semibold text-slate-900">{event.title}</h1>

            {event.description ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">{event.description}</p>
            ) : null}

            <div className="mt-5 space-y-2 text-sm text-slate-700">
              <div>
                <b>Date:</b> {new Date(event.start_datetime).toLocaleString("en-GB")}
              </div>
              <div>
                <b>Type:</b> {isPaid ? "Paid" : "Free"} • <b>Price:</b> {priceText}
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">Register</h2>

              <div className="mt-4">
                <label className="text-sm font-semibold text-slate-900">Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-semibold text-slate-900">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-semibold text-slate-900">Phone (optional)</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />
              </div>

              <button
                type="button"
                onClick={handleRegister}
                disabled={submitting}
                className="mt-6 w-full rounded-2xl bg-[var(--steel-teal)] px-6 py-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Please wait…" : isPaid ? "Pay & Register" : "Register"}
              </button>

              {msg ? <p className="mt-4 text-sm text-slate-700">{msg}</p> : null}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}