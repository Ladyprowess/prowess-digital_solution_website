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
        { ok: false, error: "Enter a valid email" },
        { status: 400 }
      );
    }

    // 1️⃣ Insert subscriber
    const { error: insertError } = await supabase
      .from("event_subscribers")
      .insert([{ email }]);

    // Detect duplicate email
    const isDuplicate = (insertError as any)?.code === "23505";

    // Any DB error that is NOT duplicate → fail
    if (insertError && !isDuplicate) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    // 2️⃣ Send Resend TEMPLATE (only for new subscribers)
    if (!isDuplicate) {
      const from = process.env.RESEND_FROM_EMAIL!;
      if (!from) {
        return NextResponse.json(
          { ok: false, error: "Missing RESEND_FROM_EMAIL" },
          { status: 500 }
        );
      }

      const { error: emailError } = await resend.emails.send({
        from,
        to: email,
        subject: "You’re subscribed to Prowess Digital Solutions events",
        template: {
          id: "event-sub", // ✅ YOUR TEMPLATE ID
          variables: {},   // add later if needed
        },
      });

      if (emailError) {
        return NextResponse.json(
          { ok: false, error: emailError.message },
          { status: 500 }
        );
      }
    }

    // 3️⃣ Always return success
    return NextResponse.json({
      ok: true,
      already_subscribed: isDuplicate,
    });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Subscription failed" },
      { status: 500 }
    );
  }
}
