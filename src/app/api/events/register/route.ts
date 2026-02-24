import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event_id, full_name, email, phone } = body || {};

    if (!event_id || !full_name || !email) {
      return NextResponse.json(
        { error: "event_id, full_name, and email are required." },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id,registration_type,price_ngn")
      .eq("id", event_id)
      .limit(1)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // FREE EVENT
    if (event.registration_type === "free") {
      const { error: regError } = await supabase.from("event_registrations").insert([
        {
          event_id,
          full_name: String(full_name).trim(),
          email: String(email).trim(),
          phone: phone ? String(phone).trim() : null,
          payment_status: "free",
        },
      ]);

      if (regError) {
        return NextResponse.json({ error: regError.message }, { status: 400 });
      }

      return NextResponse.json({ ok: true, mode: "free" });
    }

    // PAID EVENT
    const amount = Number(event.price_ngn || 0);
    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Paid event price is not set." }, { status: 400 });
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/events/payment-success`;

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: String(email).trim(),
        amount: amount * 100,
        callback_url: callbackUrl,
        metadata: {
          event_id,
          full_name: String(full_name).trim(),
          phone: phone ? String(phone).trim() : "",
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData?.status) {
      return NextResponse.json(
        { error: paystackData?.message || "Paystack initialisation failed." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      mode: "paid",
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}