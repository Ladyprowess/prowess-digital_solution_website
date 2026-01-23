import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Enter a valid email" }, { status: 400 });
    }

    // Create table if you want:
    // public.event_subscribers (id uuid, email text unique, created_at timestamptz)
    await supabase.from("event_subscribers").insert([{ email }]);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!, // e.g. "Prowess <hello@yourdomain.com>"
      to: email,
      subject: "You’re subscribed to Prowess Events",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Welcome!</h2>
          <p>You’ll now get updates about new events, early-bird offers, and useful business guidance.</p>
          <p>— Prowess Digital Solutions</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Subscription failed" },
      { status: 500 }
    );
  }
}
