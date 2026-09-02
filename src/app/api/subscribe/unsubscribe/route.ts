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

function page(message: string) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribe</title></head>` +
    `<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;padding:60px 20px;text-align:center;color:#0b1b1d;">` +
    `<p style="font-size:15px;max-width:420px;margin:0 auto;">${message}</p></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

// A one-click, unauthenticated unsubscribe link embedded in every event
// (and future preference-based) email - standard practice for a mailing
// preference toggle, same trust level as every other unsubscribe link, not
// a sensitive action worth signing/token-protecting.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const preference = (url.searchParams.get("preference") || "").trim().toLowerCase();

  if (!email || !(VALID_PREFERENCES as readonly string[]).includes(preference)) {
    return page("This unsubscribe link is invalid.");
  }

  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("preferences")
    .eq("email", email)
    .maybeSingle();

  if (!existing) {
    return page("You're not subscribed to Prowess Digital Solutions emails.");
  }

  const preferences = { ...(existing.preferences || {}), [preference]: false };
  await supabase.from("newsletter_subscribers").update({ preferences, updated_at: new Date().toISOString() }).eq("email", email);

  return page(`You've been unsubscribed from ${preference.replace("_", " ")} emails. You can resubscribe any time from prowessdigitalsolutions.com.`);
}
