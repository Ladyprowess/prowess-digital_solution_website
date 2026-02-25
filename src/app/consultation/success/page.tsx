"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Container from "@/components/Container";

export default function ConsultationSuccessPage() {
  const params = useSearchParams();
  const reference = params.get("reference");

  const [msg, setMsg] = useState("Confirming your booking...");

  useEffect(() => {
    (async () => {
      if (!reference) {
        setMsg("Missing payment reference.");
        return;
      }

      const res = await fetch("/api/consultations/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setMsg(json?.error || "Could not confirm payment.");
        return;
      }

      setMsg("Booking confirmed ✅ Check your email shortly.");
    })();
  }, [reference]);

  return (
    <Container>
      <div className="py-14 max-w-2xl">
        <h1 className="text-2xl font-semibold text-slate-900">Booking received</h1>
        <p className="mt-4 text-sm text-slate-700">{msg}</p>
      </div>
    </Container>
  );
}