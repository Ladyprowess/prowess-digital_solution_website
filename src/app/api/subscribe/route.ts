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
      return NextResponse.json({ ok: false, error: "Enter a valid email" }, { status: 400 });
    }

    // 1) Save to Supabase (ignore duplicate emails)
    const { error: insertError } = await supabase
      .from("event_subscribers")
      .insert([{ email }]);

    // If it's a duplicate email, don't fail the whole request
    // Supabase/Postgres duplicate error code is usually 23505
    if (insertError && (insertError as any).code !== "23505") {
      return NextResponse.json(
        { ok: false, error: insertError.message || "Could not save subscriber" },
        { status: 500 }
      );
    }

    // 2) Send your Resend TEMPLATE (the one in your screenshot)
    const from = process.env.RESEND_FROM_EMAIL!;
    if (!from) {
      return NextResponse.json(
        { ok: false, error: "Missing RESEND_FROM_EMAIL in env." },
        { status: 500 }
      );
    }

    const { error: emailError } = await resend.emails.send({
      from,
      to: email,
      subject: "You’re subscribed to Prowess Digital Solutions events",
      template: {
        id: "event-sub", // ✅ template alias from your Resend screenshot
        variables: {},   // add variables later if you create them in Resend
      },
    });

    if (emailError) {
      return NextResponse.json({ ok: false, error: emailError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Subscription failed" },
      { status: 500 }
    );
  }
}
