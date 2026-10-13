import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Confirms a FREE consultation booking (no payment involved) - sends the
// confirmation email. Paid bookings are confirmed via markConsultationPaid
// (see verify-payment/route.ts and the Flutterwave webhook), not here.
export async function POST(req: Request) {
  try {
    const supabase = supabaseAdmin();
    const { booking_id } = await req.json();

    if (!booking_id) {
      return NextResponse.json(
        { ok: false, error: "booking_id is required." },
        { status: 400 }
      );
    }

    const { data: booking, error: bErr } = await supabase
      .from("consultation_bookings")
      .select("id,service_id,full_name,email,start_at,end_at,timezone,payment_status")
      .eq("id", booking_id)
      .single();

    if (bErr || !booking) {
      return NextResponse.json(
        { ok: false, error: "Booking not found." },
        { status: 404 }
      );
    }

    if (booking.payment_status !== "free") {
      return NextResponse.json({ ok: false, error: "This booking requires payment verification." }, { status: 400 });
    }
    // Booking creation handles confirmation. This endpoint must never change payment state or resend email.
    return NextResponse.json({ ok: true, status: "free" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
