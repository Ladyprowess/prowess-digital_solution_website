import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { initializePayment, generateReference } from "@/lib/payments/flutterwave";
import { SKILL_TO_BUSINESS_PRICE_USD as PRICE_USD, SKILL_TO_BUSINESS_PRICE_NGN as PRICE_NGN } from "@/lib/skillToBusinessPricing";

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
    const { fullName, email, phone, skillOrBusiness, currency } = body || {};

    if (!fullName || !email || !skillOrBusiness) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // The client picks which currency to pay in; the server picks the
    // amount for that currency, never trusting an amount from the client.
    const resolvedCurrency: "USD" | "NGN" = currency === "NGN" && PRICE_NGN != null ? "NGN" : "USD";
    const amount = resolvedCurrency === "USD" ? PRICE_USD : (PRICE_NGN as number);

    const supabase = supabaseAdmin();
    const { data: row, error: insertErr } = await supabase
      .from("skill_to_business_purchases")
      .insert({
        full_name: fullName,
        email,
        phone: phone || null,
        skill_or_business: skillOrBusiness,
        amount_usd: resolvedCurrency === "USD" ? amount : null,
        amount_ngn: resolvedCurrency === "NGN" ? amount : null,
        currency: resolvedCurrency,
        payment_status: "pending",
      })
      .select()
      .single();

    if (insertErr || !row) {
      return NextResponse.json({ ok: false, error: "Could not create enrollment record" }, { status: 500 });
    }

    const reference = generateReference("STB");

    const { link } = await initializePayment({
      email,
      amount,
      currency: resolvedCurrency,
      reference,
      callbackUrl: `${SITE_URL}/skill-to-business/success`,
      metadata: { type: "skill_to_business", purchase_id: row.id },
    });

    await supabase
      .from("skill_to_business_purchases")
      .update({ flutterwave_reference: reference })
      .eq("id", row.id);

    return NextResponse.json({ ok: true, authorizationUrl: link });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
