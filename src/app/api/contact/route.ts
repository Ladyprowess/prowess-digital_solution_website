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

    const full_name = String(body?.full_name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const phone = String(body?.phone || "").trim();
    const business_stage = String(body?.business_stage || "").trim();
    const inquiry_type = String(body?.inquiry_type || "").trim();
    const message = String(body?.message || "").trim();

    // Honeypot
    const company_site = String(body?.company_site || "").trim();
    if (company_site) return NextResponse.json({ ok: true });

    if (!full_name || !email || !email.includes("@") || !inquiry_type || !message) {
      return NextResponse.json(
        { ok: false, error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    // 1) Save message (optional but recommended)
    const { error: insertError } = await supabase.from("contact_messages").insert([
      {
        full_name,
        email,
        phone: phone || null,
        business_stage: business_stage || null,
        inquiry_type,
        message,
        source: "website",
      },
    ]);

    if (insertError) {
      console.error("CONTACT INSERT ERROR:", insertError);
    
      // Don't block email sending just because DB failed
      // We continue to send email so you still receive the message.
    }
    

    // 2) Send Resend template (same style as event)
    const { error: mailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [process.env.RESEND_TO!, email],
      replyTo: email,
      subject: `New contact message — ${inquiry_type}`,
      template: {
        id: "contact", // ✅ your template slug (same style as event-sub)
        variables: {
          full_name,
          email,
          phone: phone || "",
          business_stage: business_stage || "",
          inquiry_type,
          message,
          source: "website",
        },
      },
    });

    if (mailError) {
      return NextResponse.json(
        { ok: false, error: mailError.message || "Email failed to send." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Message failed. Try again." },
      { status: 500 }
    );
  }
}
