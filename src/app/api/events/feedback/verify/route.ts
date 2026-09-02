import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type EventRow = {
  id: string;
  date: string;
  time: string | null;
};

function isEventPast(event: EventRow) {
  const start = new Date(`${event.date}T${event.time || "00:00"}`);
  return Number.isFinite(start.getTime()) && start.getTime() < Date.now();
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));
    const eventId = String(payload?.event_id || "").trim();
    const email = String(payload?.email || "").trim().toLowerCase();

    if (!eventId) {
      return NextResponse.json({ ok: false, error: "Event is required." }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Enter the email used for registration." }, { status: 400 });
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
      .select("full_name,email")
      .eq("event_id", eventId)
      .ilike("email", email)
      .limit(1)
      .maybeSingle();

    if (registrationError) {
      return NextResponse.json({ ok: false, error: registrationError.message }, { status: 500 });
    }
    if (!registration) {
      return NextResponse.json(
        { ok: false, error: "We could not find this email in the registration list for this event." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      attendee: {
        name: registration.full_name || "",
        email: registration.email || email,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Registration could not be checked." },
      { status: 500 }
    );
  }
}
