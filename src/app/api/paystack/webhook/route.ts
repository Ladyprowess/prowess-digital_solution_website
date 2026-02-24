import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createCalendarEvent } from "@/lib/googleCalendar";
import { resend } from "@/lib/resendClient";

export const runtime = "nodejs";

function verifyPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const secret = process.env.PAYSTACK_SECRET_KEY!;
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

    // We only care about successful charge
    if (payload?.event !== "charge.success") {
      return NextResponse.json({ ok: true });
    }

    const reference = payload?.data?.reference as string | undefined;
    if (!reference) return NextResponse.json({ ok: true });

    const supabase = supabaseAdmin();

    // Find booking by reference
    const { data: booking, error: bookErr } = await supabase
      .from("consultation_bookings")
      .select("*")
      .eq("paystack_reference", reference)
      .limit(1)
      .single();

    if (bookErr || !booking) return NextResponse.json({ ok: true });

    // If already paid, stop (avoid double webhook)
    if (booking.payment_status === "paid") {
      return NextResponse.json({ ok: true });
    }

    // Create Google Calendar event
    const summary = `Consultation: ${booking.full_name}`;
    const description = `Email: ${booking.email}\nPhone: ${booking.phone || "-"}\nNotes: ${booking.notes || "-"}`;

    const gEvent = await createCalendarEvent({
      summary,
      description,
      startISO: booking.start_at,
      endISO: booking.end_at,
    });

    // Update booking
    const { error: updErr } = await supabase
      .from("consultation_bookings")
      .update({
        payment_status: "paid",
        google_event_id: gEvent.id,
      })
      .eq("id", booking.id);

    if (updErr) {
      // still return ok to Paystack
      return NextResponse.json({ ok: true });
    }

    // Email user + admin
    const fromEmail = process.env.RESEND_FROM_EMAIL!;
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL!;

    const when = new Date(booking.start_at).toLocaleString("en-GB");

    await resend.emails.send({
      from: fromEmail,
      to: booking.email,
      subject: "Consultation confirmed ✅",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Your consultation is confirmed ✅</h2>
          <p><b>Name:</b> ${booking.full_name}</p>
          <p><b>Date/Time:</b> ${when}</p>
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
          <p><b>Date/Time:</b> ${when}</p>
          <p><b>Ref:</b> ${booking.paystack_reference}</p>
          <p><b>Google Event:</b> ${gEvent.htmlLink || "Created"}</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Paystack expects 200 OK even if we fail, but it's fine
    return NextResponse.json({ ok: true });
  }
}