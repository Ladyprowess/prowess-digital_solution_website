import { supabaseAdmin } from "@/lib/supabase/admin";

const PAYSTACK_BASE = "https://api.paystack.co";

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Missing PAYSTACK_SECRET_KEY env var");
  return key;
}

async function paystackFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const json = await res.json();
  if (!res.ok || json?.status === false) {
    throw new Error(json?.message || `Paystack request failed: ${path}`);
  }
  return json;
}

export type BillingInterval = "monthly" | "annually";

/**
 * Paystack bills a fixed amount per plan interval, so each (tier, interval)
 * pair needs its own plan. Plans are created lazily on first checkout and
 * cached in `paystack_plans` so we don't recreate them on every request.
 *
 * IMPORTANT: this passes currency: "USD" to Paystack. That only works if
 * the connected Paystack account has USD/multi-currency enabled - that's a
 * business verification step done in the Paystack dashboard, not something
 * this code can turn on. If the account is NGN-only, this call will fail
 * and the merchant needs to enable USD with Paystack support first.
 */
export async function getOrCreatePlan(params: {
  slug: string;
  title: string;
  interval: BillingInterval;
  amountUSD: number;
}): Promise<string> {
  const { slug, title, interval, amountUSD } = params;
  const supabase = supabaseAdmin();

  const { data: existing } = await supabase
    .from("paystack_plans")
    .select("plan_code")
    .eq("slug", slug)
    .eq("interval", interval)
    .maybeSingle();

  if (existing?.plan_code) return existing.plan_code;

  const planName = `${title} (${interval === "monthly" ? "Monthly" : "Annual"})`;
  const created = await paystackFetch("/plan", {
    method: "POST",
    body: JSON.stringify({
      name: planName,
      amount: Math.round(amountUSD * 100),
      interval,
      currency: "USD",
    }),
  });

  const planCode = created?.data?.plan_code as string;
  if (!planCode) throw new Error("Paystack did not return a plan_code");

  await supabase.from("paystack_plans").insert({
    slug,
    interval,
    plan_code: planCode,
  });

  return planCode;
}

export async function initializeSubscriptionTransaction(params: {
  email: string;
  planCode: string;
  amountUSD: number;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  const { email, planCode, amountUSD, callbackUrl, metadata } = params;

  const result = await paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount: Math.round(amountUSD * 100),
      currency: "USD",
      plan: planCode,
      callback_url: callbackUrl,
      metadata,
    }),
  });

  return {
    authorizationUrl: result?.data?.authorization_url as string,
    reference: result?.data?.reference as string,
  };
}

export async function verifyTransaction(reference: string) {
  const result = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
  return result?.data;
}
