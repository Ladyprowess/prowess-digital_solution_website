"use client";
import { trackEvent } from "@/lib/analytics";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSignedIn } from "@/lib/useSignedIn";
import { formatMoney } from "@/lib/formatMoney";
import { CurrencyToggle } from "@/components/CurrencyToggle";

// Shared checkout trigger for any premium item (course, resource, or career
// path). The amount is never sent from here - /api/content/checkout reads
// the real price server-side for whichever currency is selected; this
// component only ever sends which currency, never an amount. Buying now
// requires a real signed-in session (no more guest checkout by typing an
// email) - /api/content/checkout verifies the same access token this
// component sends and rejects anything else, so this isn't just a UI-level
// gate.
export function BuyButton({
  itemType,
  itemId,
  priceUsd,
  priceNgn,
  className = "",
}: {
  itemType: "resource" | "course" | "career_path";
  itemId: string;
  priceUsd: number | null;
  priceNgn: number | null;
  className?: string;
}) {
  const pathname = usePathname();
  const { signedIn, checking: checkingSession } = useSignedIn();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [currency, setCurrency] = useState<"USD" | "NGN">(priceUsd ? "USD" : "NGN");

  async function buy() {
    setErr("");
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setErr("Please sign in to continue."); setLoading(false); return; }

      trackEvent("begin_checkout", { flow: "content" });
      const res = await fetch("/api/content/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ itemType, itemId, currency }),
      });
      const data = await res.json();
      if (!data.ok || !data.authorizationUrl) {
        trackEvent("checkout_error", { flow: "content" });
        setErr(data.error || "Could not start checkout.");
        setLoading(false);
        return;
      }
      window.location.href = data.authorizationUrl;
    } catch {
      trackEvent("checkout_error", { flow: "content" });
      setErr("Something went wrong.");
      setLoading(false);
    }
  }

  const bothCurrenciesAvailable = Boolean(priceUsd && priceNgn);
  const amount = currency === "USD" ? priceUsd : priceNgn;
  const priceLabel = amount ? formatMoney(amount, currency) : "";

  if (checkingSession) {
    return (
      <div className={className}>
        <div className="h-[46px] w-full animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className={className}>
        {bothCurrenciesAvailable && (
          <div className="mb-3 flex justify-center">
            <CurrencyToggle value={currency} onChange={setCurrency} />
          </div>
        )}
        <Link
          href={`/account/login?redirect=${encodeURIComponent(pathname)}`}
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90"
        >
          Sign in to buy for {priceLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className={className}>
      {bothCurrenciesAvailable && (
        <div className="mb-3 flex justify-center">
          <CurrencyToggle value={currency} onChange={setCurrency} />
        </div>
      )}
      <button
        type="button"
        onClick={buy}
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Starting checkout…" : `Buy for ${priceLabel}`}
      </button>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </div>
  );
}
