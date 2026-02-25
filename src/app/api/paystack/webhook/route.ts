import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createGoogleEvent } from "@/lib/googleCalendar";
import { resend } from "@/lib/resendClient";

export const runtime = "nodejs";

function verifyPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;

  const secret = process.env.PAYSTACK_SECRET_KEY!;
  if (!secret) return false;

  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  return hash === signature;
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-paystack-signature");
    const rawBody = await req.text();

    if (!verifyPaystackSignature(rawBody, signature)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // only handle successful payments
    if (payload?.event !== "charge.success") {
      return NextResponse.json({ ok: true });
    }

    const reference = payload?.data?.reference as string | undefined;
    if (!reference) return NextResponse.json({ ok: true });

    const metadata = payload?.data?.metadata || {};
    // ✅ make sure it is a consultation payment
    if (metadata?.type !== "consultation") {
      return NextResponse.json({ ok: true });
    }

    const supabase = supabaseAdmin();

    // Find booking by reference
    const { data: booking, error: bookErr } = await supabase
      .from("consultation_bookings")
      .select("*")
      .eq("paystack_reference", reference)
      .limit(1)
      .single();

    if (bookErr || !booking) return NextResponse.json({ ok: true });

    // Already processed
    if (booking.payment_status === "paid") {
      return NextResponse.json({ ok: true });
    }

    // Create Google Calendar event
    const summary = `Consultation: ${booking.full_name}`;
    const description = `Email: ${booking.email}\nPhone: ${booking.phone || "-"}\nNotes: ${booking.notes || "-"}`;

    const gEventId = await createGoogleEvent({
      summary,
      description,
      startISO: booking.start_at,
      endISO: booking.end_at,
      timezone: booking.timezone || "Africa/Lagos",
    });

    // ✅ Update booking (guard against double webhook)
    const { error: updErr } = await supabase
      .from("consultation_bookings")
      .update({
        payment_status: "paid",
        google_event_id: gEventId,
      })
      .eq("id", booking.id)
      .neq("payment_status", "paid");

    // Always return 200 to Paystack
    if (updErr) return NextResponse.json({ ok: true });

    // Email user + admin
    const fromEmail = process.env.RESEND_FROM_EMAIL!;
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL!;

    const when = new Date(booking.start_at).toLocaleString("en-GB", {
      timeZone: "Africa/Lagos",
    });

    await resend.emails.send({
      from: fromEmail,
      to: booking.email,
      subject: "Consultation confirmed ✅",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Your consultation is confirmed ✅</h2>
          <p><b>Name:</b> ${booking.full_name}</p>
          <p><b>Date/Time:</b> ${when} (Lagos)</p>
          <p><b>Payment Ref:</b> ${booking.paystack_reference}</p>
          <p>We look forward to speaking with you.</p>
        </div>
      `,
    });

    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: "New paid consultation booking",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New consultation booking</h2>
          <p><b>Name:</b> ${booking.full_name}</p>
          <p><b>Email:</b> ${booking.email}</p>
          <p><b>Phone:</b> ${booking.phone || "-"}</p>
          <p><b>Date/Time:</b> ${when} (Lagos)</p>
          <p><b>Ref:</b> ${booking.paystack_reference}</p>
          <p><b>Google Event ID:</b> ${gEventId}</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Paystack expects 200 OK even if we fail
    return NextResponse.json({ ok: true });
  }
}