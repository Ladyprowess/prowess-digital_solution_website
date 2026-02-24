"use client";

import { useEffect, useMemo, useState } from "react";
import Container from "@/components/Container";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price_ngn: number;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function fmtPrice(n: number) {
  return `₦${Number(n || 0).toLocaleString("en-NG")}`;
}

function getNextBusinessDays(days = 14) {
  const out: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < days * 2 && out.length < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const day = d.getDay(); // 0 Sun, 6 Sat
    const isBusinessDay = day >= 1 && day <= 5; // Mon-Fri
    if (isBusinessDay) out.push(d);
  }
  return out;
}

// 10:00 to 17:00 every 30 mins
function buildSlots() {
  const slots: string[] = [];
  for (let h = 10; h <= 16; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  slots.push("17:00");
  return slots;
}

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function ConsultationPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<string>("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const days = useMemo(() => getNextBusinessDays(14), []);
  const slots = useMemo(() => buildSlots(), []);

  const [selectedDate, setSelectedDate] = useState<string>(days[0] ? toISODate(days[0]) : "");
  const [selectedTime, setSelectedTime] = useState<string>("");

  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) || null,
    [services, serviceId]
  );

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/consultations/services", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg(json?.error || "Failed to load services");
        return;
      }
      const list = (json?.items || []) as Service[];
      setServices(list);
      if (list[0]?.id) setServiceId(list[0].id);
    })();
  }, []);

  async function handleSubmit() {
    setMsg("");

    if (!serviceId) return setMsg("Please select a service.");
    if (!fullName.trim()) return setMsg("Full name is required.");
    if (!email.trim()) return setMsg("Email is required.");
    if (!selectedDate) return setMsg("Please select a date.");
    if (!selectedTime) return setMsg("Please select a time.");

    setLoading(true);

    try {
      const res = await fetch("/api/consultations/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          scheduled_date: selectedDate,
          scheduled_time: selectedTime,
          timezone: "Africa/Lagos",
          notes: notes.trim() || null,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setMsg(json?.error || "Booking failed");
        return;
      }

      // Free => confirm immediately
      if (json?.mode === "free") {
        // confirm (sends email + calendar invite)
        await fetch("/api/consultations/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking_id: json.booking_id }),
        });

        window.location.href = `/consultation/success?booking_id=${json.booking_id}`;
        return;
      }

      // Paid => redirect to paystack
      if (json?.authorization_url) {
        window.location.href = json.authorization_url;
        return;
      }

      setMsg("Something went wrong. No Paystack link returned.");
    } catch (e: any) {
      setMsg(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <Container>
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Book a Consultation</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Choose a time that works for you. Pay and confirm instantly.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <span className="font-semibold">Business Hours:</span> Mon–Fri, 10:00–17:00
              </div>
            </div>

            {/* Service */}
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-900">Consultation type</label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-300"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.price_ngn > 0 ? fmtPrice(s.price_ngn) : "Free"}
                    </option>
                  ))}
                </select>
                {selectedService ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Duration: <b>{selectedService.duration_minutes} mins</b>
                  </p>
                ) : null}
              </div>

              {/* Contact */}
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-900">Full name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-300"
                    placeholder="Your name"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-900">Email</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-300"
                      placeholder="you@email.com"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-900">Phone (optional)</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-300"
                      placeholder="080…"
                    />
                  </div>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-sm font-semibold text-slate-900">Pick a date</label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {days.map((d) => {
                    const iso = toISODate(d);
                    const label = d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });

                    const active = iso === selectedDate;

                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => {
                          setSelectedDate(iso);
                          setSelectedTime("");
                        }}
                        className={cn(
                          "rounded-2xl border px-3 py-3 text-sm font-semibold",
                          active
                            ? "border-[var(--steel-teal)] bg-[rgba(80,124,128,0.10)] text-slate-900"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  We only show business days (Mon–Fri).
                </p>
              </div>

              {/* Time */}
              <div>
                <label className="text-sm font-semibold text-slate-900">Pick a time</label>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((t) => {
                    const active = t === selectedTime;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTime(t)}
                        className={cn(
                          "rounded-2xl border px-3 py-3 text-sm font-semibold",
                          active
                            ? "border-[var(--steel-teal)] bg-[rgba(80,124,128,0.10)] text-slate-900"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  If a slot is taken, the system will tell you to pick another.
                </p>
              </div>

              {/* Notes */}
              <div className="lg:col-span-2">
                <label className="text-sm font-semibold text-slate-900">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-300"
                  rows={4}
                  placeholder="What do you want to discuss?"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className={cn("text-sm", msg ? "text-rose-700" : "text-slate-600")}>
                {msg || "Select a date/time and submit to confirm your booking."}
              </p>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-2xl bg-[var(--steel-teal)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {loading
                  ? "Processing…"
                  : selectedService?.price_ngn && selectedService.price_ngn > 0
                    ? `Pay ${fmtPrice(selectedService.price_ngn)} & Book`
                    : "Book Consultation"}
              </button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}