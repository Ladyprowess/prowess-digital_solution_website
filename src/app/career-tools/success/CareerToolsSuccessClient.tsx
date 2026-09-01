"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";

export default function CareerToolsSuccessClient() {
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
        const res = await fetch("/api/career-tools/verify", {
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
        setMessage("Payment confirmed. Your career tools access is ready.");
      } catch {
        setStatus("error");
        setMessage("Something went wrong confirming your payment.");
      }
    })();
  }, [reference]);

  return (
    <div className="min-h-screen bg-background py-20">
      <Container>
        <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">
            {status === "ok" ? "You are all set" : status === "error" ? "One moment" : "Confirming..."}
          </h1>
          <p className="mt-3 text-muted-foreground">{message}</p>
          <Link
            href="/tools"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Go to tools
          </Link>
        </div>
      </Container>
    </div>
  );
}
