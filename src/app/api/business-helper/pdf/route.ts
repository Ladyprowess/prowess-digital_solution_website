import { NextResponse } from "next/server";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Svg,
  Circle,
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeText(s: any) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Progress ring in PDF using SVG circles:
 * - background circle (grey)
 * - progress arc circle (brand) with strokeDasharray/strokeDashoffset
 */
function ScoreRing({ score }: { score: number }) {
  const normalized = clamp(score, 0, 100);

  const r = 28;
  const c = 2 * Math.PI * r;
  const dashOffset = c - (normalized / 100) * c;

  return (
    <View style={styles.scoreWrap}>
      <Svg width={80} height={80} viewBox="0 0 80 80">
        <Circle
          cx="40"
          cy="40"
          r={r}
          stroke="#e5e7eb"
          strokeWidth={8}
          fill="none"
        />
        <Circle
          cx="40"
          cy="40"
          r={r}
          stroke={BRAND}
          strokeWidth={8}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          // rotate -90deg around centre so it starts at top
          transform="rotate(-90 40 40)"
        />
      </Svg>

      <View style={styles.scoreCenter}>
        <Text style={styles.scoreValue}>{Math.round(normalized)}%</Text>
        <Text style={styles.scoreLabel}>Health Score</Text>
      </View>
    </View>
  );
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

  // bullet style (only if you ever pass bullet lines)
  bulletRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  bulletDot: {
    width: 10,
    textAlign: "center",
  },
  bulletText: {
    flex: 1,
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

function ReportPDF({ result }: { result: Result }) {
  const generatedAt = result.generatedAt
    ? new Date(result.generatedAt).toLocaleString()
    : new Date().toLocaleString();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>Prowess Digital Solutions</Text>
            <Text style={styles.brandSub}>Business Diagnostic Report</Text>
            <Text style={styles.meta}>Generated on {generatedAt}</Text>
          </View>

          <ScoreRing score={result.healthScore} />
        </View>

        {/* Title + Score note */}
        <Text style={styles.title}>{safeText(result.reportTitle)}</Text>
        <Text style={styles.scoreNote}>{safeText(result.scoreNote)}</Text>

        {/* Sections */}
        {result.sections.map((sec, idx) => (
          <View key={`${sec.heading}-${idx}`} style={styles.section}>
            <Text style={styles.h2}>{safeText(sec.heading)}</Text>

            {sec.paragraphs.map((p, pIdx) => (
              <Text key={`${idx}-${pIdx}`} style={styles.paragraph}>
                {safeText(p)}
              </Text>
            ))}
          </View>
        ))}

        {/* Disclaimer */}
        <View style={styles.footerDivider}>
          <Text style={styles.disclaimerTitle}>Disclaimer</Text>
          <Text style={styles.disclaimerText}>{safeText(result.disclaimer)}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { result: Result };

    if (!body?.result?.reportTitle || !Array.isArray(body?.result?.sections)) {
      return NextResponse.json(
        { error: "Invalid payload. Missing result.reportTitle or result.sections." },
        { status: 400 }
      );
    }

    const doc = <ReportPDF result={body.result} />;

    const instance = pdf(doc);
    const buffer = await instance.toBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          "attachment; filename=Prowess_Business_Diagnostic_Report.pdf",
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