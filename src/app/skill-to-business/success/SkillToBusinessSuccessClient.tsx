"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";

export default function SkillToBusinessSuccessClient() {
  const params = useSearchParams();
  const reference = params.get("reference") || params.get("tx_ref");

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
        const res = await fetch("/api/skill-to-business/verify", {
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
        setMessage("Payment confirmed. Check your email for your tools access code - we'll reach out soon to schedule your session.");
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
            {status === "ok" ? "You're enrolled" : status === "error" ? "One moment" : "Confirming..."}
          </h1>
          <p className="mt-3 text-muted-foreground">{message}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/tools"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Go to tools
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Back to homepage
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
