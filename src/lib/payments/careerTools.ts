import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resendClient";
import { verifyTransaction } from "@/lib/payments/flutterwave";
import { formatMoney } from "@/lib/formatMoney";

export const CAREER_PLAN_SLUGS = ["basic", "premium", "pro"] as const;
export type CareerPlanSlug = (typeof CAREER_PLAN_SLUGS)[number];

export const CAREER_PLAN_LABELS: Record<CareerPlanSlug, string> = {
  basic: "Basic",
  premium: "Premium",
  pro: "Pro",
};

export const CAREER_PLAN_TOOLS: Record<CareerPlanSlug, string[]> = {
  basic: ["cv_builder", "cv_checker"],
  premium: ["cv_builder", "cv_checker", "interview_prep"],
  pro: ["cv_builder", "cv_checker", "interview_prep", "portfolio_builder"],
};

export type CareerPricing = Record<CareerPlanSlug, { usd: number | null; ngn: number | null }>;

export function isCareerPlanSlug(value: string): value is CareerPlanSlug {
  return (CAREER_PLAN_SLUGS as readonly string[]).includes(value);
}

export function planIncludesTool(plan: CareerPlanSlug, toolKey: string) {
  return CAREER_PLAN_TOOLS[plan].includes(toolKey);
}

// CAREER_PLAN_SLUGS is already ordered low-to-high, so index doubles as rank.
export function planRank(plan: CareerPlanSlug): number {
  return CAREER_PLAN_SLUGS.indexOf(plan);
}

export function higherOrEqualPlan(a: CareerPlanSlug, b: CareerPlanSlug): CareerPlanSlug {
  return planRank(a) >= planRank(b) ? a : b;
}

export async function getCareerPricing(): Promise<CareerPricing> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("site_settings")
    .select("career_basic_usd, career_basic_ngn, career_premium_usd, career_premium_ngn, career_pro_usd, career_pro_ngn")
    .eq("id", 1)
    .maybeSingle();

  return {
    basic: { usd: data?.career_basic_usd ?? null, ngn: data?.career_basic_ngn ?? null },
    premium: { usd: data?.career_premium_usd ?? null, ngn: data?.career_premium_ngn ?? null },
    pro: { usd: data?.career_pro_usd ?? null, ngn: data?.career_pro_ngn ?? null },
  };
}

export async function getActiveCareerPlan(caller: { userId?: string | null; email?: string | null }): Promise<CareerPlanSlug | null> {
  if (!caller.userId && !caller.email) return null;

  const supabase = supabaseAdmin();
  let query = supabase
    .from("career_tool_purchases")
    .select("plan_slug")
    .eq("payment_status", "paid");

  if (caller.userId && caller.email) {
    query = query.or(`user_id.eq.${caller.userId},email.eq.${caller.email}`);
  } else if (caller.userId) {
    query = query.eq("user_id", caller.userId);
  } else if (caller.email) {
    query = query.eq("email", caller.email);
  }

  // The HIGHEST tier ever paid for wins, not the most recently purchased
  // one - a one-time purchase never expires or gets replaced, so someone
  // who bought Pro months ago and later (accidentally or otherwise) buys
  // Basic again must keep their Pro access, not lose it because Basic is
  // now the newest row.
  const { data } = await query;
  let best: CareerPlanSlug | null = null;
  for (const row of data || []) {
    const plan = String(row.plan_slug || "");
    if (isCareerPlanSlug(plan) && (!best || planRank(plan) > planRank(best))) {
      best = plan;
    }
  }
  return best;
}

export async function hasCareerToolAccess(caller: { userId?: string | null; email?: string | null }, toolKey: string): Promise<boolean> {
  const plan = await getActiveCareerPlan(caller);
  return plan ? planIncludesTool(plan, toolKey) : false;
}

export async function markCareerToolPurchasePaid(purchaseId: string, reference: string) {
  const supabase = supabaseAdmin();

  const { data: purchase, error: purchaseErr } = await supabase
    .from("career_tool_purchases")
    .select("*")
    .eq("id", purchaseId)
    .single();

  if (purchaseErr || !purchase) return { ok: false as const };
  if (purchase.payment_status === "paid") return { ok: true as const, alreadyPaid: true };

  const verified = await verifyTransaction(reference);
  const amountMatches = Math.round(Number(verified?.amount || 0) * 100) === Math.round(Number(purchase.amount) * 100);
  const currencyMatches = String(verified?.currency || "").toUpperCase() === String(purchase.currency).toUpperCase();
  if (verified?.status !== "successful" || !amountMatches || !currencyMatches) {
    return { ok: false as const };
  }

  const { data: updatedRows, error: updErr } = await supabase
    .from("career_tool_purchases")
    .update({ payment_status: "paid", flutterwave_reference: reference, paid_at: new Date().toISOString() })
    .eq("id", purchase.id)
    .neq("payment_status", "paid")
    .select("id");

  if (updErr) return { ok: false as const };
  if (!updatedRows || updatedRows.length === 0) {
    return { ok: true as const, alreadyPaid: true };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.RESEND_TO;
  const paidCurrency = purchase.currency === "NGN" ? "NGN" : "USD";
  const amountLabel = formatMoney(Number(purchase.amount), paidCurrency);
  const planLabel = CAREER_PLAN_LABELS[purchase.plan_slug as CareerPlanSlug] || "Career Tools";

  if (fromEmail) {
    await resend.emails.send({
      from: fromEmail,
      to: purchase.email,
      subject: `${planLabel} Career Tools access confirmed`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0b1b1d;">
          <h2>Your ${planLabel} access is ready.</h2>
          <p>Your one time payment of <strong>${amountLabel}</strong> has been confirmed.</p>
          <p>You can now use the tools included in this plan from <a href="https://prowessdigitalsolutions.com/tools">the tools page</a>.</p>
          <p>Payment reference: ${reference}</p>
        </div>
      `,
    }).catch(() => {});

    if (adminEmail) {
      await resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: `Career tools payment confirmed: ${planLabel}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0b1b1d;">
            <h2>Career tools payment confirmed</h2>
            <p><strong>Plan:</strong> ${planLabel}</p>
            <p><strong>Email:</strong> ${purchase.email}</p>
            <p><strong>Amount:</strong> ${amountLabel}</p>
            <p><strong>Reference:</strong> ${reference}</p>
          </div>
        `,
      }).catch(() => {});
    }
  }

  return { ok: true as const, alreadyPaid: false };
}
