import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendConsultationEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = supabaseAdmin();
    const { booking_id, reference } = await req.json();

    if (!booking_id) {
      return NextResponse.json(
        { ok: false, error: "booking_id is required." },
        { status: 400 }
      );
    }

    // 1️⃣ Load booking
    const { data: booking, error: bErr } = await supabase
      .from("consultation_bookings")
      .select(
        "id,service_id,full_name,email,start_at,end_at,timezone,payment_status,paystack_reference"
      )
      .eq("id", booking_id)
      .single();

    if (bErr || !booking) {
      return NextResponse.json(
        { ok: false, error: "Booking not found." },
        { status: 404 }
      );
    }

    // 2️⃣ Load service
    const { data: service } = await supabase
      .from("consultation_services")
      .select("name,duration_minutes,price_ngn")
      .eq("id", booking.service_id)
      .single();

    const servicePrice = Number(service?.price_ngn || 0);

    const alreadyFinal =
      booking.payment_status === "paid" ||
      booking.payment_status === "free";

    // 🟢 FREE SERVICE
    if (servicePrice <= 0) {
      if (!alreadyFinal) {
        await supabase
          .from("consultation_bookings")
          .update({ payment_status: "free" })
          .eq("id", booking_id);
      }

      await sendConsultationEmail({
        to: booking.email,
        name: booking.full_name,
        service_name: service?.name || "Consultation",
        startISO: booking.start_at,
        endISO: booking.end_at,
        timezone: booking.timezone || "Africa/Lagos",
      });

      return NextResponse.json({ ok: true, status: "free" });
    }

    // 🔵 PAID SERVICE
    const ref = reference || booking.paystack_reference;

    if (!ref) {
      return NextResponse.json(
        { ok: false, error: "Missing paystack reference." },
        { status: 400 }
      );
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
        },
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData?.status) {
      return NextResponse.json(
        { ok: false, error: "Paystack verification failed." },
        { status: 400 }
      );
    }

    const paidOk = verifyData?.data?.status === "success";

    if (!paidOk) {
      await supabase
        .from("consultation_bookings")
        .update({ payment_status: "failed" })
        .eq("id", booking_id);

      return NextResponse.json(
        { ok: false, error: "Payment not successful." },
        { status: 400 }
      );
    }

    // mark paid
    await supabase
      .from("consultation_bookings")
      .update({ payment_status: "paid", paystack_reference: ref })
      .eq("id", booking_id);

    // 📧 send consultation email
    await sendConsultationEmail({
      to: booking.email,
      name: booking.full_name,
      service_name: service?.name || "Consultation",
      startISO: booking.start_at,
      endISO: booking.end_at,
      timezone: booking.timezone || "Africa/Lagos",
    });

    return NextResponse.json({ ok: true, status: "paid" });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}