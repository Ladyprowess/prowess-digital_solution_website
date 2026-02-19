"use client";

import { useMemo, useState } from "react";

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

type Result = {
  healthScore: number;
  scoreBreakdown: string[];
  priorityFocus: string[];
  diagnosis: string;
  why: string;
  quickWins: string[];
  plan: string[];
  track: string[];
  disclaimer: string;
};

export default function BusinessHelperTool() {
  const [businessType, setBusinessType] = useState("");
  const [problem, setProblem] = useState(PROBLEMS[0]);
  const [details, setDetails] = useState("");

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const canGenerate = useMemo(() => {
    return businessType.trim().length > 1 && details.trim().length > 5;
  }, [businessType, details]);

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
        throw new Error(msg || "Failed to generate solution.");
      }

      const data = (await res.json()) as Result;

      // Basic safety checks (prevents UI crash if API returns something odd)
      if (
        typeof data.healthScore !== "number" ||
        !Array.isArray(data.quickWins) ||
        !Array.isArray(data.plan) ||
        !Array.isArray(data.track)
      ) {
        throw new Error("Invalid response format from the server.");
      }

      setResult(data);
    } catch (e: any) {
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
      a.download = "Prowess_Business_Helper_Report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      setError("PDF download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const scoreLabel = useMemo(() => {
    const s = result?.healthScore ?? 0;
    if (s >= 75) return "Strong";
    if (s >= 50) return "Fair";
    if (s >= 25) return "Needs attention";
    return "Critical";
  }, [result?.healthScore]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Prowess Tool
        </div>

        <h2 className="text-xl font-semibold">Business Helper</h2>
        <p className="text-slate-600">
          Describe your business challenge and get a clear diagnosis, practical steps, and a score.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Business type</label>
          <input
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            placeholder="e.g., Food business, Fashion brand, Salon"
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
            placeholder="Example: Sales dropped in the last 2 months. I post online but people don’t buy. I also don’t know my real profit."
            rows={4}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--steel-teal)]"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Note: This is general guidance, not legal or financial advice.
        </p>

        <button
          onClick={onGenerate}
          disabled={!canGenerate || loading}
          className="inline-flex items-center justify-center rounded-xl bg-[var(--steel-teal)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate solution"}
        </button>
      </div>

      {result && (
        <div className="mt-8 rounded-2xl bg-slate-50 p-5">
          {/* SCORE CARD */}
          <div className="mb-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold">Business Health Score</h3>
                <p className="mt-1 text-sm text-slate-600">
                  A quick rating based on clarity, structure, and basic control.
                </p>
              </div>

              <div className="shrink-0 rounded-xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800">
                {Math.round(result.healthScore)}/100 • {scoreLabel}
              </div>
            </div>

            <div className="mt-4 h-3 w-full rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full bg-[var(--steel-teal)]"
                style={{
                  width: `${Math.max(0, Math.min(100, result.healthScore))}%`,
                }}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold">Why this score</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {result.scoreBreakdown.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold">Priority focus (start here)</h4>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                  {result.priorityFocus.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* MAIN RESULT */}
          <h3 className="text-base font-semibold">What’s really going on</h3>
          <p className="mt-2 text-sm text-slate-700">{result.diagnosis}</p>

          <h4 className="mt-5 text-sm font-semibold">Why it’s happening</h4>
          <p className="mt-2 text-sm text-slate-700">{result.why}</p>

          <h4 className="mt-5 text-sm font-semibold">Quick fixes (this week)</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {result.quickWins.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>

          <h4 className="mt-5 text-sm font-semibold">Simple 2–4 week plan</h4>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
            {result.plan.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>

          <h4 className="mt-5 text-sm font-semibold">What to track</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {result.track.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>

          <p className="mt-5 text-xs text-slate-500">{result.disclaimer}</p>

          {/* ACTIONS */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--steel-teal)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? "Preparing PDF..." : "Download PDF report"}
            </button>

            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[var(--steel-teal)] ring-1 ring-[var(--steel-teal)] hover:opacity-90"
            >
              Book a free consultation
            </a>
          </div>
        </div>
      )}
    </div>
  );
}