import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { getOrCreatePaymentPlan, initializePayment, generateReference } from "@/lib/payments/flutterwave";
import { packages, annualTotalPrice } from "@/content/site";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://prowessdigitalsolutions.com";

export async function POST(req: Request) {
  try {
    // A real signed-in session is required to pay - the intake form's own
    // email field can still differ from the account email (a business
    // contact address, say), this just gates who's allowed to check out.
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    const body = await req.json();
    const {
      planSlug,
      interval,
      currency,
      fullName,
      email,
      phone,
      businessName,
      website,
      businessDescription,
      serviceFocus,
    } = body || {};

    if (!planSlug || !interval || !fullName || !email || !businessName || !businessDescription || !serviceFocus) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }
    if (interval !== "monthly" && interval !== "annually") {
      return NextResponse.json({ ok: false, error: "Invalid billing interval" }, { status: 400 });
    }

    const plan = packages.find((p) => p.slug === planSlug);
    if (!plan) {
      return NextResponse.json({ ok: false, error: "Unknown plan" }, { status: 400 });
    }

    // The client picks which currency to pay in; the server picks the
    // amount for that currency, never trusting an amount from the client.
    // Falls back to USD if NGN wasn't requested or isn't set for this tier.
    if (currency != null && currency !== "USD" && currency !== "NGN") return NextResponse.json({ ok: false, error: "Unsupported currency" }, { status: 400 });
    const resolvedCurrency: "USD" | "NGN" = currency === "NGN" && plan.monthlyPriceNGN != null ? "NGN" : "USD";
    const monthlyAmount = resolvedCurrency === "USD" ? plan.monthlyPrice : (plan.monthlyPriceNGN as number);
    const amount = interval === "monthly" ? monthlyAmount : annualTotalPrice(monthlyAmount);

    const supabase = supabaseAdmin();
    const { data: row, error: insertErr } = await supabase
      .from("membership_subscriptions")
      .insert({
        plan_slug: planSlug,
        billing_interval: interval,
        amount_usd: resolvedCurrency === "USD" ? amount : null,
        amount_ngn: resolvedCurrency === "NGN" ? amount : null,
        currency: resolvedCurrency,
        full_name: fullName,
        email,
        phone: phone || null,
        business_name: businessName,
        website: website || null,
        business_description: businessDescription,
        service_focus: serviceFocus,
        payment_status: "pending",
      })
      .select()
      .single();

    if (insertErr || !row) {
      return NextResponse.json({ ok: false, error: "Could not create subscription record" }, { status: 500 });
    }

    const planId = await getOrCreatePaymentPlan({
      slug: planSlug,
      title: plan.title,
      interval,
      amount,
      currency: resolvedCurrency,
    });

    const { error: planError } = await supabase
      .from("membership_subscriptions")
      .update({ flutterwave_plan_id: planId })
      .eq("id", row.id);

    if (planError) throw new Error("Could not save billing plan");
    const reference = generateReference("MEM");
    const { error: referenceError } = await supabase.from("membership_subscriptions")
      .update({ flutterwave_reference: reference }).eq("id", row.id);
    if (referenceError) throw new Error("Could not save payment reference. Please try again.");

    const { link } = await initializePayment({
      email,
      amount,
      currency: resolvedCurrency,
      reference,
      callbackUrl: `${SITE_URL}/pricing/success`,
      metadata: { type: "membership", subscription_id: row.id },
      paymentPlanId: planId,
    });

    return NextResponse.json({ ok: true, authorizationUrl: link });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
