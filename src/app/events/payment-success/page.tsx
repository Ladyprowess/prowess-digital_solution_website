// src/app/events/payment-success/page.tsx
"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";

function getQueryParam(name: string) {
  if (typeof window === "undefined") return null;
  const sp = new URLSearchParams(window.location.search);
  return sp.get(name);
}

export default function PaymentSuccessPage() {
  const [message, setMessage] = useState("Confirming your payment...");

  useEffect(() => {
    async function verify() {
      const reference = getQueryParam("tx_ref") || getQueryParam("reference");

      if (!reference) {
        setMessage("Missing payment reference.");
        return;
      }

      const res = await fetch("/api/events/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setMessage(data?.error || "Could not confirm payment.");
        return;
      }

      setMessage("Payment confirmed. You are registered for the event.");
    }

    verify().catch(() => setMessage("We could not confirm your payment yet. Refresh to retry. Please do not pay again."));
  }, []);

  return (
    <Container>
      <div className="py-14 max-w-2xl">
        <h1 className="text-2xl font-semibold text-slate-900">
          Registration status
        </h1>
        <p className="mt-4 text-sm text-slate-700">{message}</p>
      </div>
    </Container>
  );
}