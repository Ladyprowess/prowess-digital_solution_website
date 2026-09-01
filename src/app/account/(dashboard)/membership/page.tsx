"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/account/AccountUI";
import { supabase } from "@/lib/supabase";
import { formatMoney } from "@/lib/formatMoney";

type Subscription = {
  subscription_status: "pending" | "active" | "lapsed" | "cancelled";
  billing_interval: "monthly" | "annually";
  currency: "USD" | "NGN";
  amount_usd: number | null;
  amount_ngn: number | null;
};

type Pricing = {
  premium_membership_monthly_usd: number | null;
  premium_membership_monthly_ngn: number | null;
  premium_membership_annual_usd: number | null;
  premium_membership_annual_ngn: number | null;
};

const STATUS_LABELS: Record<Subscription["subscription_status"], string> = {
  pending: "Payment pending",
  active: "Active",
  lapsed: "Payment failed - retrying",
  cancelled: "Cancelled",
};

export default function MembershipPage() {
  return (
    <Suspense fallback={null}>
      <Membership />
    </Suspense>
  );
}

function Membership() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [interval, setInterval_] = useState<"monthly" | "annually">("monthly");
  const [currency, setCurrency] = useState<"USD" | "NGN">("USD");
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function authHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : null;
  }

  async function loadStatus() {
    const headers = await authHeader();
    if (!headers) { setLoading(false); return; }
    const res = await fetch("/api/premium-membership/checkout", { headers }).then((r) => r.json()).catch(() => null);
    setSubscription(res?.ok ? res.subscription : null);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("premium_membership_monthly_usd, premium_membership_monthly_ngn, premium_membership_annual_usd, premium_membership_annual_ngn")
        .eq("id", 1)
        .maybeSingle();
      setPricing(data || null);

      // Flutterwave's real redirect param is tx_ref - reference is kept as
      // a defensive fallback, same as PurchaseSuccessClient.
      const reference = searchParams.get("tx_ref") || searchParams.get("reference");
      if (reference) {
        setVerifying(true);
        const res = await fetch("/api/premium-membership/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        }).then((r) => r.json()).catch(() => null);
        setVerifying(false);
        setMessage(res?.ok ? "Payment confirmed - your Premium Membership is active." : "");
        if (!res?.ok) setError(res?.error || "Could not confirm your payment.");
      }

      await loadStatus();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upgrade() {
    setError("");
    setUpgrading(true);
    try {
      const headers = await authHeader();
      if (!headers) { setError("Please sign in to continue."); return; }

      const res = await fetch("/api/premium-membership/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ interval, currency }),
      }).then((r) => r.json()).catch(() => null);

      if (!res?.ok || !res.authorizationUrl) {
        setError(res?.error || "Could not start checkout.");
        return;
      }
      window.location.href = res.authorizationUrl;
    } finally {
      setUpgrading(false);
    }
  }

  const priceFor = (i: "monthly" | "annually", c: "USD" | "NGN") => {
    if (!pricing) return null;
    if (i === "monthly") return c === "USD" ? pricing.premium_membership_monthly_usd : pricing.premium_membership_monthly_ngn;
    return c === "USD" ? pricing.premium_membership_annual_usd : pricing.premium_membership_annual_ngn;
  };

  const isActive = subscription?.subscription_status === "active";
  const selectedPrice = priceFor(interval, currency);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Membership</h1>
      <p className="mt-1 text-sm text-muted-foreground">Premium Membership unlocks every CV template and unlimited saved CVs - and any future premium tools.</p>

      <div className="mt-6 max-w-xl space-y-6">
        {verifying && <p className="text-sm text-muted-foreground">Confirming your payment…</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <Card title="Current status">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : subscription ? (
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">{STATUS_LABELS[subscription.subscription_status]}</p>
              <p className="text-muted-foreground">
                {subscription.billing_interval === "monthly" ? "Billed monthly" : "Billed annually"} ·{" "}
                {formatMoney(Number(subscription.currency === "USD" ? subscription.amount_usd : subscription.amount_ngn), subscription.currency)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">You&rsquo;re not on Premium Membership yet.</p>
          )}
        </Card>

        {!isActive && (
          <Card title="Upgrade to Premium">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setInterval_("monthly")}
                className={`rounded-xl border p-4 text-left ${interval === "monthly" ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <p className="text-sm font-bold text-foreground">Monthly</p>
                <p className="mt-1 text-lg font-bold text-primary">{priceFor("monthly", currency) ? formatMoney(priceFor("monthly", currency)!, currency) : "-"}</p>
              </button>
              <button
                type="button"
                onClick={() => setInterval_("annually")}
                className={`rounded-xl border p-4 text-left ${interval === "annually" ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <p className="text-sm font-bold text-foreground">Annual</p>
                <p className="mt-1 text-lg font-bold text-primary">{priceFor("annually", currency) ? formatMoney(priceFor("annually", currency)!, currency) : "-"}</p>
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setCurrency("USD")} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${currency === "USD" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>USD</button>
              <button type="button" onClick={() => setCurrency("NGN")} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${currency === "NGN" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>NGN</button>
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <button
              type="button"
              onClick={upgrade}
              disabled={upgrading || !selectedPrice}
              className="mt-4 w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {upgrading ? "Starting checkout…" : !selectedPrice ? "Not priced yet" : "Upgrade"}
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}
