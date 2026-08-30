import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { markMembershipPaid, markMembershipRenewalFailed, markMembershipCancelled } from "@/lib/payments/membership";
import { markConsultationPaid } from "@/lib/payments/consultation";
import { markSkillToBusinessPaid } from "@/lib/payments/skillToBusiness";
import { markContentPurchasePaid } from "@/lib/payments/content";
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
      if (data?.status === "failed" && metadata?.type === "membership" && metadata?.subscription_id) {
        await markMembershipRenewalFailed(String(metadata.subscription_id));
      }
      return NextResponse.json({ ok: true });
    }

    if (event === "subscription.cancelled") {
      const subscriptionId = await resolveSubscriptionId(data, metadata);
      if (subscriptionId) {
        await markMembershipCancelled(subscriptionId);
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
// created; try the metadata carried over from the original charge first,
// then fall back to matching an active subscription by the Flutterwave plan
// id Flutterwave reports for this event.
async function resolveSubscriptionId(
  data: Record<string, unknown>,
  metadata: Record<string, unknown>
): Promise<string | null> {
  if (metadata?.subscription_id) return String(metadata.subscription_id);

  const planId = (data?.plan ?? data?.payment_plan) as string | number | undefined;
  const email = (data?.customer as { email?: string } | undefined)?.email;
  if (!planId || !email) return null;

  const supabase = supabaseAdmin();
  const { data: sub } = await supabase
    .from("membership_subscriptions")
    .select("id")
    .eq("flutterwave_plan_id", String(planId))
    .eq("email", email)
    .eq("subscription_status", "active")
    .maybeSingle();

  return sub?.id ?? null;
}
