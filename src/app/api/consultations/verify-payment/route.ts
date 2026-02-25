import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createGoogleEvent } from "@/lib/googleCalendar";
import { sendConsultationEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json(
        { ok: false, error: "Missing reference." },
        { status: 400 }
      );
    }

    // 1) Verify Paystack
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
        },
      }
    );

    const verifyData = await verifyRes.json().catch(() => null);

    if (!verifyRes.ok || !verifyData?.status) {
      return NextResponse.json(
        { ok: false, error: verifyData?.message || "Payment verification failed." },
        { status: 400 }
      );
    }

    const payment = verifyData.data;
    if (payment?.status !== "success") {
      return NextResponse.json(
        { ok: false, error: "Payment not successful." },
        { status: 400 }
      );
    }

    const meta = payment?.metadata || {};
    const booking_id = meta?.booking_id;

    if (!booking_id) {
      return NextResponse.json(
        { ok: false, error: "Missing booking_id in metadata." },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // 2) Load booking
    const { data: booking, error: bErr } = await supabase
      .from("consultation_bookings")
      .select(
        "id,full_name,email,phone,start_at,end_at,timezone,payment_status,google_event_id,service_id"
      )
      .eq("id", booking_id)
      .single();

    if (bErr || !booking) {
      return NextResponse.json(
        { ok: false, error: "Booking not found." },
        { status: 404 }
      );
    }

    // ✅ Get service name
    const { data: service, error: sErr } = await supabase
      .from("consultation_services")
      .select("name")
      .eq("id", booking.service_id)
      .single();

    // If service lookup fails, still proceed with a fallback name
    const serviceName = !sErr && service?.name ? String(service.name) : "Consultation";

    // If already confirmed, return ok (avoid duplicates)
    if (booking.payment_status === "paid" && booking.google_event_id) {
      return NextResponse.json({ ok: true, already_confirmed: true });
    }

    // 3) Mark paid (also store reference so it’s traceable)
    const { error: upErr } = await supabase
      .from("consultation_bookings")
      .update({ payment_status: "paid", paystack_reference: String(reference) })
      .eq("id", booking_id);

    if (upErr) {
      return NextResponse.json(
        { ok: false, error: upErr.message },
        { status: 400 }
      );
    }

    // 4) Create Google Calendar event (ONLY if missing)
    let gEventId = booking.google_event_id;

    if (!gEventId) {
      gEventId = await createGoogleEvent({
        summary: `${serviceName}: ${booking.full_name}`,
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
    }

    // 5) Send email (with correct service name)
    await sendConsultationEmail({
      to: booking.email,
      name: booking.full_name,
      service_name: serviceName,
      startISO: booking.start_at,
      endISO: booking.end_at,
      timezone: booking.timezone || "Africa/Lagos",
    });

    return NextResponse.json({ ok: true, google_event_id: gEventId });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}