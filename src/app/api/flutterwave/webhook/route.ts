import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { markMembershipPaid, markMembershipRenewalFailed, markMembershipCancelled } from "@/lib/payments/membership";
import { markConsultationPaid } from "@/lib/payments/consultation";
import { markSkillToBusinessPaid } from "@/lib/payments/skillToBusiness";
import { markContentPurchasePaid } from "@/lib/payments/content";
import { markPremiumMembershipPaid, markPremiumMembershipRenewalFailed, markPremiumMembershipCancelled } from "@/lib/payments/premiumMembership";
import { markEventPaid } from "@/lib/payments/event";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

// Flutterwave's classic v3 webhooks use a "verif-hash" header compared
// directly against a secret hash configured on the dashboard's Webhooks
// settings page - not an HMAC computation. Confirm this matches what your
// dashboard actually shows before relying on it in production; if the
// dashboard specifies a different header/scheme, this is the only function
// that needs to change.
function verifyFlutterwaveSignature(signature: string | null) {
  if (!signature) return false;
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
  if (!secretHash) return false;
  const actual = Buffer.from(signature);
  const expected = Buffer.from(secretHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("verif-hash");
    const rawBody = await req.text();

    if (!verifyFlutterwaveSignature(signature)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload?.event as string | undefined;
    const data = payload?.data || {};
    const metadata = data?.meta || {};

    if (event === "charge.completed") {
      if (data?.status === "successful") {
        return await handleSuccessfulCharge(data, metadata);
      }
      if (data?.status === "failed" && metadata?.subscription_id) {
        if (metadata?.type === "membership") {
          requireProcessed(await markMembershipRenewalFailed(String(metadata.subscription_id), String(data.tx_ref || ""), String(data.created_at || "")));
        } else if (metadata?.type === "premium_membership") {
          requireProcessed(await markPremiumMembershipRenewalFailed(String(metadata.subscription_id), String(data.tx_ref || ""), String(data.created_at || "")));
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (event === "subscription.cancelled") {
      const resolved = await resolveSubscriptionId(data, metadata);
      if (resolved?.table === "membership") {
        requireProcessed(await markMembershipCancelled(resolved.id));
      } else if (resolved?.table === "premium_membership") {
        requireProcessed(await markPremiumMembershipCancelled(resolved.id));
      }
      if (!resolved) throw new Error("Subscription cancellation could not be matched");
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Return failure so the provider can retry temporary reconciliation errors.
    return NextResponse.json({ ok: false, error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handleSuccessfulCharge(data: Record<string, unknown>, metadata: Record<string, unknown>) {
  const reference = data?.tx_ref as string | undefined;
  if (!reference) return NextResponse.json({ ok: true });

  if (metadata?.type === "membership") {
    const subscriptionId = metadata?.subscription_id as string | undefined;
    if (!subscriptionId) throw new Error("Missing subscription metadata");
    requireProcessed(await markMembershipPaid(subscriptionId, reference));
    return NextResponse.json({ ok: true });
  }

  if (metadata?.type === "premium_membership") {
    const subscriptionId = metadata?.subscription_id as string | undefined;
    if (!subscriptionId) throw new Error("Missing subscription metadata");
    requireProcessed(await markPremiumMembershipPaid(subscriptionId, reference));
    return NextResponse.json({ ok: true });
  }

  if (metadata?.type === "consultation") {
    requireProcessed(await markConsultationPaid(reference));
    return NextResponse.json({ ok: true });
  }

  if (metadata?.type === "event") {
    requireProcessed(await markEventPaid(reference));
    return NextResponse.json({ ok: true });
  }

  if (metadata?.type === "skill_to_business") {
    const purchaseId = metadata?.purchase_id as string | undefined;
    if (!purchaseId) throw new Error("Missing purchase metadata");
    requireProcessed(await markSkillToBusinessPaid(purchaseId, reference));
    return NextResponse.json({ ok: true });
  }

  if (metadata?.type === "content_purchase") {
    const purchaseId = metadata?.purchase_id as string | undefined;
    if (!purchaseId) throw new Error("Missing purchase metadata");
    requireProcessed(await markContentPurchasePaid(purchaseId, reference));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

function requireProcessed(result: { ok: boolean }) {
  if (!result.ok) throw new Error("Payment reconciliation failed");
}

// subscription.cancelled payloads vary by how the plan/subscription was
// created; try the metadata carried over from the original charge first
// (checked against both tables, whichever it belongs to), then fall back to
// matching an active subscription by the Flutterwave plan id Flutterwave
// reports for this event. Returns which table matched so the caller invokes
// the right markXCancelled.
//
// A metadata-carried subscription_id doesn't say which table it belongs
// to, so it's checked against both. The plan-id+email fallback is checked
// against premium_membership_subscriptions first if this event's data
// happens to carry a distinct subscription id (data?.id, for a
// subscription-resource payload) matching flutterwave_subscription_id -
// that's more specific than plan+email, which becomes ambiguous once
// reactivation can create a second local row against the same shared plan.
async function resolveSubscriptionId(
  data: Record<string, unknown>,
  metadata: Record<string, unknown>
): Promise<{ id: string; table: "membership" | "premium_membership" } | null> {
  const supabase = supabaseAdmin();

  if (metadata?.subscription_id) {
    const id = String(metadata.subscription_id);
    const { data: membershipMatch, error: membershipMatchError } = await supabase
      .from("membership_subscriptions")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (membershipMatchError) throw new Error("Subscription lookup failed");
    if (membershipMatch) return { id, table: "membership" };

    const { data: premiumMatch, error: premiumMatchError } = await supabase
      .from("premium_membership_subscriptions")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (premiumMatchError) throw new Error("Subscription lookup failed");
    if (premiumMatch) return { id, table: "premium_membership" };
  }

  const subscriptionResourceId = data?.id as string | number | undefined;
  if (subscriptionResourceId) {
    const { data: byFlwSubId, error: byFlwSubIdError } = await supabase
      .from("premium_membership_subscriptions")
      .select("id")
      .eq("flutterwave_subscription_id", String(subscriptionResourceId))
      .in("subscription_status", ["active", "lapsed", "cancelled"])
      .maybeSingle();
    if (byFlwSubIdError) throw new Error("Subscription lookup failed");
    if (byFlwSubId) return { id: byFlwSubId.id, table: "premium_membership" };
  }

  const plan = data?.plan ?? data?.payment_plan;
  const planId = (typeof plan === "object" && plan !== null ? (plan as { id?: unknown }).id : plan) as string | number | undefined;
  const email = (data?.customer as { email?: string } | undefined)?.email;
  if (!planId || !email) return null;

  const { data: membershipSub, error: membershipSubError } = await supabase
    .from("membership_subscriptions")
    .select("id")
    .eq("flutterwave_plan_id", String(planId))
    .eq("email", email)
    .in("subscription_status", ["active", "lapsed", "cancelled"])
    .maybeSingle();
  if (membershipSubError) throw new Error("Subscription lookup failed");
  if (membershipSub) return { id: membershipSub.id, table: "membership" };

  const { data: premiumSub, error: premiumSubError } = await supabase
    .from("premium_membership_subscriptions")
    .select("id")
    .eq("flutterwave_plan_id", String(planId))
    .eq("email", email)
    .in("subscription_status", ["active", "lapsed", "cancelled"])
    .maybeSingle();
  if (premiumSubError) throw new Error("Subscription lookup failed");
  if (premiumSub) return { id: premiumSub.id, table: "premium_membership" };

  return null;
}
