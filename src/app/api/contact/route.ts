import { contactAdminEmail, contactCustomerEmail } from "@/lib/emails/contact";
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
    const source = body?.source === "business_diagnostic" ? "business_diagnostic" : "website";

    // Honeypot
    const company_site = String(body?.company_site || body?.website || "").trim();
    if (company_site) return NextResponse.json({ ok: true });

    if (!full_name || !email || !email.includes("@") || !inquiry_type || !message) {
      return NextResponse.json(
        { ok: false, error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    if (full_name.length > 200 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.length > 50 || business_stage.length > 100 || inquiry_type.length > 200 || message.length > 10000 || (source === "business_diagnostic" && inquiry_type !== "Business Structure Diagnostic")) {
      return NextResponse.json({ ok: false, error: "Please check your contact details and shorten any unusually long fields." }, { status: 400 });
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
        source,
      },
    ]);

    if (insertError) {
      console.error("CONTACT INSERT ERROR:", insertError);
    
      // Don't block email sending just because DB failed
      // We continue to send email so you still receive the message.
    }
    

    const enquiry = { full_name, email, phone, business_stage, inquiry_type, message, source } as const;
    // Separate recipients: clients receive an acknowledgement, not the internal notification.
    const { error: mailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: process.env.RESEND_TO!,
      replyTo: email,
      ...contactAdminEmail(enquiry),
    });

    if (mailError) {
      return NextResponse.json(
        { ok: false, error: mailError.message || "Email failed to send." },
        { status: 500 }
      );
    }

    // The enquiry is already delivered. A receipt failure must not encourage duplicate submissions.
    try {
      const { error: receiptError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        replyTo: process.env.RESEND_TO!,
        ...contactCustomerEmail(enquiry),
      });
      if (receiptError) console.error("Contact acknowledgement delivery failed");
    } catch {
      console.error("Contact acknowledgement delivery failed");
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Message failed. Try again." },
      { status: 500 }
    );
  }
}
