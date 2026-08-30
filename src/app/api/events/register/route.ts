import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { initializePayment, generateReference } from "@/lib/payments/flutterwave";
import { sendEventRegistrationEmails } from "@/lib/events/emails";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event_id, full_name, email, phone, currency } = body || {};

    if (!event_id || !full_name || !email) {
      return NextResponse.json(
        { error: "event_id, full_name, and email are required." },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id,registration_type,price_usd,price_ngn")
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

      await sendEventRegistrationEmails({
        eventId: event_id,
        registrantName: String(full_name).trim(),
        registrantEmail: String(email).trim(),
        paymentStatus: "free",
      }).catch(() => {});

      return NextResponse.json({ ok: true, mode: "free" });
    }

    // PAID EVENT - the server picks the amount for whichever currency was
    // requested, never trusting an amount from the client. Falls back to
    // whichever currency the event actually has a price in if the client
    // didn't send one (legacy single-currency events, or an old client).
    const requestedCurrency = currency === "NGN" || currency === "USD" ? currency : null;
    const resolvedCurrency = requestedCurrency && (requestedCurrency === "USD" ? event.price_usd : event.price_ngn)
      ? requestedCurrency
      : event.price_usd
        ? "USD"
        : "NGN";
    const amount = Number((resolvedCurrency === "USD" ? event.price_usd : event.price_ngn) || 0);

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "This event isn't priced in that currency." }, { status: 400 });
    }

    const reference = generateReference("EVT");
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/events/payment-success`;

    const { link } = await initializePayment({
      email: String(email).trim(),
      amount,
      currency: resolvedCurrency,
      reference,
      callbackUrl,
      metadata: {
        type: "event",
        event_id,
        full_name: String(full_name).trim(),
        email: String(email).trim(),
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
