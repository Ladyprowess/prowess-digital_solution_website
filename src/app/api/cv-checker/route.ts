import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { cvAdminEmail, cvCustomerEmail } from "@/lib/emails/cvChecker";
import { resend } from "@/lib/resendClient";
import { verifyMember } from "@/lib/auth/verifyMember";
import { hasPremiumAccess } from "@/lib/payments/premiumMembership";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

export async function GET(req: Request) {
  const member = await verifyMember(req);
  if (!member) return NextResponse.json({ ok: false }, { status: 401 });
  const hasAccess = await hasPremiumAccess({ userId: member.id, email: member.email });
  return NextResponse.json({ ok: true, hasAccess });
}
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

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

    const hasAccess = await hasPremiumAccess({ userId: member.id, email: member.email });
    if (!hasAccess) {
      return NextResponse.json({ ok: false, error: "Please activate Premium before submitting your CV." }, { status: 403 });
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

    if (!fullName || fullName.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !targetRole || targetRole.length > 200 || !careerLevel || careerLevel.length > 100 || reviewFocus.length > 5000 || phone.length > 60 || !(file instanceof File) || !file.size) {
      return NextResponse.json({ ok: false, error: "Please fill in the required fields and upload your CV." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "CV is too large. Maximum size is 5 MB." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ ok: false, error: "CV must be a PDF or Word document." }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.RESEND_TO;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!adminEmail || !fromEmail || !process.env.RESEND_API_KEY) {
      return NextResponse.json({ ok: false, error: "CV submissions are temporarily unavailable. Please try again later." }, { status: 503 });
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

    const submission = { fullName, email, phone, targetRole, careerLevel, reviewFocus, fileName: file.name, fileSize: file.size };
    // The submission is already stored. Delivery failure must not ask for a duplicate upload.
    const [adminDelivery, customerDelivery] = await Promise.allSettled([
      resend.emails.send({ from: fromEmail, to: adminEmail, replyTo: email, ...cvAdminEmail(submission, signed?.signedUrl || null) }),
      resend.emails.send({ from: fromEmail, to: email, replyTo: adminEmail, ...cvCustomerEmail(submission) }),
    ]);
    const adminNotified = adminDelivery.status === 'fulfilled' && !adminDelivery.value.error;
    const confirmationSent = customerDelivery.status === 'fulfilled' && !customerDelivery.value.error;
    if (!adminNotified || !confirmationSent) console.error('CV submission stored; email delivery needs attention', { adminNotified, confirmationSent });
    return NextResponse.json({ ok: true, adminNotified, confirmationSent });
  } catch {
    return NextResponse.json({ ok: false, error: "CV submission failed. Please try again." }, { status: 500 });
  }
}
