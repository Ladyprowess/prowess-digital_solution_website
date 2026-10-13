import { matchesPayment } from "@/lib/payments/validation";
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
    .select("id,service_id,full_name,email,start_at,end_at,timezone,payment_status,google_event_id,flutterwave_reference,amount_usd,amount_ngn,currency")
    .eq("id", bookingId)
    .single();

  if (bookingErr || !booking) {
    return { ok: false as const, error: "Booking not found" };
  }

  const { data: service } = await supabase
    .from("consultation_services")
    .select("name,price_usd,price_ngn")
    .eq("id", booking.service_id)
    .single();

  const expectedAmount = booking.currency === "NGN" ? booking.amount_ngn : booking.amount_usd;
  if (!matchesPayment(data, { reference, type: "consultation", idKey: "booking_id", id: booking.id,
    amount: expectedAmount, currency: booking.currency, email: booking.email,
    storedReference: booking.flutterwave_reference })) {
    return { ok: false as const, error: "Payment does not match this booking" };
  }
  const { error: updErr } = await supabase
    .from("consultation_bookings")
    .update({ payment_status: "paid" })
    .eq("id", bookingId);
  if (updErr) return { ok: false as const, error: "Could not confirm booking" };

  const serviceName = service?.name || "Consultation";

  let googleEventId = booking.google_event_id;
  if (!googleEventId) {
    googleEventId = await createGoogleEvent({
      eventId: `c${booking.id.replace(/-/g, "")}`,
      summary: `Consultation: ${serviceName}`,
      description: `Booked by: ${booking.full_name}\nEmail: ${booking.email}`,
      startISO: booking.start_at,
      endISO: booking.end_at,
      timezone: booking.timezone || "Africa/Lagos",
    });

    const { error: calendarError } = await supabase.from("consultation_bookings")
      .update({ google_event_id: googleEventId }).eq("id", bookingId);
    if (calendarError) throw new Error("Could not save calendar confirmation");
  }

  const { data: claimed, error: claimError } = await supabase.from("consultation_bookings")
    .update({ confirmation_email_sent_at: new Date().toISOString() })
    .eq("id", bookingId).is("confirmation_email_sent_at", null).select("id");
  if (claimError) throw new Error("Could not confirm notification state");
  if (claimed?.length) {
    try {
      await sendConsultationEmail({ to: booking.email, name: booking.full_name, service_name: serviceName,
        startISO: booking.start_at, endISO: booking.end_at, timezone: booking.timezone || "Africa/Lagos" });
    } catch (error) {
      await supabase.from("consultation_bookings").update({ confirmation_email_sent_at: null }).eq("id", bookingId);
      throw error;
    }
  }

  return { ok: true as const, alreadyPaid: false };
}
