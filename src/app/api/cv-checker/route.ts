import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resendClient";
import { verifyMember } from "@/lib/auth/verifyMember";
import { hasCareerToolAccess } from "@/lib/payments/careerTools";
import { hasPremiumAccess } from "@/lib/payments/premiumMembership";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fileExt(type: string) {
  if (type === "application/pdf") return "pdf";
  if (type.includes("wordprocessingml")) return "docx";
  return "doc";
}

export async function POST(req: Request) {
  try {
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    const hasAccess = await hasCareerToolAccess({ userId: member.id, email: member.email }, "cv_checker")
      || await hasPremiumAccess({ userId: member.id, email: member.email });
    if (!hasAccess) {
      return NextResponse.json({ ok: false, error: "Please activate Basic, Premium or Pro career access before submitting your CV." }, { status: 403 });
    }

    const formData = await req.formData();

    const honeypot = String(formData.get("website") || "").trim();
    if (honeypot) return NextResponse.json({ ok: true });

    const fullName = String(formData.get("full_name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const phone = String(formData.get("phone") || "").trim();
    const targetRole = String(formData.get("target_role") || "").trim();
    const careerLevel = String(formData.get("career_level") || "").trim();
    const reviewFocus = String(formData.get("review_focus") || "").trim();
    const file = formData.get("cv") as File | null;

    if (!fullName || !email || !email.includes("@") || !targetRole || !careerLevel || !file) {
      return NextResponse.json({ ok: false, error: "Please fill in the required fields and upload your CV." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "CV is too large. Maximum size is 5 MB." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ ok: false, error: "CV must be a PDF or Word document." }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const safeEmail = email.replace(/[^a-z0-9@._-]/g, "");
    const path = `cv-checker/${safeEmail}/${Date.now()}-cv.${fileExt(file.type)}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });
    }

    const { data: signed } = await supabase.storage
      .from("cvs")
      .createSignedUrl(path, 60 * 60 * 24 * 7);

    const { error: insertError } = await supabase
      .from("cv_checker_submissions")
      .insert({
        full_name: fullName,
        email,
        phone: phone || null,
        target_role: targetRole,
        career_level: careerLevel,
        review_focus: reviewFocus || null,
        cv_file_path: path,
        cv_file_name: file.name,
        cv_file_type: file.type,
        cv_file_size: file.size,
        status: "submitted",
        source: "tools_page",
        user_id: member.id,
      });

    if (insertError) {
      await supabase.storage.from("cvs").remove([path]);
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.RESEND_TO;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (adminEmail && fromEmail) {
      await resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        replyTo: email,
        subject: `New CV checker submission: ${fullName}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0b1b1d;">
            <h2 style="margin:0 0 12px;">New CV checker submission</h2>
            <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(phone || "-")}</p>
            <p><strong>Target role:</strong> ${escapeHtml(targetRole)}</p>
            <p><strong>Career level:</strong> ${escapeHtml(careerLevel)}</p>
            <p><strong>Review focus:</strong><br/>${escapeHtml(reviewFocus || "General CV review")}</p>
            <p><strong>File:</strong> ${escapeHtml(file.name)} (${Math.round(file.size / 1024)} KB)</p>
            ${signed?.signedUrl ? `<p><a href="${signed.signedUrl}">Open CV file</a></p>` : ""}
            <p style="font-size:12px;color:#496167;">Signed file links expire after 7 days.</p>
          </div>
        `,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "CV submission failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
