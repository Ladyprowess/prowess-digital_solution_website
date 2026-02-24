"use client";

import { useEffect, useMemo, useState } from "react";
import Container from "@/components/Container";
import { supabase } from "@/lib/supabase"; // ✅ use your existing client

type EventRow = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;

  type: string;

  date: string; // YYYY-MM-DD
  time: string | null;
  duration: string | null;
  location: string | null;

  status: "published" | "draft";
  registration_type: "free" | "paid";
  price_ngn: number | null;

  price: number | null;
  spots_left: number | null;

  cover_url: string | null;
  registration_url: string | null;

  created_at: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminEventsPage() {
  // form fields
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Webinar");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [time, setTime] = useState(""); // HH:mm
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");

  const [registrationType, setRegistrationType] = useState<"free" | "paid">("free");
  const [priceNgn, setPriceNgn] = useState("");

  const [status, setStatus] = useState<"published" | "draft">("published");

  // cover image
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // ui
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // events list
  const [events, setEvents] = useState<EventRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  // ✅ view-all toggle
  const [viewAll, setViewAll] = useState(false);

  const stats = useMemo(() => {
    const total = events.length;
    const published = events.filter((e) => e.status === "published").length;
    const drafts = events.filter((e) => e.status === "draft").length;
    return { total, published, drafts };
  }, [events]);

  // ✅ show only 2 until "View all"
  const visibleEvents = useMemo(() => {
    return viewAll ? events : events.slice(0, 2);
  }, [events, viewAll]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  async function loadEventsAndCounts() {
    setMessage("");

    // ✅ Load ALL events (drafts + published)
    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select(
        "id,title,slug,description,type,date,time,duration,location,status,registration_type,price_ngn,price,spots_left,cover_url,registration_url,created_at"
      )
      .order("created_at", { ascending: false });

    if (eventsError) {
      setMessage(eventsError.message || "Failed to load events");
      setEvents([]);
      return;
    }

    setEvents((eventsData || []) as EventRow[]);

    // load counts (optional endpoint)
    const regRes = await fetch("/api/events/registrations/counts", { cache: "no-store" }).catch(() => null);
    const regJson = regRes ? await regRes.json().catch(() => null) : null;

    if (regRes?.ok && regJson?.counts) setCounts(regJson.counts);
  }

  useEffect(() => {
    loadEventsAndCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateEvent() {
    setMessage("");

    if (!title.trim()) return setMessage("Title is required.");
    if (!type.trim()) return setMessage("Type is required.");
    if (!date.trim()) return setMessage("Date is required.");

    if (registrationType === "paid") {
      const p = Number(priceNgn);
      if (!p || p < 1) return setMessage("Enter a valid price for paid events.");
    }

    setLoading(true);

    try {
      // ✅ FormData so API can upload file into bucket
      const form = new FormData();
      form.append("title", title.trim());
      form.append("type", type.trim());
      form.append("description", description.trim());

      form.append("date", date.trim());
      form.append("time", time.trim());
      form.append("duration", duration.trim());
      form.append("location", location.trim());

      form.append("status", status);
      form.append("registration_type", registrationType);
      form.append("price_ngn", registrationType === "paid" ? String(Number(priceNgn)) : "");

      // optional slug
      if (slug.trim()) form.append("slug", slug.trim());

      // cover image
      if (coverFile) form.append("cover", coverFile);

      // IMPORTANT: this must match your upload route path
      const res = await fetch("/api/events/create", {
        method: "POST",
        body: form,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setMessage(json?.error || "Failed to create event");
        return;
      }

      setMessage("Event created ✅");

      // reset
      setTitle("");
      setType("Webinar");
      setSlug("");
      setDescription("");
      setDate("");
      setTime("");
      setDuration("");
      setLocation("");
      setRegistrationType("free");
      setPriceNgn("");
      setStatus("published");
      setCoverFile(null);

      // ✅ after creating, keep it on “2 only” view (optional)
      setViewAll(false);

      await loadEventsAndCounts();
    } catch (err: any) {
      setMessage(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  const canViewAll = events.length > 2;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <Container>
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin — Events</h1>
            <p className="mt-1 text-sm text-slate-600">Create events, upload cover images, and view registrants.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-medium text-slate-500">Total</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{stats.total}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-medium text-slate-500">Published</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{stats.published}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-medium text-slate-500">Drafts</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{stats.drafts}</div>
            </div>
          </div>
        </div>

        {/* Create Event Card */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create Event</h2>
              <p className="mt-1 text-sm text-slate-600">
                Slug is optional. Cover uploads to Storage bucket: <b>events</b>
              </p>
            </div>

            <button
              type="button"
              onClick={loadEventsAndCounts}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                placeholder="Event title"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <option>Webinar</option>
                <option>Workshop</option>
                <option>Business Clinic</option>
                <option>Event</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">
                Slug <span className="text-slate-500">(optional)</span>
              </label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                placeholder="Leave empty for auto"
              />
              <p className="mt-2 text-xs text-slate-500">Used for /events/{`{slug}`}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Time (optional)</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Duration (optional)</label>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                placeholder="e.g. 1 hour"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Location (optional)</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                placeholder="e.g. Zoom"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Registration type</label>
              <select
                value={registrationType}
                onChange={(e) => setRegistrationType(e.target.value as any)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Price (₦)</label>
              <input
                value={priceNgn}
                onChange={(e) => setPriceNgn(e.target.value)}
                disabled={registrationType !== "paid"}
                className={cn(
                  "mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm",
                  registrationType !== "paid" ? "border-slate-200 text-slate-400" : "border-slate-200"
                )}
                placeholder="e.g. 5000"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="text-sm font-semibold text-slate-900">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                rows={4}
                placeholder="Short description"
              />
            </div>

            {/* Cover upload */}
            <div className="lg:col-span-2">
              <label className="text-sm font-semibold text-slate-900">Cover image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              />

              {coverPreview ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPreview} alt="Cover preview" className="h-56 w-full object-cover" />
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={cn("text-sm", message.includes("✅") ? "text-emerald-700" : "text-rose-700")}>
              {message || "Fill the form and click Create Event."}
            </p>

            <button
              onClick={handleCreateEvent}
              disabled={loading}
              className="rounded-2xl bg-[var(--steel-teal)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Creating…" : "Create Event"}
            </button>
          </div>
        </div>

        {/* All Events */}
        <div className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">All Events</h2>

              {/* ✅ View all / Show less */}
              {canViewAll ? (
                <button
                  type="button"
                  onClick={() => setViewAll((v) => !v)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  {viewAll ? "Show less" : `View all (${events.length})`}
                </button>
              ) : null}
            </div>

            <p className="text-sm text-slate-600">Use links to open event page or view registrants.</p>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {visibleEvents.map((ev) => {
              const count = counts[ev.id] || 0;

              return (
                <div key={ev.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{ev.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Slug: <b>{ev.slug || "(auto not set yet)"}</b>
                      </p>
                    </div>

                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        ev.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {ev.status}
                    </span>
                  </div>

                  {ev.cover_url ? (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ev.cover_url} alt="" className="h-44 w-full object-cover" />
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      No cover uploaded for this event.
                    </div>
                  )}

                  <div className="mt-4 grid gap-2 text-sm text-slate-700">
                    <div>
                      📅 {ev.date} {ev.time ? `• ${ev.time}` : ""}
                    </div>
                    <div>🏷️ {ev.type}</div>
                    <div>
                      💳{" "}
                      {ev.registration_type === "paid"
                        ? `Paid (₦${Number(ev.price_ngn || 0).toLocaleString()})`
                        : "Free"}
                    </div>
                    <div>
                      👥 Registrations: <span className="font-semibold">{count}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
                    <a
                      href={`/admin/events/${ev.id}/registrations`}
                      className="text-sm font-semibold text-[var(--steel-teal)] hover:underline"
                    >
                      View registrants →
                    </a>

                    {ev.slug ? (
                      <a
                        href={`/events/${ev.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-slate-700 hover:underline"
                      >
                        Open event page
                      </a>
                    ) : (
                      <span className="text-sm font-semibold text-slate-400">No slug yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {events.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              No events yet. Create your first event above.
            </div>
          ) : null}
        </div>
      </Container>
    </div>
  );
}