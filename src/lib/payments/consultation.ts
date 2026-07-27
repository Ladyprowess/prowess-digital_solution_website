import { supabaseAdmin } from "@/lib/supabase/admin";
import { createGoogleEvent } from "@/lib/googleCalendar";
import { sendConsultationEmail } from "@/lib/email";
import { verifyTransaction } from "@/lib/payments/flutterwave";

/**
 * The single, real "mark a paid consultation booking as paid" path - verifies
 * with Flutterwave (never trusts the caller), cross-checks the amount and
 * booking_id against what Flutterwave actually recorded, then creates the
 * calendar event and sends the confirmation email. Idempotent, safe to call
 * from both the webhook and the client-side verify route.
 *
 * This replaces what used to be three separate, duplicated implementations
 * (in confirm/route.ts, verify-payment/route.ts, and inline in the old
 * Paystack webhook) - one of which had amount/metadata safety checks the
 * others were missing.
 */
export async function markConsultationPaid(reference: string) {
  const supabase = supabaseAdmin();

  const data = await verifyTransaction(reference);
  if (data?.status !== "successful") {
    return { ok: false as const, error: "Payment not successful" };
  }

  const bookingId = data?.meta?.booking_id as string | undefined;
  if (!bookingId) {
    return { ok: false as const, error: "Missing booking_id in payment metadata" };
  }

  const { data: booking, error: bookingErr } = await supabase
    .from("consultation_bookings")
    .select("id,service_id,full_name,email,start_at,end_at,timezone,payment_status,google_event_id")
    .eq("id", bookingId)
    .single();

  if (bookingErr || !booking) {
    return { ok: false as const, error: "Booking not found" };
  }

  if (booking.payment_status === "paid") {
    return { ok: true as const, alreadyPaid: true };
  }

  const { data: service } = await supabase
    .from("consultation_services")
    .select("name,price_usd")
    .eq("id", booking.service_id)
    .single();

  const expectedAmount = Math.round(Number(service?.price_usd || 0) * 100);
  const paidAmount = Math.round(Number(data?.amount || 0) * 100);
  if (paidAmount !== expectedAmount) {
    await supabase
      .from("consultation_bookings")
      .update({ payment_status: "failed" })
      .eq("id", bookingId);
    return { ok: false as const, error: "Amount mismatch, payment rejected" };
  }

  const { error: updErr } = await supabase
    .from("consultation_bookings")
    .update({ payment_status: "paid", flutterwave_reference: reference })
    .eq("id", bookingId)
    .neq("payment_status", "paid");

  if (updErr) return { ok: false as const, error: updErr.message };

  const serviceName = service?.name || "Consultation";

  let googleEventId = booking.google_event_id;
  if (!googleEventId) {
    googleEventId = await createGoogleEvent({
      summary: `Consultation: ${serviceName}`,
      description: `Booked by: ${booking.full_name}\nEmail: ${booking.email}`,
      startISO: booking.start_at,
      endISO: booking.end_at,
      timezone: booking.timezone || "Africa/Lagos",
    });

    await supabase
      .from("consultation_bookings")
      .update({ google_event_id: googleEventId })
      .eq("id", bookingId);
  }

  await sendConsultationEmail({
    to: booking.email,
    name: booking.full_name,
    service_name: serviceName,
    startISO: booking.start_at,
    endISO: booking.end_at,
    timezone: booking.timezone || "Africa/Lagos",
  });

  return { ok: true as const, alreadyPaid: false };
}
