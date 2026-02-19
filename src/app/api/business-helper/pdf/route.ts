import { NextResponse } from "next/server";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Circle,
  Path,
  pdf,
} from "@react-pdf/renderer";



type ReportSection = {
  heading: string;
  paragraphs: string[];
};

type Result = {
  reportId?: string;
  generatedAt?: string;
  healthScore: number;
  healthLabel: "Strong" | "Fair" | "Needs attention" | "Critical";
  scoreNote: string;
  reportTitle: string;
  sections: ReportSection[];
  disclaimer: string;
};

export const runtime = "nodejs";

const BRAND = "#507c80";
const el = React.createElement;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeText(s: any) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 44,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    color: "#111827",
    fontSize: 11.5,
    lineHeight: 1.6,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
  },

  brandBlock: {
    maxWidth: 360,
  },

  brandName: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: 0.2,
  },

  brandSub: {
    marginTop: 3,
    color: "#6b7280",
    fontSize: 10.5,
  },

  meta: {
    marginTop: 6,
    color: "#6b7280",
    fontSize: 9.5,
  },

  title: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: 800,
  },

  scoreNote: {
    marginTop: 10,
    textAlign: "justify",
  },

  section: {
    marginTop: 18,
  },

  h2: {
    fontSize: 12.5,
    fontWeight: 800,
    marginBottom: 7,
    marginTop: 2,
  },

  paragraph: {
    marginBottom: 8,
    textAlign: "justify",
  },

  footerDivider: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderTopStyle: "solid",
  },

  disclaimerTitle: {
    fontSize: 11.5,
    fontWeight: 800,
    marginBottom: 6,
  },

  disclaimerText: {
    color: "#4b5563",
    fontSize: 9.8,
    textAlign: "justify",
  },

  scoreWrap: {
    width: 88,
    height: 88,
    position: "relative",
  },

  scoreCenter: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 88,
    height: 88,
    justifyContent: "center",
    alignItems: "center",
  },

  scoreValue: {
    fontSize: 14,
    fontWeight: 900,
    color: BRAND,
  },

  scoreLabel: {
    marginTop: 2,
    fontSize: 8.5,
    color: "#6b7280",
  },
});

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function ScoreRing(score: number) {
  const normalized = clamp(score, 0, 100);

  const cx = 40;
  const cy = 40;
  const r = 28;

  const startAngle = 0; // we already rotate via polar conversion (-90 inside polarToCartesian)
  const endAngle = (normalized / 100) * 360;

  return el(
    View,
    { style: styles.scoreWrap },
    el(
      Svg,
      { width: 80, height: 80, viewBox: "0 0 80 80" },

      // Background track circle
      el(Circle, {
        cx: String(cx),
        cy: String(cy),
        r: String(r),
        stroke: "#e5e7eb",
        strokeWidth: 8,
        fill: "none",
      }),

      // Progress ring:
      // If 100%, draw full circle in BRAND (because a single arc can't draw a perfect 360°)
      normalized >= 100
        ? el(Circle, {
            cx: String(cx),
            cy: String(cy),
            r: String(r),
            stroke: BRAND,
            strokeWidth: 8,
            fill: "none",
          })
        : normalized <= 0
        ? null
        : el(Path, {
            d: describeArc(cx, cy, r, startAngle, endAngle),
            stroke: BRAND,
            strokeWidth: 8,
            fill: "none",
            strokeLinecap: "round",
          })
    ),

    // Centre text
    el(
      View,
      { style: styles.scoreCenter },
      el(Text, { style: styles.scoreValue }, `${Math.round(normalized)}%`),
      el(Text, { style: styles.scoreLabel }, "Health Score")
    )
  );
}



function ReportPDF(result: Result) {
  const generatedAt = result.generatedAt
    ? new Date(result.generatedAt).toLocaleString()
    : new Date().toLocaleString();

  const sectionNodes = (result.sections || []).map((sec, idx) => {
    const paras = (sec.paragraphs || []).map((p, pIdx) =>
      el(Text, { key: `${idx}-${pIdx}`, style: styles.paragraph }, safeText(p))
    );

    return el(
      View,
      { key: `${sec.heading}-${idx}`, style: styles.section },
      el(Text, { style: styles.h2 }, safeText(sec.heading)),
      ...paras
    );
  });

  return el(
    Document,
    null,
    el(
      Page,
      { size: "A4", style: styles.page },
      // Header
      el(
        View,
        { style: styles.headerRow },
        el(
          View,
          { style: styles.brandBlock },
          el(Text, { style: styles.brandName }, "Prowess Digital Solutions"),
          el(Text, { style: styles.brandSub }, "Business Diagnostic Report"),
          el(Text, { style: styles.meta }, `Generated on ${generatedAt}`)
        ),
        ScoreRing(result.healthScore)
      ),

      // Title + note
      el(Text, { style: styles.title }, safeText(result.reportTitle)),
      el(Text, { style: styles.scoreNote }, safeText(result.scoreNote)),

      // Sections
      ...sectionNodes,

      // Disclaimer
      el(
        View,
        { style: styles.footerDivider },
        el(Text, { style: styles.disclaimerTitle }, "Disclaimer"),
        el(Text, { style: styles.disclaimerText }, safeText(result.disclaimer))
      )
    )
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { result?: Result };

    const result = body?.result;
    if (!result || !result.reportTitle || !Array.isArray(result.sections)) {
      return NextResponse.json(
        { error: "Invalid payload. Missing result.reportTitle or result.sections." },
        { status: 400 }
      );
    }

    const doc = ReportPDF(result);
    const buffer = await pdf(doc).toBuffer();

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Prowess_Business_Diagnostic_Report.pdf"',
      },
    });

    
  } catch (e: any) {
    console.error("PDF ROUTE ERROR:", e?.message || e);
    return NextResponse.json(
      { error: e?.message || "PDF generation failed" },
      { status: 500 }
    );
  }
}