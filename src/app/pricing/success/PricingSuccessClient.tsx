"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";

export default function PricingSuccessClient() {
  const params = useSearchParams();
  const reference = params.get("reference");

  const [status, setStatus] = useState<"checking" | "ok" | "error">("checking");
  const [message, setMessage] = useState("Confirming your payment...");

  useEffect(() => {
    (async () => {
      if (!reference) {
        setStatus("error");
        setMessage("Missing payment reference.");
        return;
      }

      try {
        const res = await fetch("/api/memberships/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.ok) {
          setStatus("error");
          setMessage(data?.error || "Could not confirm your payment.");
          return;
        }

        setStatus("ok");
        setMessage("Payment confirmed. Check your email - we'll reach out within 24 hours.");
      } catch {
        setStatus("error");
        setMessage("Something went wrong confirming your payment.");
      }
    })();
  }, [reference]);

  return (
    <div className="page-wrap section">
      <Container>
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">
            {status === "ok" ? "You're all set" : status === "error" ? "One moment" : "Confirming..."}
          </h1>
          <p className="mt-3 text-muted-foreground">{message}</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Back to homepage
          </Link>
        </div>
      </Container>
    </div>
  );
}
