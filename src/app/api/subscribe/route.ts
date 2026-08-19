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
  general: {
    subject: "You're subscribed to Prowess Digital Solutions updates",
    body: "We'll keep you posted on new jobs, opportunities and updates from Prowess Digital Solutions.",
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    const rawPreference = String(body?.preference || "general").trim().toLowerCase();
    const preference: Preference = (VALID_PREFERENCES as readonly string[]).includes(rawPreference)
      ? (rawPreference as Preference)
      : "general";
    const source = body?.source ? String(body.source).slice(0, 100) : null;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const { data: existing, error: lookupError } = await supabase
      .from("newsletter_subscribers")
      .select("preferences")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json(
        { ok: false, error: "Could not save subscription." },
        { status: 500 }
      );
    }

    const existingPreferences: Record<string, boolean> = existing?.preferences ?? {};
    const alreadyHadPreference = existingPreferences[preference] === true;
    const mergedPreferences = { ...existingPreferences, [preference]: true };

    const { error: upsertError } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        { email, preferences: mergedPreferences, source, updated_at: new Date().toISOString() },
        { onConflict: "email" }
      );

    if (upsertError) {
      return NextResponse.json(
        { ok: false, error: "Could not save subscription." },
        { status: 500 }
      );
    }

    // Only send a confirmation email the first time someone opts into this
    // particular preference, not on every repeat signup for it.
    if (!alreadyHadPreference) {
      const copy = CONFIRMATIONS[preference];
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: copy.subject,
        html: `<p>${copy.body}</p>`,
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
