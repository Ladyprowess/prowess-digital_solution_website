import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createGoogleEvent } from "@/lib/googleCalendar";
import { sendConsultationEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json({ ok: false, error: "Missing reference." }, { status: 400 });
    }

    // 1) Verify Paystack
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}` } }
    );

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData?.status) {
      return NextResponse.json({ ok: false, error: "Payment verification failed." }, { status: 400 });
    }

    const payment = verifyData.data;
    if (payment.status !== "success") {
      return NextResponse.json({ ok: false, error: "Payment not successful." }, { status: 400 });
    }

    const meta = payment.metadata || {};
    const booking_id = meta.booking_id;

    if (!booking_id) {
      return NextResponse.json({ ok: false, error: "Missing booking_id in metadata." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // 2) Load booking
    const { data: booking, error: bErr } = await supabase
      .from("consultation_bookings")
      .select("id,full_name,email,phone,start_at,end_at,timezone,payment_status,google_event_id,service_id")
      .eq("id", booking_id)
      .single();

    if (bErr || !booking) {
      return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
    }

    // If already confirmed, just return ok (avoid duplicates)
    if (booking.payment_status === "paid" && booking.google_event_id) {
      return NextResponse.json({ ok: true, already_confirmed: true });
    }

    // 3) Mark paid
    const { error: upErr } = await supabase
      .from("consultation_bookings")
      .update({ payment_status: "paid" })
      .eq("id", booking_id);

    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 400 });
    }

    // 4) Create Google Calendar event (writes to calendar)
    const gEventId = await createGoogleEvent({
      summary: "Consultation Booking",
      description: `Booked by: ${booking.full_name}\nEmail: ${booking.email}\nPhone: ${booking.phone || "-"}`,
      startISO: booking.start_at,
      endISO: booking.end_at,
      timezone: booking.timezone || process.env.CONSULTATION_TIMEZONE || "Africa/Lagos",
    });

    // save event id
    await supabase
      .from("consultation_bookings")
      .update({ google_event_id: gEventId })
      .eq("id", booking_id);

    // 5) Send email
    await sendConsultationEmail({
      to: booking.email,
      name: booking.full_name,
      startISO: booking.start_at,
      endISO: booking.end_at,
      timezone: booking.timezone || "Africa/Lagos",
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}