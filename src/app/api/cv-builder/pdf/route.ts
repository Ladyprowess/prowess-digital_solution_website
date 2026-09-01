import { NextResponse } from "next/server";
import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { validateCvData, type CVData } from "@/lib/cvBuilder/validate";
import { isFreeCvTemplate, isKnownCvTemplate } from "@/lib/cvBuilder/templates";
import { hasPremiumAccess } from "@/lib/payments/premiumMembership";

export const runtime = "nodejs";

const BRAND = "#507c80";
const el = React.createElement;

const TEMPLATE_THEMES: Record<string, { accent: string; nameSize: number; dividerWidth: number; align: "left" | "center"; fontFamily: "Helvetica" | "Times-Roman"; sectionCase?: "uppercase" }> = {
  plain: { accent: BRAND, nameSize: 22, dividerWidth: 1, align: "left", fontFamily: "Helvetica", sectionCase: "uppercase" },
  modern: { accent: "#315f63", nameSize: 24, dividerWidth: 2, align: "left", fontFamily: "Helvetica", sectionCase: "uppercase" },
  executive: { accent: "#24383a", nameSize: 23, dividerWidth: 1, align: "center", fontFamily: "Times-Roman", sectionCase: "uppercase" },
  compact: { accent: "#507c80", nameSize: 19, dividerWidth: 1, align: "left", fontFamily: "Helvetica", sectionCase: "uppercase" },
  creative: { accent: "#6c7d4f", nameSize: 24, dividerWidth: 2, align: "left", fontFamily: "Helvetica" },
  tech: { accent: "#3f6f68", nameSize: 22, dividerWidth: 1, align: "left", fontFamily: "Helvetica", sectionCase: "uppercase" },
  academic: { accent: "#40565a", nameSize: 21, dividerWidth: 1, align: "center", fontFamily: "Times-Roman", sectionCase: "uppercase" },
  graduate: { accent: "#5f7b80", nameSize: 23, dividerWidth: 1, align: "left", fontFamily: "Helvetica" },
  consulting: { accent: "#2f595d", nameSize: 22, dividerWidth: 2, align: "left", fontFamily: "Helvetica", sectionCase: "uppercase" },
};

function safeText(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

function dateRange(startDate: string, endDate: string, current: boolean): string {
  const start = safeText(startDate);
  const end = current ? "Present" : safeText(endDate);
  if (!start && !end) return "";
  return [start, end].filter(Boolean).join(" - ");
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 44,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    color: "#111827",
    fontSize: 10.5,
    lineHeight: 1.5,
  },
  name: {
    fontSize: 22,
    fontWeight: 800,
    color: BRAND,
  },
  headline: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
  },
  contactRow: {
    marginTop: 6,
    fontSize: 9.5,
    color: "#6b7280",
  },
  divider: {
    marginTop: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
  },
  section: {
    marginTop: 16,
  },
  h2: {
    fontSize: 11.5,
    fontWeight: 800,
    color: BRAND,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  paragraph: {
    textAlign: "justify",
  },
  entryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  entryTitle: {
    fontSize: 11,
    fontWeight: 700,
  },
  entrySubtitle: {
    fontSize: 10,
    color: "#374151",
    marginTop: 1,
  },
  entryDates: {
    fontSize: 9.5,
    color: "#6b7280",
  },
  entry: {
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: "row",
    marginTop: 3,
  },
  bulletDot: {
    width: 8,
    fontSize: 8.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
  },
  skillsText: {
    fontSize: 10,
  },
});

