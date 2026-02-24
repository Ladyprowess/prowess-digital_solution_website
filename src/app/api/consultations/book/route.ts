// src/app/api/consultations/book/route.ts

import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function makeRef() {
  return `CONS-${Date.now()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
}

// Africa/Lagos is UTC+1 (no DST) => use +01:00 safely
function buildStartISO(scheduled_date: string, scheduled_time: string) {
  // scheduled_date: "YYYY-MM-DD", scheduled_time: "HH:mm"
  return new Date(`${scheduled_date}T${scheduled_time}:00+01:00`).toISOString();
}

function addMinutes(iso: string, mins: number) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + mins);
  return d.toISOString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    // ✅ These match what your Consultation page is sending
    const service_id = String(body?.service_id || "").trim();
    const full_name = String(body?.full_name || "").trim();
    const email = String(body?.email || "").trim();
    const phone = body?.phone ? String(body.phone).trim() : null;

    const scheduled_date = String(body?.scheduled_date || "").trim(); // YYYY-MM-DD
    const scheduled_time = String(body?.scheduled_time || "").trim(); // HH:mm

    const notes = body?.notes ? String(body.notes).trim() : null;

    if (!service_id || !full_name || !email || !scheduled_date || !scheduled_time) {
      return NextResponse.json(
        {
          ok: false,
          error: "service_id, full_name, email, scheduled_date, scheduled_time are required.",
        },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // ✅ Get service price + duration from Supabase (so you don't pass amount from frontend)
    const { data: service, error: serviceErr } = await supabase
      .from("consultation_services")
      .select("id,name,duration_minutes,price_ngn,is_active")
      .eq("id", service_id)
      .limit(1)
      .single();

    if (serviceErr || !service || service.is_active === false) {
      return NextResponse.json(
        { ok: false, error: "Consultation type not found or inactive." },
        { status: 400 }
      );
    }

    const start_at = buildStartISO(scheduled_date, scheduled_time);
    const end_at = addMinutes(start_at, Number(service.duration_minutes || 30));

    // ✅ Prevent double booking (pending or paid)
    const { data: existing, error: existErr } = await supabase
      .from("consultation_bookings")
      .select("id")
      .eq("start_at", start_at)
      .in("payment_status", ["pending", "paid"])
      .limit(1);

    if (existErr) {
      return NextResponse.json({ ok: false, error: existErr.message }, { status: 400 });
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { ok: false, error: "That time slot is already taken. Please pick another." },
        { status: 400 }
      );
    }

    const price_ngn = Number(service.price_ngn || 0);

    // ✅ FREE booking
    if (!price_ngn || price_ngn < 1) {
      const { data: booking, error: insErr } = await supabase
        .from("consultation_bookings")
        .insert([
          {
            full_name,
            email,
            phone,
            start_at,
            end_at,
            notes,
            payment_status: "paid",
            paystack_reference: null,
            amount_ngn: 0,
          },
        ])
        .select("id")
        .single();

      if (insErr || !booking) {
        return NextResponse.json(
          { ok: false, error: insErr?.message || "Failed to create booking." },
          { status: 400 }
        );
      }

      return NextResponse.json({ ok: true, mode: "free", booking_id: booking.id });
    }

    // ✅ PAID booking
    const reference = makeRef();

    const { data: booking, error: insErr } = await supabase
      .from("consultation_bookings")
      .insert([
        {
          full_name,
          email,
          phone,
          start_at,
          end_at,
          notes,
          payment_status: "pending",
          paystack_reference: reference,
          amount_ngn: Math.floor(price_ngn),
        },
      ])
      .select("id")
      .single();

    if (insErr || !booking) {
      return NextResponse.json(
        { ok: false, error: insErr?.message || "Failed to create booking." },
        { status: 400 }
      );
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/consultation/success?ref=${encodeURIComponent(
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
        amount: Math.floor(price_ngn) * 100,
        reference,
        callback_url: callbackUrl,
        metadata: {
          type: "consultation",
          booking_id: booking.id,
          full_name,
          phone: phone || "",
          start_at,
          end_at,
          service_id,
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