"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Loader2, MessageSquare, Star, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type FeedbackRow = {
  id: string;
  event_id: string;
  attendee_name: string;
  attendee_email: string;
  rating: number;
  body: string;
  status: "pending" | "approved" | "hidden";
  created_at: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminEventFeedbackPage() {
  const params = useParams();
  const eventId = String(params.id);

  const [eventTitle, setEventTitle] = useState("");
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [filter, setFilter] = useState<"all" | FeedbackRow["status"]>("pending");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.status === filter);
  }, [filter, items]);

  const stats = useMemo(() => ({
    pending: items.filter((item) => item.status === "pending").length,
    approved: items.filter((item) => item.status === "approved").length,
    hidden: items.filter((item) => item.status === "hidden").length,
  }), [items]);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const [{ data: event }, { data, error }] = await Promise.all([
      supabase.from("events").select("title").eq("id", eventId).maybeSingle(),
      supabase
        .from("event_feedback")
        .select("id,event_id,attendee_name,attendee_email,rating,body,status,created_at")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false }),
    ]);

    setEventTitle(event?.title || "");
    if (error) {
      setMessage(error.message);
      setItems([]);
    } else {
      setItems((data || []) as FeedbackRow[]);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  async function updateStatus(id: string, status: FeedbackRow["status"]) {
    setBusy(id);
    setMessage("");
    const { error } = await supabase.from("event_feedback").update({ status }).eq("id", id);
    setBusy(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    setItems((prev) => prev.map((item) => item.id === id ? { ...item, status } : item));
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Events</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">Event feedback</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review feedback for {eventTitle || "this event"}. Approved feedback appears on the public event page.
            </p>
          </div>
          <a
            href="/admin/events"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Back to events
          </a>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["Pending", stats.pending],
            ["Approved", stats.approved],
            ["Hidden", stats.hidden],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {(["pending", "approved", "hidden", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "inline-flex min-h-10 items-center rounded-lg border px-4 py-2 text-sm font-semibold capitalize focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                filter === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              )}
            >
              {value}
            </button>
          ))}
        </div>

        {message ? (
          <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm font-semibold text-destructive">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-border bg-card p-5" aria-hidden>
                <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
                <div className="mt-4 h-4 w-full animate-pulse rounded bg-muted" />
                <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-primary">
              <MessageSquare className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">No feedback here yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Feedback submitted after the event will appear here for approval.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredItems.map((item) => (
              <article key={item.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">{item.attendee_name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{item.attendee_email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString("en-GB")}
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize text-muted-foreground">
                    {item.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-1 text-primary" aria-label={`${item.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className={`h-4 w-4 ${index < item.rating ? "fill-current" : ""}`} aria-hidden />
                  ))}
                </div>

                <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.body}</p>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => updateStatus(item.id, "approved")}
                    disabled={busy === item.id || item.status === "approved"}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
                  >
                    {busy === item.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(item.id, "hidden")}
                    disabled={busy === item.id || item.status === "hidden"}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" aria-hidden />
                    Hide
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
