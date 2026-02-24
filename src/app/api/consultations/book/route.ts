import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function makeRef() {
  return `CONS-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const full_name = String(body?.full_name || "").trim();
    const email = String(body?.email || "").trim();
    const phone = body?.phone ? String(body.phone).trim() : null;
    const start_at = String(body?.start_at || "").trim(); // ISO
    const end_at = String(body?.end_at || "").trim();     // ISO
    const notes = body?.notes ? String(body.notes).trim() : null;

    const amount_ngn = Number(body?.amount_ngn || 0);

    if (!full_name || !email || !start_at || !end_at) {
      return NextResponse.json(
        { ok: false, error: "full_name, email, start_at, end_at are required." },
        { status: 400 }
      );
    }

    if (!amount_ngn || amount_ngn < 1) {
      return NextResponse.json(
        { ok: false, error: "amount_ngn must be set for consultation payment." },
        { status: 400 }
      );
    }

    const reference = makeRef();

    const supabase = supabaseAdmin();

    // Create pending booking
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

    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/consultations/success?ref=${reference}`;

    // Paystack initialize
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