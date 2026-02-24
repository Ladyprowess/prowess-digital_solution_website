"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Container from "@/components/Container";

export default function ConsultationSuccessPage() {
  const sp = useSearchParams();
  const bookingId = sp.get("booking_id");
  const reference = sp.get("reference"); // Paystack may append this

  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      if (!bookingId) {
        setState("error");
        setMsg("Missing booking ID.");
        return;
      }

      const res = await fetch("/api/consultations/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, reference }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setState("error");
        setMsg(json?.error || "Could not confirm booking.");
        return;
      }

      setState("ok");
      setMsg("Your booking is confirmed. Check your email for details and calendar invite.");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, reference]);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <Container>
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            {state === "loading" ? "Confirming…" : state === "ok" ? "Booking Confirmed ✅" : "Something went wrong"}
          </h1>

          <p className="mt-3 text-sm text-slate-700">
            {state === "loading" ? "Please wait…" : msg}
          </p>

          <div className="mt-6 flex gap-3">
            <a
              href="/consultation"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Book another
            </a>

            <a
              href="/"
              className="rounded-2xl bg-[var(--steel-teal)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Back to home
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
}