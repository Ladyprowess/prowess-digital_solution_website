import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOrCreatePlan, initializeSubscriptionTransaction } from "@/lib/payments/paystack";
import { packages, annualTotalPrice } from "@/content/site";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://prowessdigitalsolutions.com";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      planSlug,
      interval,
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

    const amountUSD = interval === "monthly" ? plan.monthlyPrice : annualTotalPrice(plan.monthlyPrice);

    const supabase = supabaseAdmin();
    const { data: row, error: insertErr } = await supabase
      .from("membership_subscriptions")
      .insert({
        plan_slug: planSlug,
        billing_interval: interval,
        amount_usd: amountUSD,
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

    const planCode = await getOrCreatePlan({
      slug: planSlug,
      title: plan.title,
      interval,
      amountUSD,
    });

    await supabase
      .from("membership_subscriptions")
      .update({ paystack_plan_code: planCode })
      .eq("id", row.id);

    const { authorizationUrl, reference } = await initializeSubscriptionTransaction({
      email,
      planCode,
      amountUSD,
      callbackUrl: `${SITE_URL}/pricing/success`,
      metadata: { type: "membership", subscription_id: row.id },
    });

    await supabase
      .from("membership_subscriptions")
      .update({ paystack_reference: reference })
      .eq("id", row.id);

    return NextResponse.json({ ok: true, authorizationUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
