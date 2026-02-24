"use client";

import { useState } from "react";
import Container from "@/components/Container";

function addMinutes(dateISO: string, minutes: number) {
  const d = new Date(dateISO);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

export default function ConsultationsPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [time, setTime] = useState(""); // HH:mm

  const [durationMins, setDurationMins] = useState(30);
  const [amountNgn, setAmountNgn] = useState(5000);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function book() {
    setMsg(null);

    if (!fullName.trim() || !email.trim() || !date || !time) {
      setMsg("Please fill your name, email, date and time.");
      return;
    }

    setLoading(true);

    try {
      // Build start ISO from date + time (local browser time)
      const startLocal = new Date(`${date}T${time}:00`);
      const startISO = startLocal.toISOString();
      const endISO = addMinutes(startISO, durationMins);

      const res = await fetch("/api/consultations/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone: phone || null,
          notes: notes || null,
          start_at: startISO,
          end_at: endISO,
          amount_ngn: amountNgn,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setMsg(json?.error || "Booking failed.");
        return;
      }

      // Redirect to Paystack payment page
      window.location.href = json.authorization_url;
    } catch {
      setMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h1 className="text-3xl font-semibold text-slate-900">Book a Consultation</h1>
            <p className="mt-2 text-sm text-slate-600">
              Choose a date and time. Pay to confirm. You’ll get an email after payment.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-900">Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-900">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="you@email.com"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-900">Phone (optional)</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="080..."
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-900">Duration</label>
                <select
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-900">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-900">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-slate-900">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  rows={4}
                  placeholder="Tell us what you need help with..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-slate-900">Consultation fee (₦)</label>
                <input
                  value={amountNgn}
                  onChange={(e) => setAmountNgn(Number(e.target.value || 0))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="5000"
                />
              </div>
            </div>

            {msg ? <p className="mt-4 text-sm text-rose-700">{msg}</p> : null}

            <button
              onClick={book}
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-[var(--steel-teal)] px-6 py-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Processing..." : "Proceed to Payment"}
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}