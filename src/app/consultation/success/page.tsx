"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ConsultationSuccessPage() {
  const sp = useSearchParams();

  const reference = useMemo(() => sp.get("reference") || sp.get("trxref") || "", [sp]);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    // If you want to verify on this page (optional)
    async function verify() {
      if (!reference) return;

      setLoading(true);
      setStatus("idle");
      setMessage("");

      try {
        const res = await fetch("/api/consultation/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          setStatus("fail");
          setMessage(json?.error || "Payment verification failed.");
          return;
        }

        setStatus("ok");
        setMessage("Payment confirmed. Your consultation booking is successful.");
      } catch (e: any) {
        setStatus("fail");
        setMessage(e?.message || "Network error.");
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [reference]);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-xl px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-slate-900">Consultation booked</h1>
          <p className="mt-2 text-sm text-slate-600">
            {reference ? (
              <>
                Reference: <span className="font-semibold text-slate-900">{reference}</span>
              </>
            ) : (
              "If you just paid, your payment reference will appear here."
            )}
          </p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
            {loading ? (
              <span className="text-slate-700">Verifying payment…</span>
            ) : status === "ok" ? (
              <span className="text-emerald-700">{message}</span>
            ) : status === "fail" ? (
              <span className="text-rose-700">{message}</span>
            ) : (
              <span className="text-slate-700">
                If you came here without a reference, no worries — check your email for confirmation.
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="/consultation"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Back to consultation page
            </a>

            <a
              href="/"
              className="rounded-2xl bg-[var(--steel-teal)] px-5 py-3 text-center text-sm font-semibold text-white hover:opacity-90"
            >
              Go to homepage
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}