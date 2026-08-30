import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/payments/flutterwave";
import { sendEventRegistrationEmails } from "@/lib/events/emails";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json({ error: "Missing reference." }, { status: 400 });
    }

    const data = await verifyTransaction(reference);
    if (data?.status !== "successful") {
      return NextResponse.json({ error: "Payment not successful." }, { status: 400 });
    }

    const meta = data?.meta || {};
    const event_id = meta.event_id;
    const full_name = meta.full_name;
    const phone = meta.phone || "";
    const email = data?.customer?.email;

    if (!event_id || !full_name || !email) {
      return NextResponse.json({ error: "Missing registration details." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Guard against the webhook already having inserted this registration.
    const { data: existing } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("flutterwave_reference", String(reference))
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, already_registered: true });
    }

    // Never trust the client's claimed currency - check that Flutterwave's
    // own verified amount and currency actually match one of this event's
    // real prices, not just that *some* payment succeeded.
    const { data: event } = await supabase
      .from("events")
      .select("price_usd,price_ngn")
      .eq("id", event_id)
      .maybeSingle();

    const chargedCurrency = String(data?.currency || "").toUpperCase();
    const expectedAmount = chargedCurrency === "NGN" ? event?.price_ngn : chargedCurrency === "USD" ? event?.price_usd : null;
    const amountMatches = expectedAmount != null && Math.round(Number(data?.amount || 0) * 100) === Math.round(Number(expectedAmount) * 100);

    if (!amountMatches) {
      return NextResponse.json({ error: "Payment amount or currency didn't match this event's price." }, { status: 400 });
    }

    const { error: regError } = await supabase.from("event_registrations").insert([
      {
        event_id,
        full_name: String(full_name).trim(),
        email: String(email).trim(),
        phone: phone ? String(phone).trim() : null,
        payment_status: "paid",
        flutterwave_reference: String(reference),
      },
    ]);

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 400 });
    }

    await sendEventRegistrationEmails({
      eventId: String(event_id),
      registrantName: String(full_name).trim(),
      registrantEmail: String(email).trim(),
      paymentStatus: "paid",
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
