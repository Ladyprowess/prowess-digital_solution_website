import { NextResponse } from "next/server";
import { resend } from "@/lib/resendClient";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";


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
    body: "You're subscribed to updates from the Prowess Digital Solutions job board.",
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
    // keywords) - optional, and only ever sent by a filter-aware alerts
    // form. Namespaced by filterKey ("jobs" | "opportunities", defaulting
    // to "jobs" to match what was already written before this namespacing
    // existed) so submitting a jobs alert and an opportunities alert for
    // the same email doesn't overwrite one with the other - each content
    // type keeps its own saved search under the same jsonb column. A plain
    // "just email me" signup (e.g. the navbar modal) never sends `filters`
    // at all, so the existing object is carried forward untouched.
    const existingFilters: Record<string, unknown> = (existing?.filters && typeof existing.filters === "object" && !Array.isArray(existing.filters))
      ? existing.filters
      : {};
    const filterKey = body?.filterKey ? String(body.filterKey) : "jobs";
    const filters = body?.filters && typeof body.filters === "object" && !Array.isArray(body.filters)
      ? { ...existingFilters, [filterKey]: body.filters }
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
      const delivery = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: copy.subject,
        html: `<p>${copy.body}</p>${extra}<p>Manage your updates:</p><ul>${newlyAddedPreferences.map(preference => `<li><a href="https://prowessdigitalsolutions.com/api/subscribe/unsubscribe?email=${encodeURIComponent(email)}&amp;preference=${preference}">Unsubscribe from ${preference.replace(/_/g, ' ')}</a></li>`).join('')}</ul>`,
      });
      return NextResponse.json({ ok: true, confirmationSent: !delivery.error });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Subscription failed. Try again." },
      { status: 500 }
    );
  }
}
