import { NextResponse } from "next/server";
import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://prowessdigitalsolutions.com";
const BRAND = "#507c80";
const el = React.createElement;

function safeText(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

const styles = StyleSheet.create({
  page: { padding: 56, fontFamily: "Helvetica", color: "#111827", textAlign: "center" },
  brandName: { fontSize: 12, fontWeight: 800, color: BRAND, textTransform: "uppercase", letterSpacing: 1.5 },
  eyebrow: { marginTop: 40, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 2 },
  learnerName: { marginTop: 16, fontSize: 30, fontWeight: 800, color: "#111827" },
  body: { marginTop: 20, fontSize: 12, color: "#374151" },
  courseTitle: { marginTop: 8, fontSize: 18, fontWeight: 700, color: BRAND },
  divider: { marginTop: 36, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", borderBottomStyle: "solid" },
  meta: { fontSize: 9.5, color: "#6b7280" },
  metaRow: { marginTop: 4 },
});

type CertificateData = { learner_name: string; course_title: string; issued_at: string; verification_code: string };

function CertificatePdf(data: CertificateData) {
  const issuedDate = new Date(data.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const verifyUrl = `${SITE_URL}/certificates/verify/${data.verification_code}`;

  return el(
    Document,
    null,
    el(
      Page,
      { size: "A4", orientation: "landscape", style: styles.page },
      el(Text, { style: styles.brandName }, "Prowess Digital Solutions"),
      el(Text, { style: styles.eyebrow }, "Certificate of Completion"),
      el(Text, { style: styles.learnerName }, safeText(data.learner_name)),
      el(Text, { style: styles.body }, "has successfully completed"),
      el(Text, { style: styles.courseTitle }, safeText(data.course_title)),
      el(View, { style: styles.divider }),
      el(Text, { style: styles.meta }, `Issued ${issuedDate}`),
      el(Text, { style: [styles.meta, styles.metaRow] }, `Verification code: ${data.verification_code}`),
      el(Text, { style: [styles.meta, styles.metaRow] }, verifyUrl)
    )
  );
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    const supabase = supabaseAdmin();

    // Ownership check, same pattern as CV/Portfolio Builder's PDF routes -
    // scoped to this member's own certificate, not just existence.
    const { data: certificate, error } = await supabase
      .from("certificates")
      .select("learner_name, course_title, issued_at, verification_code")
      .eq("id", id)
      .eq("user_id", member.id)
      .maybeSingle();

    if (error || !certificate) {
      return NextResponse.json({ ok: false, error: "Certificate not found." }, { status: 403 });
    }

    const doc = CertificatePdf(certificate as CertificateData);
    const buffer = await pdf(doc).toBuffer();
    const fileName = `${(certificate.course_title || "Certificate").replace(/[^a-z0-9]+/gi, "_")}_Certificate.pdf`;

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF generation failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
