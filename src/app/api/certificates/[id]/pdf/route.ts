import { NextResponse } from "next/server";
import React from "react";
import fs from "fs";
import path from "path";
import { Document, Page, Text, View, Image, StyleSheet, Font, pdf } from "@react-pdf/renderer";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://prowessdigitalsolutions.com";
const BRAND = "#507c80";
const el = React.createElement;

// The authorized signature graphic (trimmed to its own bounding box,
// near-white keyed to transparent - see the one-off processing note in
// public/signature.png's history) sits above the printed name, same
// "sign above the line" convention as a physical certificate. Read once
// at module load, not per-request - this file never changes at runtime.
const SIGNATURE_PATH = path.join(process.cwd(), "public", "signature.png");
const SIGNATURE_BUFFER = fs.existsSync(SIGNATURE_PATH) ? fs.readFileSync(SIGNATURE_PATH) : null;
// Matches the actual trimmed asset's aspect ratio (461x203) so the image
// is never stretched/distorted.
const SIGNATURE_WIDTH = 55;
const SIGNATURE_HEIGHT = 24;

// A serif display face just for the learner's name and course title - the
// two "hero" elements - so the certificate reads as a formal document
// rather than a plain Helvetica notice. Everything else (brand name,
// labels, footer meta) stays on Helvetica, react-pdf's always-available
// built-in, so a font-fetch hiccup only ever softens two lines, never
// breaks the whole render.
Font.register({
  family: "Playfair Display",
  fonts: [
    { src: "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKebukDQ.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiukDQ.ttf", fontWeight: 700 },
  ],
});

function safeText(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

const styles = StyleSheet.create({
  page: { padding: 20, fontFamily: "Helvetica", color: "#111827" },
  outerFrame: { flex: 1, borderWidth: 2, borderColor: BRAND, borderStyle: "solid", padding: 8 },
  innerFrame: { flex: 1, borderWidth: 0.75, borderColor: "#c9d6d5", borderStyle: "solid", padding: 32, alignItems: "center", justifyContent: "center", textAlign: "center" },
  brandName: { fontSize: 12, fontWeight: 800, color: BRAND, textTransform: "uppercase", letterSpacing: 1.5 },
  eyebrow: { marginTop: 28, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 3 },
  learnerName: { marginTop: 14, fontFamily: "Playfair Display", fontWeight: 700, fontSize: 38, color: "#111827" },
  body: { marginTop: 16, fontSize: 12, color: "#374151" },
  courseTitle: { marginTop: 6, fontFamily: "Playfair Display", fontWeight: 600, fontSize: 20, color: BRAND },
  footerRow: {
    marginTop: 40, paddingTop: 16, borderTopWidth: 0.75, borderTopColor: "#e5e7eb", borderTopStyle: "solid",
    width: "100%", flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
  },
  signatureBlock: { flex: 1, alignItems: "flex-start", textAlign: "left" },
  signatureImage: { width: SIGNATURE_WIDTH, height: SIGNATURE_HEIGHT, objectFit: "contain" },
  signatureLine: { width: 150, borderTopWidth: 0.75, borderTopColor: "#9ca3af", borderTopStyle: "solid", paddingTop: 4 },
  signatureName: { fontFamily: "Playfair Display", fontWeight: 600, fontSize: 13, color: "#111827" },
  signatureCaption: { marginTop: 2, fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 },
  metaBlock: { flex: 1, alignItems: "flex-end", textAlign: "right" },
  meta: { fontSize: 9, color: "#6b7280" },
  metaRow: { marginTop: 3 },
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
      el(
        View,
        { style: styles.outerFrame },
        el(
          View,
          { style: styles.innerFrame },
          el(Text, { style: styles.brandName }, "Prowess Digital Solutions"),
          el(Text, { style: styles.eyebrow }, "Certificate of Completion"),
          el(Text, { style: styles.learnerName }, safeText(data.learner_name)),
          el(Text, { style: styles.body }, "has successfully completed"),
          el(Text, { style: styles.courseTitle }, safeText(data.course_title)),
          el(
            View,
            { style: styles.footerRow },
            el(
              View,
              { style: styles.signatureBlock },
              SIGNATURE_BUFFER && el(Image, { style: styles.signatureImage, src: SIGNATURE_BUFFER }),
              el(
                View,
                { style: styles.signatureLine },
                el(Text, { style: styles.signatureName }, "Prowess Digital Solutions"),
                el(Text, { style: styles.signatureCaption }, "Issuing Organization")
              )
            ),
            el(
              View,
              { style: styles.metaBlock },
              el(Text, { style: styles.meta }, `Issued ${issuedDate}`),
              el(Text, { style: [styles.meta, styles.metaRow] }, `Verification code: ${data.verification_code}`),
              el(Text, { style: [styles.meta, styles.metaRow] }, verifyUrl)
            )
          )
        )
      )
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
