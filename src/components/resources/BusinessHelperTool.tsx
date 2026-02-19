"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const PROBLEMS = [
  "Low sales",
  "Pricing confusion",
  "No steady customers",
  "Cashflow issues",
  "High expenses",
  "No clear business structure",
  "Marketing is not working",
  "Team/staff problems",
  "Other",
];

type ReportSection = {
  heading: string;
  paragraphs: string[];
};

type Result = {
  // optional (in case API doesn't return yet)
  reportId?: string;
  generatedAt?: string;

  healthScore: number;
  healthLabel: "Strong" | "Fair" | "Needs attention" | "Critical";
  scoreNote: string;

  detectedAreas: string[];
  reportTitle: string;
  sections: ReportSection[];

  disclaimer: string;
};

// ===== Score progress circle (100% full, 50% half, etc.) =====
function ScoreCircle({ score }: { score: number }) {
  const radius = 44;
  const stroke = 9;
  const normalized = Math.min(Math.max(score, 0), 100);

  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <svg width="110" height="110" className="-rotate-90">
        {/* track */}
        <circle
          cx="55"
          cy="55"
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="transparent"
        />
        {/* progress */}
        <circle
          cx="55"
          cy="55"
          r={radius}
          stroke="var(--steel-teal)"
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.9s ease" }}
        />
      </svg>

      {/* centre text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-extrabold text-[var(--steel-teal)]">
          {Math.round(normalized)}%
        </div>
        <div className="text-[10px] font-medium text-slate-500">
          Health Score
        </div>
      </div>
    </div>
  );
}

// bullets only when needed (real list markers)
function extractBullets(text: string) {
  const lines = (text || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  const bullets = lines
    .filter((l) => l.startsWith("•") || l.startsWith("-") || l.startsWith("*"))
    .map((l) => l.replace(/^([•\-*])\s*/, ""));

  return bullets.length >= 2 ? bullets : null;
}

function makeLocalReportId() {
  return `RPT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function safeDateTime(iso?: string) {
  try {
    return iso ? new Date(iso).toLocaleString() : new Date().toLocaleString();
  } catch {
    return new Date().toLocaleString();
  }
}

export default function BusinessHelperTool() {
  const [businessType, setBusinessType] = useState("");
  const [problem, setProblem] = useState(PROBLEMS[0]);
  const [details, setDetails] = useState("");

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const canGenerate = useMemo(() => {
    return businessType.trim().length > 1 && details.trim().length > 10;
  }, [businessType, details]);

  const saveToSupabase = async (payload: {
    businessType: string;
    problem: string;
    details: string;
    result: Result;
  }) => {
    const { error } = await supabase.from("business_helper_reports").insert([
      {
        business_type: payload.businessType,
        problem: payload.problem || null,
        details: payload.details,
        report: payload.result,
      },
    ]);

    if (error) {
      console.error("SUPABASE SAVE ERROR:", error);
    }
  };

  const onGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/business-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType, problem, details }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Failed to generate report.");
      }

      const data = (await res.json()) as Result;

      if (
        typeof data.healthScore !== "number" ||
        !Array.isArray(data.sections) ||
        !data.reportTitle
      ) {
        throw new Error("Invalid response format.");
      }

      const enhanced: Result = {
        ...data,
        reportId: data.reportId || makeLocalReportId(),
        generatedAt: data.generatedAt || new Date().toISOString(),
      };

      setResult(enhanced);

      void saveToSupabase({
        businessType: businessType.trim(),
        problem,
        details: details.trim(),
        result: enhanced,
      });
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDownloadPdf = async () => {
    if (!result) return;

    setDownloading(true);
    setError(null);

    try {
      const res = await fetch("/api/business-helper/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType, problem, details, result }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Failed to generate PDF.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "Prowess_Business_Diagnostic_Report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError("PDF download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* TOOL INTRO */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Prowess Tool
        </div>

        <h2 className="text-xl font-semibold">Business Helper</h2>
        <p className="text-slate-600">
          Share what’s happening in your business and get a structured diagnostic report.
        </p>
      </div>

      {/* INPUTS */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Business type</label>
          <input
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            placeholder="e.g., Food business, Fashion brand, Salon, Coaching"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--steel-teal)]"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Main problem</label>
          <select
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--steel-teal)]"
          >
            {PROBLEMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-slate-700">Tell us what’s happening</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Explain the situation clearly: what you tried, what happened, and what you want to change."
            rows={5}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--steel-teal)]"
          />
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ACTION */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Note: This is general guidance, not legal or financial advice.
        </p>

        <button
          onClick={onGenerate}
          disabled={!canGenerate || loading}
          className="inline-flex items-center justify-center rounded-xl bg-[var(--steel-teal)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate report"}
        </button>
      </div>

      {/* REPORT */}
      {result && (
        <div className="mt-10 rounded-2xl bg-slate-50 p-6">
          <div className="mx-auto max-w-4xl rounded-xl bg-white px-10 py-12 shadow-sm ring-1 ring-slate-200">
            {/* LETTERHEAD + SCORE CIRCLE */}
            <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
              <div className="flex items-center gap-4">
                <img
                  src="/brand/prowess-logo.png"
                  alt="Prowess Digital Solutions"
                  className="h-12 w-12 object-contain"
                />

                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">
                    Prowess Digital Solutions
                  </h1>
                  <p className="text-sm font-medium text-slate-600">
                    Business Diagnostic Report
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Generated on {safeDateTime(result.generatedAt)}
                  </p>
                </div>
              </div>

              {/* ✅ progress score circle */}
              <ScoreCircle score={result.healthScore} />
            </div>

            {/* TITLE */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                {result.reportTitle}
              </h2>

              <p className="mt-4 text-sm text-slate-700 leading-7 text-justify" style={{ textIndent: "1.2rem" }}>
                {result.scoreNote}
              </p>
            </div>

            {/* DOWNLOAD PDF BUTTON (kept, not deleted) */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={onDownloadPdf}
                disabled={downloading}
                className="inline-flex items-center justify-center rounded-xl bg-[var(--steel-teal)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {downloading ? "Preparing PDF..." : "Download PDF report"}
              </button>
            </div>

            {/* SECTIONS */}
            <div className="mt-10 space-y-10">
              {result.sections.map((sec) => (
                <section key={sec.heading}>
                  <h3 className="text-lg font-bold text-slate-900">
                    {sec.heading}
                  </h3>

                  <div className="mt-3 space-y-4">
                    {sec.paragraphs.map((text, i) => {
                      const bullets = extractBullets(text);

                      if (bullets) {
                        return (
                          <ul
                            key={i}
                            className="ml-6 list-disc space-y-2 text-sm leading-7 text-slate-700"
                          >
                            {bullets.map((b, idx) => (
                              <li key={idx}>{b}</li>
                            ))}
                          </ul>
                        );
                      }

                      return (
                        <p
                          key={i}
                          className="text-sm leading-7 text-slate-700 text-justify"
                          style={{ textIndent: "1.2rem" }}
                        >
                          {text}
                        </p>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            {/* DISCLAIMER */}
            <div className="mt-12 border-t border-slate-200 pt-6">
              <h4 className="text-sm font-bold text-slate-900">Disclaimer</h4>
              <p className="mt-2 text-xs leading-6 text-slate-600">
                {result.disclaimer}
              </p>
            </div>

            {/* CTA */}
            <div className="mt-6">
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:opacity-90"
              >
                Book a free consultation
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}