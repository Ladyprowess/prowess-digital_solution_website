import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function makeRef() {
  return `CONS-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

// Build ISO timestamps from date + time + timezone (simple Lagos default)
function toISOStartEnd(params: {
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time: string; // HH:mm
  duration_minutes: number;
}) {
  const { scheduled_date, scheduled_time, duration_minutes } = params;

  // Treat as Africa/Lagos local time (UTC+1, no DST)
  // Convert to UTC ISO by subtracting 1 hour.
  const [y, m, d] = scheduled_date.split("-").map(Number);
  const [hh, mm] = scheduled_time.split(":").map(Number);

  const startLocal = new Date(Date.UTC(y, m - 1, d, hh - 1, mm, 0)); // Lagos -> UTC
  const endLocal = new Date(startLocal.getTime() + duration_minutes * 60 * 1000);

  return { start_at: startLocal.toISOString(), end_at: endLocal.toISOString() };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const service_id = String(body?.service_id || "").trim();
    const full_name = String(body?.full_name || "").trim();
    const email = String(body?.email || "").trim();
    const phone = body?.phone ? String(body.phone).trim() : null;

    const scheduled_date = String(body?.scheduled_date || "").trim(); // YYYY-MM-DD
    const scheduled_time = String(body?.scheduled_time || "").trim(); // HH:mm

    const notes = body?.notes ? String(body.notes).trim() : null;

    if (!service_id || !full_name || !email || !scheduled_date || !scheduled_time) {
      return NextResponse.json(
        { ok: false, error: "service_id, full_name, email, scheduled_date, scheduled_time are required." },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // 1) Get service (price + duration)
    const { data: service, error: serviceErr } = await supabase
      .from("consultation_services")
      .select("id,name,duration_minutes,price_ngn,is_active")
      .eq("id", service_id)
      .limit(1)
      .single();

    if (serviceErr || !service || !service.is_active) {
      return NextResponse.json({ ok: false, error: "Invalid consultation type." }, { status: 400 });
    }

    const duration = Number(service.duration_minutes || 30);
    const amount_ngn = Number(service.price_ngn || 0);

    // 2) Convert chosen date/time -> start_at/end_at ISO
    const { start_at, end_at } = toISOStartEnd({
      scheduled_date,
      scheduled_time,
      duration_minutes: duration,
    });

    // 3) Create booking row (pending for paid, paid/free later)
    const reference = makeRef();

    const { data: booking, error: insErr } = await supabase
      .from("consultation_bookings")
      .insert([
        {
          service_id,
          full_name,
          email,
          phone,
          start_at,
          end_at,
          notes,
          payment_status: amount_ngn > 0 ? "pending" : "paid",
          paystack_reference: amount_ngn > 0 ? reference : null,
          amount_ngn: Math.floor(amount_ngn),
        },
      ])
      .select("*")
      .single();

    if (insErr || !booking) {
      return NextResponse.json(
        { ok: false, error: insErr?.message || "Failed to create booking." },
        { status: 400 }
      );
    }

    // FREE => return free mode
    if (amount_ngn <= 0) {
      return NextResponse.json({ ok: true, mode: "free", booking_id: booking.id });
    }

    // PAID => init Paystack
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/consultation/success?ref=${reference}`;

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
          start_at,
          end_at,
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

    return NextResponse.json({
      ok: true,
      mode: "paid",
      booking_id: booking.id,
      authorization_url: paystackData.data.authorization_url,
      reference,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
