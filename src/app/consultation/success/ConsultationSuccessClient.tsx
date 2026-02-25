"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Container from "@/components/Container";

export default function ConsultationSuccessClient() {
  const params = useSearchParams();

  const reference = params.get("reference"); // paid
  const bookingId = params.get("booking_id"); // free

  const [msg, setMsg] = useState("Confirming your booking...");

  useEffect(() => {
    (async () => {
      try {
        // ✅ FREE booking: confirm with booking_id
        if (bookingId) {
          const res = await fetch("/api/consultations/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ booking_id: bookingId }),
          });

          const json = await res.json().catch(() => null);

          if (!res.ok) {
            setMsg(json?.error || "Could not confirm booking.");
            return;
          }

          setMsg("Booking confirmed ✅ Check your email shortly.");
          return;
        }

        // ✅ PAID booking: verify with Paystack reference
        if (!reference) {
          setMsg("Missing booking details.");
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
      } catch (e: any) {
        setMsg(e?.message || "Something went wrong.");
      }
    })();
  }, [reference, bookingId]);

  return (
    <Container>
      <div className="py-14 max-w-2xl">
        <h1 className="text-2xl font-semibold text-slate-900">Booking received</h1>
        <p className="mt-4 text-sm text-slate-700">{msg}</p>
      </div>
    </Container>
  );
}