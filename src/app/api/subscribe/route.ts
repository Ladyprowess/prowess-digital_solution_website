import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_PREFERENCES = [
  "jobs",
  "internships",
  "grants",
  "scholarships",
  "events",
  "courses",
  "career_resources",
  "business",
  "general",
] as const;
type Preference = (typeof VALID_PREFERENCES)[number];

const CONFIRMATIONS: Record<Preference, { subject: string; body: string }> = {
  jobs: {
    subject: "You're on the Prowess Digital Solutions job alert list",
    body: "We'll email you the moment the Prowess Digital Solutions job board goes live, and whenever new jobs are added.",
  },
  internships: {
    subject: "You're subscribed to Prowess Digital Solutions internship alerts",
    body: "We'll email you as new internships are added to Prowess Digital Solutions.",
  },
  grants: {
    subject: "You're subscribed to Prowess Digital Solutions grant alerts",
    body: "We'll email you as new grants and funding opportunities are added to Prowess Digital Solutions.",
  },
  scholarships: {
    subject: "You're subscribed to Prowess Digital Solutions scholarship alerts",
    body: "We'll email you as new scholarships are added to Prowess Digital Solutions.",
  },
  events: {
    subject: "You're subscribed to Prowess Digital Solutions events",
    body: "We'll email you about upcoming Prowess Digital Solutions events.",
  },
  courses: {
    subject: "You're subscribed to Prowess Digital Solutions course updates",
    body: "We'll email you when new Prowess Digital Solutions courses launch.",
  },
  career_resources: {
    subject: "You're subscribed to Prowess Digital Solutions career resources",
    body: "We'll email you new career guides, roadmaps and resources as they're published.",
  },
  business: {
    subject: "You're subscribed to Prowess Digital Solutions business updates",
    body: "We'll email you new business tools, resources and services as they're published.",
  },
  general: {
    subject: "You're subscribed to Prowess Digital Solutions updates",
    body: "We'll keep you posted on new jobs, opportunities and updates from Prowess Digital Solutions.",
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    const source = body?.source ? String(body.source).slice(0, 100) : null;

    // Accepts either a single `preference` (back-compat) or a `preferences`
    // array (for a multi-checkbox form like the homepage newsletter signup)
    // - both land in the same jsonb object in one write.
    const rawList: string[] = Array.isArray(body?.preferences)
      ? body.preferences
      : [body?.preference || "general"];
    const requestedPreferences = rawList
      .map((p) => String(p).trim().toLowerCase())
      .filter((p): p is Preference => (VALID_PREFERENCES as readonly string[]).includes(p));
    if (requestedPreferences.length === 0) requestedPreferences.push("general");

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const { data: existing, error: lookupError } = await supabase
      .from("newsletter_subscribers")
      .select("preferences, filters")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json(
        { ok: false, error: "Could not save subscription." },
        { status: 500 }
      );
    }

    const existingPreferences: Record<string, boolean> = existing?.preferences ?? {};
    const newlyAddedPreferences = requestedPreferences.filter((p) => existingPreferences[p] !== true);
    const mergedPreferences = { ...existingPreferences };
    for (const p of requestedPreferences) mergedPreferences[p] = true;

    // filters is a saved-search payload (category/skills/location/remote/
    // keywords) - optional, and only ever sent by the filter-aware alerts
    // form. A plain "just email me" signup (e.g. the navbar modal) never
    // sends it, so it must fall back to whatever was already saved rather
    // than being wiped out by an unrelated subscribe request.
    const filters = body?.filters && typeof body.filters === "object" && !Array.isArray(body.filters)
      ? body.filters
      : (existing?.filters ?? null);

    const { error: upsertError } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        { email, preferences: mergedPreferences, filters, source, updated_at: new Date().toISOString() },
        { onConflict: "email" }
      );

    if (upsertError) {
      return NextResponse.json(
        { ok: false, error: "Could not save subscription." },
        { status: 500 }
      );
    }

    // One confirmation email per request (not one per new preference), only
    // sent when at least one preference is genuinely new for this address.
    if (newlyAddedPreferences.length > 0) {
      const primary = newlyAddedPreferences[0] as Preference;
      const copy = CONFIRMATIONS[primary];
      const extra = newlyAddedPreferences.length > 1
        ? `<p>You're also signed up for: ${newlyAddedPreferences.slice(1).join(", ")}.</p>`
        : "";
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: copy.subject,
        html: `<p>${copy.body}</p>${extra}`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Subscription failed. Try again." },
      { status: 500 }
    );
  }
}
