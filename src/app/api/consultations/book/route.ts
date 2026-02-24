import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function makeRef() {
  return `CONS-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

// Nigeria is +01:00 (no DST). We use a fixed offset to avoid timezone libraries.
function buildStartISO(scheduled_date: string, scheduled_time: string) {
  // scheduled_time must look like "10:30"
  return `${scheduled_date}T${scheduled_time}:00+01:00`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const service_id = String(body?.service_id || "").trim();
    const full_name = String(body?.full_name || "").trim();
    const email = String(body?.email || "").trim();
    const phone = body?.phone ? String(body.phone).trim() : null;

    const scheduled_date = String(body?.scheduled_date || "").trim(); // "YYYY-MM-DD"
    const scheduled_time = String(body?.scheduled_time || "").trim(); // "HH:mm"
    const timezone = String(body?.timezone || "Africa/Lagos").trim();
    const notes = body?.notes ? String(body.notes).trim() : null;

    if (!service_id || !full_name || !email || !scheduled_date || !scheduled_time) {
      return NextResponse.json(
        { ok: false, error: "service_id, full_name, email, scheduled_date, scheduled_time are required." },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // 1) Get service (price + duration)
    const { data: service, error: svcErr } = await supabase
      .from("consultation_services")
      .select("id,name,duration_minutes,price_ngn,is_active")
      .eq("id", service_id)
      .limit(1)
      .single();

    if (svcErr || !service || !service.is_active) {
      return NextResponse.json({ ok: false, error: "Selected service not available." }, { status: 400 });
    }

    const amount_ngn = Number(service.price_ngn || 0);
    const duration_minutes = Number(service.duration_minutes || 30);

    // 2) Compute start_at / end_at
    const startISO = buildStartISO(scheduled_date, scheduled_time);
    const start = new Date(startISO);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ ok: false, error: "Invalid date/time selected." }, { status: 400 });
    }

    const end = new Date(start.getTime() + duration_minutes * 60 * 1000);

    const reference = makeRef();

    // 3) Insert booking (FREE or PAID)
    const isPaid = amount_ngn > 0;

    const { data: booking, error: insErr } = await supabase
      .from("consultation_bookings")
      .insert([
        {
          service_id,
          full_name,
          email,
          phone,

          scheduled_date,
          scheduled_time,
          timezone,

          start_at: start.toISOString(),
          end_at: end.toISOString(),

          notes,

          payment_status: isPaid ? "pending" : "paid",
          paystack_reference: isPaid ? reference : null,
          amount_ngn: Math.floor(amount_ngn),
        },
      ])
      .select("id,payment_status,paystack_reference")
      .single();

    if (insErr || !booking) {
      return NextResponse.json(
        { ok: false, error: insErr?.message || "Failed to create booking." },
        { status: 400 }
      );
    }

    // FREE
    if (!isPaid) {
      return NextResponse.json({ ok: true, mode: "free", booking_id: booking.id }, { status: 200 });
    }

    // PAID => Paystack initialise
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/consultation/success?reference=${encodeURIComponent(
      reference
    )}`;

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.floor(amount_ngn) * 100,
        reference,
        callback_url: callbackUrl,
        metadata: {
          type: "consultation",
          booking_id: booking.id,
          service_id,
          full_name,
          phone: phone || "",
          scheduled_date,
          scheduled_time,
          timezone,
        },
      }),
    });

    const paystackData = await paystackRes.json().catch(() => null);

    if (!paystackRes.ok || !paystackData?.status) {
      return NextResponse.json(
        { ok: false, error: paystackData?.message || "Paystack initialisation failed." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        mode: "paid",
        booking_id: booking.id,
        authorization_url: paystackData.data.authorization_url,
        reference,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