function CvPdf(data: CVData, template: string) {
  const { personalInfo, summary, experience, education, skills, highlights = [], extras = [] } = data;
  const theme = TEMPLATE_THEMES[template] || TEMPLATE_THEMES.plain;

  const contactParts = [personalInfo.location, personalInfo.phone, personalInfo.email, personalInfo.linkedin, personalInfo.website]
    .map(safeText)
    .filter(Boolean);

  return el(
    Document,
    null,
    el(
      Page,
      { size: "A4", style: [styles.page, { fontFamily: theme.fontFamily }] },
      el(Text, { style: [styles.name, { color: theme.accent, fontSize: theme.nameSize, textAlign: theme.align }] }, safeText(personalInfo.fullName)),
      personalInfo.headline && el(Text, { style: [styles.headline, { color: theme.accent, textAlign: theme.align }] }, safeText(personalInfo.headline)),
      contactParts.length > 0 && el(Text, { style: [styles.contactRow, { textAlign: theme.align }] }, contactParts.join("  ·  ")),
      el(View, { style: [styles.divider, { borderBottomColor: theme.accent, borderBottomWidth: theme.dividerWidth }] }),

      summary && el(
        View,
        { style: styles.section },
        el(Text, { style: [styles.h2, { color: theme.accent, textTransform: theme.sectionCase }] }, "Summary"),
        el(Text, { style: styles.paragraph }, safeText(summary))
      ),

      highlights.length > 0 && el(
        View,
        { style: styles.section },
        el(Text, { style: [styles.h2, { color: theme.accent, textTransform: theme.sectionCase }] }, "Highlights"),
        el(Text, { style: styles.skillsText }, highlights.map(safeText).filter(Boolean).join("  ·  "))
      ),

      experience.length > 0 && el(
        View,
        { style: styles.section },
        el(Text, { style: [styles.h2, { color: theme.accent, textTransform: theme.sectionCase }] }, "Experience"),
        ...experience.map((exp, i) =>
          el(
            View,
            { key: i, style: styles.entry },
            el(
              View,
              { style: styles.entryHeaderRow },
              el(
                View,
                null,
                el(Text, { style: styles.entryTitle }, safeText(exp.title)),
                el(Text, { style: styles.entrySubtitle }, safeText(exp.company))
              ),
              el(Text, { style: styles.entryDates }, dateRange(exp.startDate, exp.endDate, exp.current))
            ),
            ...exp.bullets.map((b, bi) =>
              el(
                View,
                { key: bi, style: styles.bulletRow },
                el(Text, { style: [styles.bulletDot, { color: theme.accent }] }, "•"),
                el(Text, { style: styles.bulletText }, safeText(b))
              )
            )
          )
        )
      ),

      education.length > 0 && el(
        View,
        { style: styles.section },
        el(Text, { style: [styles.h2, { color: theme.accent, textTransform: theme.sectionCase }] }, "Education"),
        ...education.map((edu, i) =>
          el(
            View,
            { key: i, style: styles.entry },
            el(
              View,
              { style: styles.entryHeaderRow },
              el(
                View,
                null,
                el(Text, { style: styles.entryTitle }, [safeText(edu.degree), safeText(edu.field)].filter(Boolean).join(", ")),
                el(Text, { style: styles.entrySubtitle }, safeText(edu.institution))
              ),
              el(Text, { style: styles.entryDates }, dateRange(edu.startDate, edu.endDate, false))
            )
          )
        )
      ),

      skills.length > 0 && el(
        View,
        { style: styles.section },
        el(Text, { style: [styles.h2, { color: theme.accent, textTransform: theme.sectionCase }] }, "Skills"),
        el(Text, { style: styles.skillsText }, skills.map(safeText).join("  ·  "))
      ),

      extras.length > 0 && el(
        View,
        { style: styles.section },
        el(Text, { style: [styles.h2, { color: theme.accent, textTransform: theme.sectionCase }] }, "Additional Information"),
        ...extras.map((item, i) =>
          el(
            View,
            { key: i, style: styles.bulletRow },
            el(Text, { style: [styles.bulletDot, { color: theme.accent }] }, "•"),
            el(Text, { style: styles.bulletText }, safeText(item))
          )
        )
      )
    )
  );
}

export async function POST(req: Request) {
  try {
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const cvId = body?.cvId as string | undefined;
    const requestedTemplate = body?.template as string | undefined;

    if (!cvId || !requestedTemplate) {
      return NextResponse.json({ ok: false, error: "cvId and template are required." }, { status: 400 });
    }
    // A template that isn't actually built can never be rendered, no
    // matter who's asking or what's saved on the row - this can only ever
    // trip if the save route's own matching check (or the picker UI) has a
    // bug letting an unbuilt template get stored in the first place, since
    // the save route now rejects an unknown template before it can ever
    // reach member_cvs.
    if (!isKnownCvTemplate(requestedTemplate)) {
      return NextResponse.json({ ok: false, error: "That template doesn't exist yet." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Ownership check: this row must belong to the caller. The client never
    // gets to hand over raw CV content here - only an id it's already
    // proven (via the save route) it owns.
    const { data: cv, error: cvErr } = await supabase
      .from("member_cvs")
      .select("*")
      .eq("id", cvId)
      .eq("user_id", member.id)
      .maybeSingle();

    if (cvErr || !cv) {
      return NextResponse.json({ ok: false, error: "CV not found." }, { status: 403 });
    }

    const validated = validateCvData(cv.data);
    if (!validated.ok) {
      return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
    }

    // Template entitlement: "plain" is always free. Re-exporting the exact
    // template already saved on this CV is always allowed too, even if the
    // member's Premium Membership has since lapsed or been cancelled -
    // access to something already made is never revoked, only the ability
    // to create/switch to something new premium is gated. Only a genuine
    // switch to a different, non-plain template at export time requires
    // active access right now.
    if (!isFreeCvTemplate(requestedTemplate) && requestedTemplate !== cv.template) {
      const active = await hasPremiumAccess({ userId: member.id, email: member.email });
      if (!active) {
        return NextResponse.json({ ok: false, error: "Upgrade to Premium Membership to use this template." }, { status: 403 });
      }
    }

    const doc = CvPdf(validated.data, requestedTemplate);
    const buffer = await pdf(doc).toBuffer();

    const fileName = `${(validated.data.personalInfo.fullName || "CV").replace(/[^a-z0-9]+/gi, "_")}_CV.pdf`;

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
