import { escapeEmail } from "@/lib/payments/emailEscape";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resendClient";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { source, email, scorePercent, checkedCount, totalItems } = await req.json();

    if (!source || !email) {
      return NextResponse.json({ ok: false, error: "Missing source or email" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { error } = await supabase.from("leads").insert({
      source,
      email,
      score_percent: scorePercent ?? null,
      checked_count: checkedCount ?? null,
      total_items: totalItems ?? null,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: "Could not save lead" }, { status: 500 });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
    if (fromEmail && adminEmail) {
      await resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: `New lead: ${escapeEmail(source)}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>New lead from ${escapeEmail(source)}</h2>
            <p><b>Email:</b> ${escapeEmail(email)}</p>
            <p><b>Score:</b> ${escapeEmail(scorePercent ?? "-")}% (${escapeEmail(checkedCount ?? "-")} of ${escapeEmail(totalItems ?? "-")})</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}
