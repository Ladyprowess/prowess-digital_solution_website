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
    cache: "no-store",
    signal: options.signal || AbortSignal.timeout(20000),
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
 * Flutterwave bills a fixed amount per plan interval, so each (tier,
 * interval, currency) triple needs its own plan - a USD subscriber and an
 * NGN subscriber to the same tier are billed by two entirely separate
 * Flutterwave plans. Plans are created lazily on first checkout and cached
 * in `payment_plans` (primary key now includes currency - see
 * supabase/dual_currency_pricing.sql) so we don't recreate them on every
 * request.
 *
 * IMPORTANT: this can pass currency: "USD" to Flutterwave. That only works if
 * the connected Flutterwave account has USD/multi-currency enabled - that's a
 * business verification step done in the Flutterwave dashboard, not something
 * this code can turn on. If the account is NGN-only, USD calls will fail and
 * the merchant needs to enable USD with Flutterwave support first.
 */
export async function getOrCreatePaymentPlan(params: {
  slug: string;
  title: string;
  interval: BillingInterval;
  amount: number;
  currency: "USD" | "NGN";
}): Promise<string> {
  const { slug, title, interval, amount, currency } = params;
  const supabase = supabaseAdmin();
  const pricedSlug = `${slug}:${Math.round(amount * 100)}`;

  const { data: existing } = await supabase
    .from("payment_plans")
    .select("plan_id")
    .eq("provider", "flutterwave")
    .eq("slug", pricedSlug)
    .eq("interval", interval)
    .eq("currency", currency)
    .maybeSingle();

  if (existing?.plan_id) return existing.plan_id;

  const planName = `${title} (${interval === "monthly" ? "Monthly" : "Annual"}, ${currency})`;
  const created = await flwFetch("/payment-plans", {
    method: "POST",
    body: JSON.stringify({
      name: planName,
      amount,
      currency,
      interval: FLW_INTERVAL[interval],
    }),
  });

  const planId = created?.data?.id != null ? String(created.data.id) : undefined;
  if (!planId) throw new Error("Flutterwave did not return a payment plan id");

  await supabase.from("payment_plans").insert({
    provider: "flutterwave",
    slug: pricedSlug,
    interval,
    currency,
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

  if (!Number.isFinite(amount) || amount <= 0 || !["USD", "NGN"].includes(currency)) throw new Error("Invalid payment price");
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

  const link = result?.data?.link;
  if (typeof link !== "string" || !link.startsWith("https://")) throw new Error("Payment provider did not return a checkout link");
  return {
    link,
    reference,
  };
}

// Verifies by the tx_ref we generated (all call sites only have this string
// reference, not Flutterwave's internal numeric transaction id), never the
// client's say-so.
export async function verifyTransaction(reference: string) {
  if (typeof reference !== "string" || !reference.trim() || reference.length > 200) throw new Error("Invalid payment reference");
  const result = await flwFetch(
    `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`
  );
  if (result?.data?.tx_ref !== reference) throw new Error("Payment reference mismatch");
  return result?.data;
}
