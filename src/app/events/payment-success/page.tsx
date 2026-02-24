// src/app/events/payment-success/payment-success-client.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function PaymentSuccessClient() {
  const params = useSearchParams();
  const reference = params.get("reference");

  const [message, setMessage] = useState("Confirming your payment...");

  useEffect(() => {
    async function verify() {
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

      setMessage("Payment confirmed ✅ You are registered for the event.");
    }

    verify();
  }, [reference]);

  return (
    <div className="py-14 max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Registration status
      </h1>
      <p className="mt-4 text-sm text-slate-700">{message}</p>
    </div>
  );
}