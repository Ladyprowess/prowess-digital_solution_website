"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase"; // ✅ use your existing client
import { AdminPagination } from "@/components/admin/AdminPagination";
import { formatMoney } from "@/lib/formatMoney";
import { slugify } from "@/lib/slugify";

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
  price_usd: number | null;
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
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");

  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [time, setTime] = useState(""); // HH:mm
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");

  const [registrationType, setRegistrationType] = useState<"free" | "paid">("free");
  const [priceUsd, setPriceUsd] = useState("");
  const [priceNgn, setPriceNgn] = useState("");
  const [joinLink, setJoinLink] = useState("");

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

  const EVENTS_PAGE_SIZE = 8;
  const [eventsPage, setEventsPage] = useState(1);
  const [eventStatusFilter, setEventStatusFilter] = useState<"all" | EventRow["status"]>("all");
  const [eventSearch, setEventSearch] = useState("");

  const stats = useMemo(() => {
    const total = events.length;
    const published = events.filter((e) => e.status === "published").length;
    const drafts = events.filter((e) => e.status === "draft").length;
    return { total, published, drafts };
  }, [events]);

  const slugPreview = slug || slugify(title) || "your-event-slug";

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (eventStatusFilter !== "all" && e.status !== eventStatusFilter) return false;
      if (eventSearch.trim() && !e.title.toLowerCase().includes(eventSearch.trim().toLowerCase())) return false;
      return true;
    });
  }, [events, eventStatusFilter, eventSearch]);

  const eventsTotalPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PAGE_SIZE));
  const visibleEvents = useMemo(() => {
    const from = (eventsPage - 1) * EVENTS_PAGE_SIZE;
    return filteredEvents.slice(from, from + EVENTS_PAGE_SIZE);
  }, [filteredEvents, eventsPage]);

  useEffect(() => { setEventsPage(1); }, [eventStatusFilter, eventSearch]);

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
        "id,title,slug,description,type,date,time,duration,location,status,registration_type,price_usd,price_ngn,price,spots_left,cover_url,registration_url,created_at"
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
  }, []);

  async function handleCreateEvent() {
    setMessage("");

    if (!title.trim()) return setMessage("Title is required.");
    if (!type.trim()) return setMessage("Type is required.");
    if (!date.trim()) return setMessage("Date is required.");

    if (registrationType === "paid") {
      const p = Number(priceUsd);
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
      form.append("price_usd", registrationType === "paid" ? String(Number(priceUsd)) : "");
      form.append("price_ngn", registrationType === "paid" ? priceNgn.trim() : "");
      form.append("join_link", joinLink.trim());

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

      setMessage("Event created");

      // reset
      setTitle("");
      setType("Webinar");
      setSlug("");
      setSlugEdited(false);
      setDescription("");
      setDate("");
      setTime("");
      setDuration("");
      setLocation("");
      setRegistrationType("free");
      setPriceUsd("");
      setPriceNgn("");
      setJoinLink("");
      setStatus("published");
      setCoverFile(null);

      setEventsPage(1);

      await loadEventsAndCounts();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div>
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin - Events</h1>
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
                onChange={(e) => {
                  const nextTitle = e.target.value;
                  setTitle(nextTitle);
                  if (!slugEdited) setSlug(slugify(nextTitle));
                }}
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
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(slugify(e.target.value));
                }}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                placeholder="Leave empty for auto"
              />
              <p className="mt-2 text-xs text-slate-500">Public page: /events/{slugPreview}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "published" | "draft")}
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
                onChange={(e) => setRegistrationType(e.target.value as "free" | "paid")}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Price ($)</label>
              <input
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                disabled={registrationType !== "paid"}
                className={cn(
                  "mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm",
                  registrationType !== "paid" ? "border-slate-200 text-slate-400" : "border-slate-200"
                )}
                placeholder="e.g. 5000"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Price (NGN, optional)</label>
              <input
                value={priceNgn}
                onChange={(e) => setPriceNgn(e.target.value)}
                disabled={registrationType !== "paid"}
                className={cn(
                  "mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm",
                  registrationType !== "paid" ? "border-slate-200 text-slate-400" : "border-slate-200"
                )}
                placeholder="e.g. 7500000"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="text-sm font-semibold text-slate-900">Join link (optional)</label>
              <input
                value={joinLink}
                onChange={(e) => setJoinLink(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                placeholder="e.g. WhatsApp group, Zoom, or community invite link"
              />
              <p className="mt-1 text-xs text-slate-500">
                Sent to each registrant in their confirmation email as a &quot;Join the event&quot; button.
              </p>
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
            <p className={cn("text-sm", message === "Event created" ? "text-emerald-700" : "text-rose-700")}>
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">All Events</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Search title..."
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              />
              <select
                value={eventStatusFilter}
                onChange={(e) => setEventStatusFilter(e.target.value as typeof eventStatusFilter)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-600">Use links to open event page or view registrants.</p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {visibleEvents.map((ev) => {
              const count = counts[ev.id] || 0;

              return (
                <div key={ev.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{ev.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Slug: <b>{ev.slug || slugify(ev.title)}</b>
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
                    <div className="flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="shrink-0 text-slate-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      {ev.date} {ev.time ? `• ${ev.time}` : ""}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="shrink-0 text-slate-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                      </svg>
                      {ev.type}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="shrink-0 text-slate-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-9-9.5v10.5a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25h-15a2.25 2.25 0 00-2.25 2.25z" />
                      </svg>
                      {ev.registration_type === "paid"
                        ? `Paid (${[
                            ev.price_usd ? formatMoney(ev.price_usd, "USD") : null,
                            ev.price_ngn ? formatMoney(ev.price_ngn, "NGN") : null,
                          ].filter(Boolean).join(" / ")})`
                        : "Free"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="shrink-0 text-slate-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                      Registrations: <span className="font-semibold">{count}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
                    <div className="flex items-center gap-4">
                      <a
                        href={`/admin/events/${ev.id}/registrations`}
                        className="text-sm font-semibold text-[var(--steel-teal)] hover:underline"
                      >
                        View registrants →
                      </a>
                      <a
                        href={`/admin/events/${ev.id}/archive`}
                        className="text-sm font-semibold text-[var(--steel-teal)] hover:underline"
                      >
                        Manage archive →
                      </a>
                    </div>

                    {ev.slug ? (
                      <a
                        href={`/events/${ev.slug || slugify(ev.title)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-slate-700 hover:underline"
                      >
                        Open event page
                      </a>
                    ) : (
                      <span className="text-sm font-semibold text-slate-500">Slug will use the event title</span>
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
          ) : filteredEvents.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              No events match this filter.
            </div>
          ) : null}

          <AdminPagination page={eventsPage} totalPages={eventsTotalPages} onPageChange={setEventsPage} />
        </div>
      </div>
    </div>
  );
}
