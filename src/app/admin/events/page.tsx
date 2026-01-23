"use client";

import { useState } from "react";
import Container from "@/components/Container";

const TYPES = ["Webinar", "Workshop", "Business Clinic"];

export default function AdminEventsPage() {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);

    try {
      const res = await fetch("/api/events/create", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!json?.ok) {
        setMsg(json?.error || "Failed.");
        return;
      }

      formEl.reset();
      setMsg("Event created successfully.");
    } catch {
      setMsg("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <div className="py-14">
        <h1 className="text-3xl font-semibold text-slate-900">Upload an Event</h1>
        <p className="mt-2 text-sm text-slate-600">
          Fill this form to create an event. Image uploads to Supabase Storage.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <label className="text-sm font-semibold">Event title</label>
            <input name="title" required className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>

          <div>
            <label className="text-sm font-semibold">Event type</label>
            <select name="type" required className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Date</label>
            <input type="date" name="date" required className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">Time (optional)</label>
              <input name="time" placeholder="2:00 PM WAT" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="text-sm font-semibold">Duration (optional)</label>
              <input name="duration" placeholder="90 minutes" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Location (optional)</label>
            <input name="location" placeholder="Online via Zoom" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>

          <div>
            <label className="text-sm font-semibold">Description (optional)</label>
            <textarea name="description" rows={4} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">Price (₦) (0 = Free)</label>
              <input name="price" defaultValue="0" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="text-sm font-semibold">Spots left (optional)</label>
              <input name="spots_left" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Registration link (optional)</label>
            <input name="registration_url" placeholder="https://..." className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>

          <div>
            <label className="text-sm font-semibold">Cover image (optional)</label>
            <input type="file" name="cover" accept="image/*" className="mt-2 w-full text-sm" />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-[var(--steel-teal)] px-6 py-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Uploading…" : "Create Event"}
          </button>

          {msg ? <p className="text-sm text-slate-700">{msg}</p> : null}
        </form>
      </div>
    </Container>
  );
}
