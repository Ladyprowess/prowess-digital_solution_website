import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type EventRow = {
  id: string;
  date: string;
  time: string | null;
  status: string;
};

function cleanText(value: unknown, maxLength: number) {
  const text = String(value || "").trim();
  if (!text || text.length > maxLength) return null;
  return text;
}

function isEventPast(event: EventRow) {
  const start = new Date(`${event.date}T${event.time || "00:00"}`);
  return Number.isFinite(start.getTime()) && start.getTime() < Date.now();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("event_id");

  if (!eventId) {
    return NextResponse.json({ ok: false, error: "Missing event_id" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("event_feedback")
    .select("id, attendee_name, rating, body, created_at")
    .eq("event_id", eventId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, items: data || [] });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));
    const eventId = cleanText(payload?.event_id, 80);
    const attendeeName = cleanText(payload?.attendee_name, 120);
    const attendeeEmail = cleanText(payload?.attendee_email, 254)?.toLowerCase();
    const body = cleanText(payload?.body, 4000);
    const rating = Number(payload?.rating);

    if (!eventId) {
      return NextResponse.json({ ok: false, error: "Event is required." }, { status: 400 });
    }
    if (!attendeeName) {
      return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
    }
    if (!attendeeEmail || !attendeeEmail.includes("@")) {
      return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: "Choose a rating from 1 to 5." }, { status: 400 });
    }
    if (!body) {
      return NextResponse.json({ ok: false, error: "Feedback must be between 1 and 4000 characters." }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id,date,time,status")
      .eq("id", eventId)
      .eq("status", "published")
      .maybeSingle();

    if (eventError) {
      return NextResponse.json({ ok: false, error: eventError.message }, { status: 500 });
    }
    if (!event) {
      return NextResponse.json({ ok: false, error: "Event not found." }, { status: 404 });
    }
    if (!isEventPast(event as EventRow)) {
      return NextResponse.json({ ok: false, error: "Feedback opens after the event ends." }, { status: 403 });
    }

    const { data: registration, error: registrationError } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .ilike("email", attendeeEmail)
      .limit(1)
      .maybeSingle();

    if (registrationError) {
      return NextResponse.json({ ok: false, error: registrationError.message }, { status: 500 });
    }
    if (!registration) {
      return NextResponse.json(
        { ok: false, error: "Only registered attendees can leave feedback for this event." },
        { status: 403 }
      );
    }

    const { error } = await supabase.from("event_feedback").insert({
      event_id: eventId,
      attendee_name: attendeeName,
      attendee_email: attendeeEmail,
      rating,
      body,
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ ok: false, error: "You have already submitted feedback for this event." }, { status: 409 });
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Feedback could not be submitted." },
      { status: 500 }
    );
  }
}
