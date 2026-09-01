import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { generateReference, initializePayment } from "@/lib/payments/flutterwave";
import { getCareerPricing, getActiveCareerPlan, isCareerPlanSlug, planRank, CAREER_PLAN_LABELS } from "@/lib/payments/careerTools";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://prowessdigitalsolutions.com";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const plan = String(body?.plan || "");
    const requestedCurrency = body?.currency === "NGN" ? "NGN" : "USD";

    if (!isCareerPlanSlug(plan)) {
      return NextResponse.json({ ok: false, error: "Choose a valid career plan." }, { status: 400 });
    }

    const pricing = await getCareerPricing();
    const amount = requestedCurrency === "NGN" ? pricing[plan].ngn : pricing[plan].usd;
    if (!amount) {
      return NextResponse.json({ ok: false, error: "This career plan is not priced in that currency yet." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Block buying a tier the member already has, or anything at or below
    // their highest tier ever purchased - a one-time purchase never
    // expires, so re-buying Basic while already on Premium/Pro would just
    // waste their money (getActiveCareerPlan already protects the access
    // itself by always keeping the highest tier regardless, but this stops
    // the wasted charge from happening in the first place).
    const currentPlan = await getActiveCareerPlan({ userId: member.id, email: member.email });
    if (currentPlan && planRank(currentPlan) >= planRank(plan)) {
      return NextResponse.json({ ok: false, error: `You already have ${CAREER_PLAN_LABELS[currentPlan]} career access.` }, { status: 400 });
    }

    const reference = generateReference("CAREER");
    const { data: profile } = await supabase
      .from("member_profiles")
      .select("full_name")
      .eq("id", member.id)
      .maybeSingle();

    const { data: row, error: insertErr } = await supabase
      .from("career_tool_purchases")
      .insert({
        user_id: member.id,
        email: member.email,
        full_name: profile?.full_name || null,
        plan_slug: plan,
        amount,
        currency: requestedCurrency,
        payment_status: "pending",
        flutterwave_reference: reference,
      })
      .select("id")
      .single();

    if (insertErr || !row) {
      return NextResponse.json({ ok: false, error: "Could not create career checkout." }, { status: 500 });
    }

    const { link } = await initializePayment({
      email: member.email,
      amount,
      currency: requestedCurrency,
      reference,
      callbackUrl: `${SITE_URL}/career-tools/success`,
      metadata: { type: "career_tools", purchase_id: row.id },
    });

    return NextResponse.json({ ok: true, authorizationUrl: link });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
