import { NextResponse } from "next/server";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Link as PdfLink, pdf } from "@react-pdf/renderer";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";

export const runtime = "nodejs";

const BRAND = "#507c80";
const el = React.createElement;

function safeText(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

const styles = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 44, paddingHorizontal: 44, fontFamily: "Helvetica", color: "#111827", fontSize: 10.5, lineHeight: 1.5 },
  name: { fontSize: 22, fontWeight: 800, color: BRAND },
  headline: { marginTop: 4, fontSize: 12, color: "#374151" },
  divider: { marginTop: 14, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", borderBottomStyle: "solid" },
  section: { marginTop: 16 },
  h2: { fontSize: 11.5, fontWeight: 800, color: BRAND, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  paragraph: { textAlign: "justify" },
  project: { marginBottom: 12 },
  projectTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  projectTitle: { fontSize: 11.5, fontWeight: 700 },
  projectRole: { fontSize: 10, color: "#374151", marginTop: 1 },
  projectDesc: { marginTop: 3, fontSize: 10 },
  projectLink: { marginTop: 3, fontSize: 9.5, color: BRAND },
  tagsRow: { marginTop: 3, fontSize: 9, color: "#6b7280" },
});

type Project = { title: string; role?: string; description?: string; link?: string; tags?: string[] };
type PortfolioData = { full_name: string; headline: string; bio: string; projects: Project[] };

function PortfolioPdf(data: PortfolioData) {
  return el(
    Document,
    null,
    el(
      Page,
      { size: "A4", style: styles.page },
      el(Text, { style: styles.name }, safeText(data.full_name)),
      data.headline && el(Text, { style: styles.headline }, safeText(data.headline)),
      el(View, { style: styles.divider }),

      data.bio && el(
        View,
        { style: styles.section },
        el(Text, { style: styles.h2 }, "About"),
        el(Text, { style: styles.paragraph }, safeText(data.bio))
      ),

      data.projects.length > 0 && el(
        View,
        { style: styles.section },
        el(Text, { style: styles.h2 }, "Projects"),
        ...data.projects.map((p, i) =>
          el(
            View,
            { key: i, style: styles.project },
            el(
              View,
              { style: styles.projectTitleRow },
              el(Text, { style: styles.projectTitle }, safeText(p.title)),
            ),
            p.role && el(Text, { style: styles.projectRole }, safeText(p.role)),
            p.description && el(Text, { style: styles.projectDesc }, safeText(p.description)),
            p.link && el(PdfLink, { style: styles.projectLink, src: p.link }, safeText(p.link)),
            p.tags && p.tags.length > 0 && el(Text, { style: styles.tagsRow }, p.tags.map(safeText).join("  ·  "))
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
    const portfolioId = body?.portfolioId as string | undefined;
    if (!portfolioId) {
      return NextResponse.json({ ok: false, error: "portfolioId is required." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Ownership check, same as CV Builder's PDF route - grandfathering
    // applies here too: exporting a portfolio you already made never
    // requires currently-active access, only creating a new one does (see
    // the save route).
    const { data: portfolio, error } = await supabase
      .from("member_portfolios")
      .select("full_name, headline, bio, projects")
      .eq("id", portfolioId)
      .eq("user_id", member.id)
      .maybeSingle();

    if (error || !portfolio) {
      return NextResponse.json({ ok: false, error: "Portfolio not found." }, { status: 403 });
    }

    const doc = PortfolioPdf(portfolio as PortfolioData);
    const buffer = await pdf(doc).toBuffer();
    const fileName = `${(portfolio.full_name || "Portfolio").replace(/[^a-z0-9]+/gi, "_")}_Portfolio.pdf`;

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
