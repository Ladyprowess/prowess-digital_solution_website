import { paymentPrice } from "@/lib/payments/validation";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { initializePayment, generateReference } from "@/lib/payments/flutterwave";
import { sendEventRegistrationEmails } from "@/lib/events/emails";
import { verifyMember } from "@/lib/auth/verifyMember";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const member = await verifyMember(req);
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
      .select("id,registration_type,price_usd,price_ngn,status,date")
      .eq("id", event_id)
      .limit(1)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    if (event.status !== "published" || (event.date && event.date < today)) return NextResponse.json({ error: "Registration is closed." }, { status: 400 });

    // FREE EVENT
    if (event.registration_type === "free") {
      const { error: regError } = await supabase.from("event_registrations").insert([
        {
          event_id,
          user_id: member?.id || null,
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
    if (event.registration_type !== "paid") return NextResponse.json({ error: "Use this event’s registration instructions." }, { status: 400 });
    const selected = paymentPrice(event.price_usd, event.price_ngn, currency);
    if (!selected) return NextResponse.json({ error: "This event is not priced in that currency." }, { status: 400 });
    const { currency: resolvedCurrency, amount } = selected;

    const reference = generateReference("EVT");
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.prowessdigitalsolutions.com"}/events/payment-success`;

    const { link } = await initializePayment({
      email: String(email).trim(),
      amount,
      currency: resolvedCurrency,
      reference,
      callbackUrl,
      metadata: {
        type: "event",
        checkout_amount: amount,
        checkout_currency: resolvedCurrency,
        event_id,
        full_name: String(full_name).trim(),
        email: String(email).trim(),
        phone: phone ? String(phone).trim() : "",
        user_id: member?.id || "",
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
