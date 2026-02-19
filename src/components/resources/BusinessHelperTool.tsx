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

// ✅ iPhone Safari: keep inputs >= 16px to prevent zoom on focus
const FIELD_CLASS =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[16px] leading-6 outline-none focus:outline-none focus:ring-2 focus:ring-[var(--steel-teal)] focus:ring-offset-0";

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

  // ✅ make optional so TS doesn't block if API doesn't send it
  detectedAreas?: string[];

  reportTitle: string;
  sections: ReportSection[];
  disclaimer: string;
};

function sentenceLimit(text: string, maxSentences = 2) {
  const t = (text || "").trim();
  if (!t) return "";
  const parts = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  return parts.slice(0, maxSentences).join(" ");
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

// ===== Score progress circle =====
function ScoreCircle({
  score,
  size = 96,
}: {
  score: number;
  size?: number;
}) {
  const radius = 38;
  const stroke = 9;
  const normalized = Math.min(Math.max(score, 0), 100);

  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  const box = size;
  const center = box / 2;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={box} height={box} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={center}
          cy={center}
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

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xl font-extrabold text-[var(--steel-teal)]">
          {Math.round(normalized)}%
        </div>
        <div className="text-[10px] font-medium text-slate-500">Health Score</div>
      </div>
    </div>
  );
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

    if (error) console.error("SUPABASE SAVE ERROR:", error);
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
    // ✅ Keep this outer card for the TOOL itself (fine)
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
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
            className={FIELD_CLASS}
            inputMode="text"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Main problem</label>
          <select
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            className={`${FIELD_CLASS} appearance-none`}
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
            rows={6}
            className={FIELD_CLASS}
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
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Note: This is general guidance, not legal or financial advice.
        </p>

        <button
          onClick={onGenerate}
          disabled={!canGenerate || loading}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-[var(--steel-teal)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate report"}
        </button>
      </div>

      {/* =========================
          ✅ REPORT (MOBILE FRIENDLY)
          - Removes the shrinking “inner border column”
          - Full width, no max-w, no huge px-10
         ========================= */}
      {result && (
        <div className="mt-8">
          {/* ✅ THIS is where your green-marked “border shrink” problem was.
              Now: no max-w, no heavy ring/padding, full width layout. */}
          <div className="w-full rounded-2xl bg-slate-50 p-4 sm:p-6">
            <div className="w-full rounded-2xl bg-white p-4 sm:p-6">
              {/* Header */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <img
                    src="/brand/prowess-logo.png"
                    alt="Prowess Digital Solutions"
                    className="h-10 w-10 object-contain"
                  />
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Business Summary
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 break-words">
                      {result.reportTitle}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Generated on {safeDateTime(result.generatedAt)}
                    </p>
                  </div>
                </div>

                {/* Score ring: smaller on mobile to avoid overflow */}
                <div className="self-start sm:self-auto">
                  <div className="sm:hidden">
                    <ScoreCircle score={result.healthScore} size={86} />
                  </div>
                  <div className="hidden sm:block">
                    <ScoreCircle score={result.healthScore} size={96} />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">
                  What this means
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {sentenceLimit(result.scoreNote, 2)}
                </p>
              </div>

              {/* Optional focus areas */}
              {Array.isArray(result.detectedAreas) && result.detectedAreas.length > 0 && (
                <div className="mt-5">
                  <div className="text-sm font-semibold text-slate-900">
                    Key areas to focus on
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.detectedAreas.slice(0, 4).map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-[#507c80]/10 px-3 py-1 text-xs font-semibold text-[#507c80]"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Download full report */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  onClick={onDownloadPdf}
                  disabled={downloading}
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-[var(--steel-teal)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {downloading ? "Preparing..." : "Download full report (PDF)"}
                </button>

                <a
                  href="/contact"
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:opacity-90"
                >
                  Book a free consultation
                </a>
              </div>

              {/* Small disclaimer (optional) */}
              <p className="mt-4 text-xs text-slate-500">
                {result.disclaimer}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}