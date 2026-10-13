import { resend } from "./resendClient";
import { escapeEmail } from "./payments/emailEscape";
type EmailParams = {
  to: string;
  name: string;
  service_name: string;
  startISO: string;
  endISO: string;
  timezone?: string;
};

function fmt(iso: string, tz = "Africa/Lagos") {
  return new Date(iso).toLocaleString("en-GB", { timeZone: tz });
}

export async function sendConsultationEmail(p: EmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL");
  }

  const subject = "Your consultation booking is confirmed";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h2 style="margin-bottom:8px">Booking confirmed ✅</h2>

      <p>Hi ${escapeEmail(p.name)},</p>

      <p>Your consultation has been confirmed.</p>

      <p><strong>Service:</strong> ${escapeEmail(p.service_name)}</p>

      <p>
       <strong>Start:</strong> ${fmt(p.startISO, p.timezone)} (${escapeEmail(p.timezone || "Africa/Lagos")})<br/>
       <strong>End:</strong> ${fmt(p.endISO, p.timezone)} (${escapeEmail(p.timezone || "Africa/Lagos")})
      </p>

      <p>Kindly add this event to your google calendar.</p>

      <p>If you have any questions, simply reply to this email.</p>
    </div>
  `;

  const result = await resend.emails.send({ from, to: [p.to], subject, html }, { idempotencyKey: `consultation-${p.to}-${p.startISO}` });
  if (result.error) throw new Error("Consultation email could not be sent.");
  return true;
}
