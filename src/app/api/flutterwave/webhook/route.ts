import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { markMembershipPaid, markMembershipRenewalFailed, markMembershipCancelled } from "@/lib/payments/membership";
import { markConsultationPaid } from "@/lib/payments/consultation";
import { markSkillToBusinessPaid } from "@/lib/payments/skillToBusiness";
import { markContentPurchasePaid } from "@/lib/payments/content";
import { markPremiumMembershipPaid, markPremiumMembershipRenewalFailed, markPremiumMembershipCancelled } from "@/lib/payments/premiumMembership";
import { markCareerToolPurchasePaid } from "@/lib/payments/careerTools";
import { sendEventRegistrationEmails } from "@/lib/events/emails";

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
  return signature === secretHash;
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
          await markMembershipRenewalFailed(String(metadata.subscription_id));
        } else if (metadata?.type === "premium_membership") {
          await markPremiumMembershipRenewalFailed(String(metadata.subscription_id));
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (event === "subscription.cancelled") {
      const resolved = await resolveSubscriptionId(data, metadata);
      if (resolved?.table === "membership") {
        await markMembershipCancelled(resolved.id);
      } else if (resolved?.table === "premium_membership") {
        await markPremiumMembershipCancelled(resolved.id);
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Flutterwave expects 200 OK even if we fail internally, to avoid
    // endless retries on a payload we can't process anyway.
    return NextResponse.json({ ok: true });
  }
}

async function handleSuccessfulCharge(data: Record<string, unknown>, metadata: Record<string, unknown>) {
  const reference = data?.tx_ref as string | undefined;
  if (!reference) return NextResponse.json({ ok: true });

  if (metadata?.type === "membership") {
    const subscriptionId = metadata?.subscription_id as string | undefined;
    if (!subscriptionId) return NextResponse.json({ ok: true });
    await markMembershipPaid(subscriptionId, reference);
    return NextResponse.json({ ok: true });
  }

  if (metadata?.type === "premium_membership") {
    const subscriptionId = metadata?.subscription_id as string | undefined;
    if (!subscriptionId) return NextResponse.json({ ok: true });
    await markPremiumMembershipPaid(subscriptionId, reference);
    return NextResponse.json({ ok: true });
  }

  if (metadata?.type === "consultation") {
    await markConsultationPaid(reference);
    return NextResponse.json({ ok: true });
  }

  if (metadata?.type === "event") {
    await handleEventPayment(reference, metadata, data);
    return NextResponse.json({ ok: true });
  }

  if (metadata?.type === "skill_to_business") {
    const purchaseId = metadata?.purchase_id as string | undefined;
    if (purchaseId) await markSkillToBusinessPaid(purchaseId, reference);
    return NextResponse.json({ ok: true });
  }

  if (metadata?.type === "content_purchase") {
    const purchaseId = metadata?.purchase_id as string | undefined;
    if (purchaseId) await markContentPurchasePaid(purchaseId, reference);
    return NextResponse.json({ ok: true });
  }

  if (metadata?.type === "career_tools") {
    const purchaseId = metadata?.purchase_id as string | undefined;
    if (purchaseId) await markCareerToolPurchasePaid(purchaseId, reference);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

async function handleEventPayment(reference: string, metadata: Record<string, unknown>, charge: Record<string, unknown>) {
  const supabase = supabaseAdmin();

  const { data: existing } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("flutterwave_reference", reference)
    .maybeSingle();

  if (existing) return; // already reconciled by the client-side verify call

  const event_id = metadata?.event_id;
  const full_name = metadata?.full_name;
  const email = metadata?.email;
  const phone = metadata?.phone || "";
  if (!event_id || !full_name) return;

  // Never trust metadata alone - check that this webhook's own charge data
  // (amount/currency, straight from Flutterwave, not the client) actually
  // matches one of this event's real prices before registering anyone.
  const { data: eventRow } = await supabase
    .from("events")
    .select("price_usd,price_ngn")
    .eq("id", event_id)
    .maybeSingle();

  const chargedCurrency = String(charge?.currency || "").toUpperCase();
  const expectedAmount = chargedCurrency === "NGN" ? eventRow?.price_ngn : chargedCurrency === "USD" ? eventRow?.price_usd : null;
  const amountMatches = expectedAmount != null && Math.round(Number(charge?.amount || 0) * 100) === Math.round(Number(expectedAmount) * 100);
  if (!amountMatches) return;

  await supabase.from("event_registrations").insert([
    {
      event_id,
      full_name: String(full_name).trim(),
      email: email ? String(email).trim() : null,
      phone: phone ? String(phone).trim() : null,
      payment_status: "paid",
      flutterwave_reference: reference,
    },
  ]);

  if (email) {
    await sendEventRegistrationEmails({
      eventId: String(event_id),
      registrantName: String(full_name).trim(),
      registrantEmail: String(email).trim(),
      paymentStatus: "paid",
    }).catch(() => {});
  }
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
    const { data: membershipMatch } = await supabase
      .from("membership_subscriptions")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (membershipMatch) return { id, table: "membership" };

    const { data: premiumMatch } = await supabase
      .from("premium_membership_subscriptions")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (premiumMatch) return { id, table: "premium_membership" };
  }

  const subscriptionResourceId = data?.id as string | number | undefined;
  if (subscriptionResourceId) {
    const { data: byFlwSubId } = await supabase
      .from("premium_membership_subscriptions")
      .select("id")
      .eq("flutterwave_subscription_id", String(subscriptionResourceId))
      .eq("subscription_status", "active")
      .maybeSingle();
    if (byFlwSubId) return { id: byFlwSubId.id, table: "premium_membership" };
  }

  const planId = (data?.plan ?? data?.payment_plan) as string | number | undefined;
  const email = (data?.customer as { email?: string } | undefined)?.email;
  if (!planId || !email) return null;

  const { data: membershipSub } = await supabase
    .from("membership_subscriptions")
    .select("id")
    .eq("flutterwave_plan_id", String(planId))
    .eq("email", email)
    .eq("subscription_status", "active")
    .maybeSingle();
  if (membershipSub) return { id: membershipSub.id, table: "membership" };

  const { data: premiumSub } = await supabase
    .from("premium_membership_subscriptions")
    .select("id")
    .eq("flutterwave_plan_id", String(planId))
    .eq("email", email)
    .eq("subscription_status", "active")
    .maybeSingle();
  if (premiumSub) return { id: premiumSub.id, table: "premium_membership" };

  return null;
}
