import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { initializePayment, generateReference } from "@/lib/payments/flutterwave";

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

    const reference = generateReference("EVT");
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/events/payment-success`;

    const { link } = await initializePayment({
      email: String(email).trim(),
      amount,
      currency: "NGN",
      reference,
      callbackUrl,
      metadata: {
        type: "event",
        event_id,
        full_name: String(full_name).trim(),
        phone: phone ? String(phone).trim() : "",
      },
    });

    return NextResponse.json({
      ok: true,
      mode: "paid",
      authorization_url: link,
      reference,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
