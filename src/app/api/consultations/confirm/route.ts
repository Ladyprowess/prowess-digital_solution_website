import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendBookingEmails } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = supabaseAdmin();
    const { booking_id, reference } = await req.json();

    if (!booking_id) {
      return NextResponse.json({ ok: false, error: "booking_id is required." }, { status: 400 });
    }

    // 1) load booking + service
    const { data: booking, error: bErr } = await supabase
      .from("consultation_bookings")
      .select("id,service_id,full_name,email,scheduled_date,scheduled_time,payment_status,paystack_reference")
      .eq("id", booking_id)
      .single();

    if (bErr || !booking) {
      return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
    }

    const { data: service } = await supabase
      .from("consultation_services")
      .select("name,duration_minutes,price_ngn")
      .eq("id", booking.service_id)
      .single();

    // 2) If already free/paid, just send emails once (avoid duplicates)
    const alreadyFinal = booking.payment_status === "paid" || booking.payment_status === "free";

    // If service is free -> mark free (if not)
    const servicePrice = Number(service?.price_ngn || 0);
    if (servicePrice <= 0) {
      if (!alreadyFinal) {
        await supabase.from("consultation_bookings")
          .update({ payment_status: "free" })
          .eq("id", booking_id);
      }

      // send emails
      await sendBookingEmails({
        adminEmail: process.env.ADMIN_EMAIL!,
        userEmail: booking.email,
        userName: booking.full_name,
        serviceName: service?.name || "Consultation",
        date: booking.scheduled_date,
        time: String(booking.scheduled_time).slice(0,5),
        durationMinutes: Number(service?.duration_minutes || 60),
        bookingId: booking.id,
        paid: false,
      });

      return NextResponse.json({ ok: true, status: "free" });
    }

    // 3) PAID: verify with Paystack
    const ref = reference || booking.paystack_reference;
    if (!ref) {
      return NextResponse.json({ ok: false, error: "Missing paystack reference." }, { status: 400 });
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${ref}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
      },
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData?.status) {
      return NextResponse.json({ ok: false, error: "Paystack verification failed." }, { status: 400 });
    }

    const paidOk = verifyData?.data?.status === "success";

    if (!paidOk) {
      await supabase.from("consultation_bookings")
        .update({ payment_status: "failed" })
        .eq("id", booking_id);

      return NextResponse.json({ ok: false, error: "Payment not successful." }, { status: 400 });
    }

    // mark paid
    await supabase.from("consultation_bookings")
      .update({ payment_status: "paid", paystack_reference: ref })
      .eq("id", booking_id);

    // send emails
    await sendBookingEmails({
      adminEmail: process.env.ADMIN_EMAIL!,
      userEmail: booking.email,
      userName: booking.full_name,
      serviceName: service?.name || "Consultation",
      date: booking.scheduled_date,
      time: String(booking.scheduled_time).slice(0,5),
      durationMinutes: Number(service?.duration_minutes || 60),
      bookingId: booking.id,
      paid: true,
    });

    return NextResponse.json({ ok: true, status: "paid" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}