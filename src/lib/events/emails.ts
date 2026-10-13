import { escapeEmail } from "@/lib/payments/emailEscape";
import { resend } from "@/lib/resendClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://prowessdigitalsolutions.com";

// Same table-based, inline-styled layout as content.ts's order confirmation
// email - Gmail/Outlook/Apple Mail don't reliably support flexbox/grid or
// CSS custom properties in email, so this deliberately avoids both.
function registrationConfirmationEmailHtml(params: {
  eventTitle: string;
  eventUrl: string;
  dateLabel: string;
  joinLink: string | null;
}): string {
  const { eventTitle, eventUrl, dateLabel, joinLink } = params;
  return `
  <div style="background:#fafcfc;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dde6e6;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="background:#507c80;padding:26px 28px;">
          <span style="color:#ffffff;font-size:15px;font-weight:700;">Prowess Digital Solutions</span>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 28px 8px;">
          <span style="display:inline-block;background:#e7eeee;color:#3d5f62;font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;margin-bottom:18px;">&#10003; Registration confirmed</span>
          <h2 style="margin:0 0 14px;font-size:19px;font-weight:700;color:#0b1b1d;">You're registered</h2>
          <p style="margin:0 0 20px;font-size:14.5px;line-height:1.65;color:#4b6062;">You have successfully registered for <b>${escapeEmail(eventTitle)}</b>, scheduled for ${escapeEmail(dateLabel)}.</p>
        </td>
      </tr>
      ${
        joinLink
          ? `<tr>
        <td align="center" style="padding:12px 28px 8px;">
          <a href="${escapeEmail(joinLink)}" style="display:inline-block;background:#507c80;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 30px;border-radius:8px;">Join the event</a>
        </td>
      </tr>`
          : ""
      }
      <tr>
        <td align="center" style="padding:12px 28px 8px;">
          <a href="${escapeEmail(eventUrl)}" style="display:inline-block;color:#3d5f62;font-size:13px;font-weight:600;text-decoration:none;">View event details</a>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 28px;border-top:1px solid #dde6e6;text-align:center;">
          <p style="margin:0;font-size:11.5px;color:#4b6062;">Prowess Digital Solutions &middot; prowessdigitalsolutions.com</p>
        </td>
      </tr>
    </table>
  </div>`;
}

function adminRegistrationNotificationHtml(params: {
  eventTitle: string;
  registrantName: string;
  registrantEmail: string;
  paymentStatus: "free" | "paid";
}): string {
  const { eventTitle, registrantName, registrantEmail, paymentStatus } = params;
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;padding:8px;">
    <h2 style="margin:0 0 12px;font-size:16px;color:#0b1b1d;">New event registration</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" style="border:1px solid #dde6e6;border-radius:10px;background:#f2f6f6;padding:4px 18px;width:100%;max-width:460px;">
      <tr><td style="font-size:13px;color:#4b6062;padding:9px 0;">Event</td><td style="font-size:13px;font-weight:700;text-align:right;">${escapeEmail(eventTitle)}</td></tr>
      <tr><td style="font-size:13px;color:#4b6062;padding:9px 0;border-top:1px solid #dde6e6;">Name</td><td style="font-size:13px;font-weight:700;text-align:right;border-top:1px solid #dde6e6;">${escapeEmail(registrantName)}</td></tr>
      <tr><td style="font-size:13px;color:#4b6062;padding:9px 0;border-top:1px solid #dde6e6;">Email</td><td style="font-size:13px;font-weight:700;text-align:right;border-top:1px solid #dde6e6;">${escapeEmail(registrantEmail)}</td></tr>
      <tr><td style="font-size:13px;color:#4b6062;padding:9px 0;border-top:1px solid #dde6e6;">Type</td><td style="font-size:13px;font-weight:700;text-align:right;border-top:1px solid #dde6e6;">${paymentStatus === "paid" ? "Paid" : "Free"}</td></tr>
    </table>
  </div>`;
}

/**
 * Sends the registrant's confirmation email and the admin's new-registration
 * notification. Called once per successful registration - from the free
 * path directly, and from both places a paid registration can be reconciled
 * (the client-side verify call and the webhook), each guarded upstream by an
 * idempotency check so this never fires twice for the same registration.
 */
export async function sendEventRegistrationEmails(params: {
  eventId: string;
  registrantName: string;
  registrantEmail: string;
  paymentStatus: "free" | "paid";
}) {
  const { eventId, registrantName, registrantEmail, paymentStatus } = params;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (!fromEmail) return;

  const { supabaseAdmin } = await import("@/lib/supabase/admin");
  const supabase = supabaseAdmin();
  const { data: event } = await supabase
    .from("events")
    .select("title, slug, date, time, join_link")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) return;

  const eventUrl = event.slug ? `${SITE_URL}/events/${event.slug}` : SITE_URL;
  const dateLabel = new Date(`${event.date}T${event.time || "00:00"}`).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (registrantEmail) {
    await resend.emails.send({
      from: fromEmail,
      to: registrantEmail,
      subject: `You're registered: ${event.title}`,
      html: registrationConfirmationEmailHtml({
        eventTitle: event.title,
        eventUrl,
        dateLabel,
        joinLink: event.join_link || null,
      }),
    }).catch(() => {});
  }

  if (adminEmail) {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `New registration: ${event.title}`,
      html: adminRegistrationNotificationHtml({
        eventTitle: event.title,
        registrantName,
        registrantEmail,
        paymentStatus,
      }),
    }).catch(() => {});
  }
}
