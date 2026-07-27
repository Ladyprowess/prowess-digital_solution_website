import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

const FLW_BASE = "https://api.flutterwave.com/v3";

// Unlike Paystack, Flutterwave requires the caller to supply tx_ref up front
// rather than generating one - every flow needs its own unique reference.
export function generateReference(prefix: string) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function secretKey() {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) throw new Error("Missing FLUTTERWAVE_SECRET_KEY env var");
  return key;
}

async function flwFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${FLW_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const json = await res.json();
  if (!res.ok || json?.status === "error") {
    throw new Error(json?.message || `Flutterwave request failed: ${path}`);
  }
  return json;
}

export type BillingInterval = "monthly" | "annually";

const FLW_INTERVAL: Record<BillingInterval, string> = {
  monthly: "monthly",
  annually: "yearly",
};

/**
 * Flutterwave bills a fixed amount per plan interval, so each (tier, interval)
 * pair needs its own plan. Plans are created lazily on first checkout and
 * cached in `payment_plans` so we don't recreate them on every request.
 *
 * IMPORTANT: this passes currency: "USD" to Flutterwave. That only works if
 * the connected Flutterwave account has USD/multi-currency enabled - that's a
 * business verification step done in the Flutterwave dashboard, not something
 * this code can turn on. If the account is NGN-only, this call will fail and
 * the merchant needs to enable USD with Flutterwave support first.
 */
export async function getOrCreatePaymentPlan(params: {
  slug: string;
  title: string;
  interval: BillingInterval;
  amountUSD: number;
}): Promise<string> {
  const { slug, title, interval, amountUSD } = params;
  const supabase = supabaseAdmin();

  const { data: existing } = await supabase
    .from("payment_plans")
    .select("plan_id")
    .eq("provider", "flutterwave")
    .eq("slug", slug)
    .eq("interval", interval)
    .maybeSingle();

  if (existing?.plan_id) return existing.plan_id;

  const planName = `${title} (${interval === "monthly" ? "Monthly" : "Annual"})`;
  const created = await flwFetch("/payment-plans", {
    method: "POST",
    body: JSON.stringify({
      name: planName,
      amount: amountUSD,
      currency: "USD",
      interval: FLW_INTERVAL[interval],
    }),
  });

  const planId = created?.data?.id != null ? String(created.data.id) : undefined;
  if (!planId) throw new Error("Flutterwave did not return a payment plan id");

  await supabase.from("payment_plans").insert({
    provider: "flutterwave",
    slug,
    interval,
    plan_id: planId,
  });

  return planId;
}

/**
 * Amounts are in the currency's major unit (dollars, naira) - NOT the
 * smallest unit. This differs from Paystack, which expected kobo/cents;
 * every call site was updated accordingly when migrating off Paystack.
 */
export async function initializePayment(params: {
  email: string;
  amount: number;
  currency: "USD" | "NGN";
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
  paymentPlanId?: string;
}) {
  const { email, amount, currency, reference, callbackUrl, metadata, paymentPlanId } = params;

  const result = await flwFetch("/payments", {
    method: "POST",
    body: JSON.stringify({
      tx_ref: reference,
      amount,
      currency,
      redirect_url: callbackUrl,
      customer: { email },
      meta: metadata,
      ...(paymentPlanId ? { payment_plan: paymentPlanId } : {}),
    }),
  });

  return {
    link: result?.data?.link as string,
    reference,
  };
}

// Verifies by the tx_ref we generated (all call sites only have this string
// reference, not Flutterwave's internal numeric transaction id), never the
// client's say-so.
export async function verifyTransaction(reference: string) {
  const result = await flwFetch(
    `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`
  );
  return result?.data;
}
