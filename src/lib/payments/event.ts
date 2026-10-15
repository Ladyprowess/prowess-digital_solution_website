import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/payments/flutterwave";
import { matchesPayment } from "@/lib/payments/validation";
import { sendEventRegistrationEmails } from "@/lib/events/emails";

export async function markEventPaid(reference: string) {
  const charge = await verifyTransaction(reference);
  const meta = charge?.meta || {};
  const email = charge?.customer?.email;
  if (meta.type !== "event" || !meta.event_id || !meta.full_name || !email) return { ok: false };
  const supabase = supabaseAdmin();
  const { data: event, error: eventError } = await supabase.from("events")
    .select("price_usd,price_ngn").eq("id", meta.event_id).maybeSingle();
  if (eventError || !event) return { ok: false };
  // Snapshot is supplied by our checkout, returned by provider verification, never the browser.
  // Older checkouts without a snapshot retain the existing event-price fallback.
  const currency = meta.checkout_currency || charge.currency;
  const amount = meta.checkout_amount ?? (currency === "NGN" ? event.price_ngn : currency === "USD" ? event.price_usd : null);
  if (!matchesPayment(charge, { reference, type: "event", idKey: "event_id", id: meta.event_id,
    amount, currency, email: meta.email || email })) return { ok: false };
  const { data: existing, error: lookupError } = await supabase.from("event_registrations")
    .select("id").eq("flutterwave_reference", reference).maybeSingle();
  if (lookupError) return { ok: false };
  if (existing) return { ok: true, already_registered: true };
  const { error } = await supabase.from("event_registrations").insert({
    event_id: meta.event_id, full_name: String(meta.full_name).trim(), email: String(email).trim(),
    user_id: meta.user_id ? String(meta.user_id) : null,
    phone: meta.phone ? String(meta.phone).trim() : null, payment_status: "paid", flutterwave_reference: reference,
    amount_paid: amount, currency,
  });
  if (error) {
    if (error.code === "23505") {
      const { data: duplicate } = await supabase.from("event_registrations").select("id")
        .eq("flutterwave_reference", reference).maybeSingle();
      if (duplicate) return { ok: true, already_registered: true };
    }
    return { ok: false };
  }
  await sendEventRegistrationEmails({ eventId: String(meta.event_id), registrantName: String(meta.full_name),
    registrantEmail: String(email), paymentStatus: "paid" }).catch(() => {});
  return { ok: true };
}
