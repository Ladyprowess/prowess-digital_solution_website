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
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    // 1️⃣ Try inserting directly
    const { error: insertError } = await supabase
      .from("event_subscribers")
      .insert([{ email }]);

    // 2️⃣ Handle duplicate email
    if (insertError) {
      if ((insertError as any).code === "23505") {
        return NextResponse.json(
          { ok: false, error: "This email is already subscribed." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { ok: false, error: "Could not save subscription." },
        { status: 500 }
      );
    }

    // 3️⃣ Send Resend TEMPLATE (only once)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: "You’re subscribed to Prowess Digital Solutions events",
      template: {
        id: "event-sub", // ✅ your template ID
        variables: {},
      },
    });

    return NextResponse.json({ ok: true });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Subscription failed. Try again." },
      { status: 500 }
    );
  }
}
