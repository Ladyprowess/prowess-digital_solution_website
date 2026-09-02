import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_PREFERENCES = [
  "jobs", "internships", "grants", "scholarships", "events",
  "courses", "career_resources", "business", "general",
] as const;

function page(bodyHtml: string) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribe</title></head>` +
    `<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;padding:60px 20px;text-align:center;color:#0b1b1d;">` +
    `${bodyHtml}</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function message(text: string) {
  return page(`<p style="font-size:15px;max-width:420px;margin:0 auto;">${text}</p>`);
}

// email is attacker-controlled (a raw URL query param, not yet verified
// against the database at the point it's rendered) - reflecting it
// unescaped into this page would be a straightforward XSS via a crafted
// unsubscribe link, both in the visible text and inside the hidden
// input's value="" attribute.
function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// GET only ever renders a confirmation page - it never changes anything.
// Corporate email scanners (Outlook Safe Links, Proofpoint, Mimecast, etc.)
// automatically pre-fetch every link in an incoming email to scan it for
// phishing, before the recipient ever opens the message. If GET performed
// the unsubscribe itself (as a first draft of this route did), those
// automated crawls would silently unsubscribe people who never clicked
// anything. The actual state change only ever happens on the POST this
// page's own button submits - scanners overwhelmingly don't submit forms.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const preference = (url.searchParams.get("preference") || "").trim().toLowerCase();

  if (!email || !(VALID_PREFERENCES as readonly string[]).includes(preference)) {
    return message("This unsubscribe link is invalid.");
  }

  return page(`
    <p style="font-size:15px;max-width:420px;margin:0 auto 20px;">Unsubscribe <b>${escapeHtml(email)}</b> from ${escapeHtml(preference.replace("_", " "))} emails?</p>
    <form method="POST" action="/api/subscribe/unsubscribe">
      <input type="hidden" name="email" value="${escapeHtml(email)}" />
      <input type="hidden" name="preference" value="${escapeHtml(preference)}" />
      <button type="submit" style="background:#507c80;color:#ffffff;font-size:14px;font-weight:700;border:none;padding:13px 30px;border-radius:8px;cursor:pointer;">Confirm unsubscribe</button>
    </form>
  `);
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const email = String(form?.get("email") || "").trim().toLowerCase();
  const preference = String(form?.get("preference") || "").trim().toLowerCase();

  if (!email || !(VALID_PREFERENCES as readonly string[]).includes(preference)) {
    return message("This unsubscribe link is invalid.");
  }

  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("preferences")
    .eq("email", email)
    .maybeSingle();

  if (!existing) {
    return message("You're not subscribed to Prowess Digital Solutions emails.");
  }

  const preferences = { ...(existing.preferences || {}), [preference]: false };
  await supabase.from("newsletter_subscribers").update({ preferences, updated_at: new Date().toISOString() }).eq("email", email);

  return message(`You've been unsubscribed from ${preference.replace("_", " ")} emails. You can resubscribe any time from prowessdigitalsolutions.com.`);
}
