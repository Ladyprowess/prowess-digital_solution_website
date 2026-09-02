import { resend } from "@/lib/resendClient";
import { supabaseAdmin } from "@/lib/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://prowessdigitalsolutions.com";

// Same table-based, inline-styled layout as sendEventRegistrationEmails'
// templates (src/lib/events/emails.ts) - email clients don't reliably
// support flexbox/grid/custom properties.
function newEventEmailHtml(params: {
  eventTitle: string;
  eventUrl: string;
  dateLabel: string;
  location: string | null;
  description: string | null;
  unsubscribeUrl: string;
}): string {
  const { eventTitle, eventUrl, dateLabel, location, description, unsubscribeUrl } = params;
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
          <span style="display:inline-block;background:#e7eeee;color:#3d5f62;font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;margin-bottom:18px;">New event</span>
          <h2 style="margin:0 0 14px;font-size:19px;font-weight:700;color:#0b1b1d;">${eventTitle}</h2>
          <p style="margin:0 0 6px;font-size:14.5px;line-height:1.65;color:#4b6062;">${dateLabel}</p>
          ${location ? `<p style="margin:0 0 20px;font-size:14.5px;line-height:1.65;color:#4b6062;">${location}</p>` : `<p style="margin:0 0 20px;"></p>`}
          ${description ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.65;color:#4b6062;">${description.slice(0, 280)}${description.length > 280 ? "…" : ""}</p>` : ""}
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:4px 28px 28px;">
          <a href="${eventUrl}" style="display:inline-block;background:#507c80;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 30px;border-radius:8px;">View event &amp; register</a>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 28px;border-top:1px solid #dde6e6;text-align:center;">
          <p style="margin:0 0 6px;font-size:11.5px;color:#4b6062;">Prowess Digital Solutions &middot; prowessdigitalsolutions.com</p>
          <p style="margin:0;font-size:11.5px;color:#9fb0ae;"><a href="${unsubscribeUrl}" style="color:#9fb0ae;">Unsubscribe from event emails</a></p>
        </td>
      </tr>
    </table>
  </div>`;
}

/**
 * Fires once, right after a new event is published (src/app/api/events/create/route.ts).
 * Everyone who ever checked "Get Event Updates" is stored as one row in
 * newsletter_subscribers with preferences.events = true (see
 * src/app/api/subscribe/route.ts) - until this function existed, that flag
 * was written and never read again anywhere in the codebase, so nobody who
 * opted in was ever actually emailed about a new event. A caught/logged
 * failure here must never break event creation itself.
 */
export async function notifyEventSubscribersOfNewEvent(eventId: string): Promise<{ sent: number; failed: number }> {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) return { sent: 0, failed: 0 };

  const supabase = supabaseAdmin();

  const { data: event } = await supabase
    .from("events")
    .select("title, slug, date, time, location, description, status")
    .eq("id", eventId)
    .maybeSingle();

  if (!event || event.status !== "published") return { sent: 0, failed: 0 };

  const { data: subscribers } = await supabase
    .from("newsletter_subscribers")
    .select("email")
    .eq("preferences->>events", "true");

  if (!subscribers || subscribers.length === 0) return { sent: 0, failed: 0 };

  const eventUrl = event.slug ? `${SITE_URL}/events/${event.slug}` : SITE_URL;
  const dateLabel = new Date(`${event.date}T${event.time || "00:00"}`).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const results = await Promise.allSettled(
    subscribers.map((s) =>
      resend.emails.send({
        from: fromEmail,
        to: s.email,
        subject: `New event: ${event.title}`,
        html: newEventEmailHtml({
          eventTitle: event.title,
          eventUrl,
          dateLabel,
          location: event.location || null,
          description: event.description || null,
          unsubscribeUrl: `${SITE_URL}/api/subscribe/unsubscribe?email=${encodeURIComponent(s.email)}&preference=events`,
        }),
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;
  if (failed > 0) console.error(`notifyEventSubscribersOfNewEvent: ${failed} of ${results.length} event-update emails failed to send`);

  return { sent, failed };
}
