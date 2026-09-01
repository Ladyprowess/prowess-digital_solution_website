import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { getOrCreatePaymentPlan, initializePayment, generateReference } from "@/lib/payments/flutterwave";
import { getPremiumMembershipPricing } from "@/lib/payments/premiumMembershipPricing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://prowessdigitalsolutions.com";

// The set of subscription_status values the Phase 0 partial unique index
// (premium_membership_subscriptions_one_open_per_user) also protects - kept
// in this one place so the application-level check below and the index
// stay describing the same invariant.
const OPEN_STATUSES = ["pending", "active"];

// Used by /account/membership to show current status. Deliberately the
// caller's own most recent row only (not a query into every subscription
// ever), and only the fields safe to show back to them - no internal
// Flutterwave ids.
export async function GET(req: Request) {
  const member = await verifyMember(req);
  if (!member) {
    return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("premium_membership_subscriptions")
    .select("subscription_status, billing_interval, currency, amount_usd, amount_ngn, created_at")
    .eq("user_id", member.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ ok: true, subscription: data || null });
}

export async function POST(req: Request) {
  try {
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    const body = await req.json();
    const { interval, currency } = body || {};

    if (interval !== "monthly" && interval !== "annually") {
      return NextResponse.json({ ok: false, error: "Invalid billing interval" }, { status: 400 });
    }

    const pricing = await getPremiumMembershipPricing();
    const requestedCurrency: "USD" | "NGN" = currency === "NGN" ? "NGN" : "USD";
    const amount = interval === "monthly"
      ? (requestedCurrency === "USD" ? pricing.monthlyUsd : pricing.monthlyNgn)
      : (requestedCurrency === "USD" ? pricing.annualUsd : pricing.annualNgn);

    if (!amount) {
      return NextResponse.json({ ok: false, error: "Premium Membership isn't priced in that currency yet." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Duplicate-subscription protection - the user-friendly early exit. The
    // real guarantee is the partial unique index on the table itself (see
    // the race-handling catch further down); this check just avoids making
    // an unnecessary Flutterwave call in the common (non-racing) case.
    const { data: openSub } = await supabase
      .from("premium_membership_subscriptions")
      .select("*")
      .eq("user_id", member.id)
      .in("subscription_status", OPEN_STATUSES)
      .maybeSingle();

    let subscriptionId: string;

    if (openSub?.subscription_status === "active") {
      return NextResponse.json({ ok: false, error: "You already have an active Premium Membership." }, { status: 400 });
    }

    if (openSub && openSub.billing_interval === interval && openSub.currency === requestedCurrency) {
      // Same terms as an unresolved checkout already in progress - reuse
      // the same row rather than creating a second one. Refresh its stored
      // amount to the current price before reusing it: if pricing changed
      // in /admin/settings between the first attempt and this retry, the
      // row would otherwise keep charging against a stale amount, and
      // markPremiumMembershipPaid's amount-match check would then reject a
      // legitimately-paid charge for not matching the (wrong) stored value.
      subscriptionId = openSub.id;
      await supabase
        .from("premium_membership_subscriptions")
        .update({
          amount_usd: requestedCurrency === "USD" ? amount : null,
          amount_ngn: requestedCurrency === "NGN" ? amount : null,
        })
        .eq("id", subscriptionId);
    } else {
      if (openSub) {
        // A pending checkout exists but for different terms (interval or
        // currency changed since the member last tried) - it never got
        // paid and never will under its old terms, so replace it rather
        // than leaving an orphaned pending row behind.
        await supabase.from("premium_membership_subscriptions").delete().eq("id", openSub.id);
      }

      const { data: profile } = await supabase
        .from("member_profiles")
        .select("full_name")
        .eq("id", member.id)
        .maybeSingle();

      const { data: row, error: insertErr } = await supabase
        .from("premium_membership_subscriptions")
        .insert({
          user_id: member.id,
          email: member.email,
          full_name: profile?.full_name || null,
          plan_slug: "premium",
          billing_interval: interval,
          amount_usd: requestedCurrency === "USD" ? amount : null,
          amount_ngn: requestedCurrency === "NGN" ? amount : null,
          currency: requestedCurrency,
          payment_status: "pending",
        })
        .select()
        .single();

      if (insertErr) {
        // Race: another concurrent request for this same member won first
        // and the partial unique index rejected this insert. The database
        // is the real guarantee here - surface the same friendly message
        // rather than a raw 500.
        if (insertErr.code === "23505") {
          return NextResponse.json({ ok: false, error: "You already have a Premium Membership checkout in progress." }, { status: 400 });
        }
        return NextResponse.json({ ok: false, error: "Could not create subscription record" }, { status: 500 });
      }
      if (!row) {
        return NextResponse.json({ ok: false, error: "Could not create subscription record" }, { status: 500 });
      }
      subscriptionId = row.id;
    }

    const planId = await getOrCreatePaymentPlan({
      slug: "premium",
      title: "Premium Membership",
      interval,
      amount,
      currency: requestedCurrency,
    });

    await supabase
      .from("premium_membership_subscriptions")
      .update({ flutterwave_plan_id: planId })
      .eq("id", subscriptionId);

    const reference = generateReference("PREM");

    const { link } = await initializePayment({
      email: member.email,
      amount,
      currency: requestedCurrency,
      reference,
      callbackUrl: `${SITE_URL}/account/membership`,
      metadata: { type: "premium_membership", subscription_id: subscriptionId },
      paymentPlanId: planId,
    });

    await supabase
      .from("premium_membership_subscriptions")
      .update({ flutterwave_reference: reference })
      .eq("id", subscriptionId);

    return NextResponse.json({ ok: true, authorizationUrl: link });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
