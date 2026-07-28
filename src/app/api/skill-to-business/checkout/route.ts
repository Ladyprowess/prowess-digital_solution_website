import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { initializePayment, generateReference } from "@/lib/payments/flutterwave";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://prowessdigitalsolutions.com";
const PRICE_USD = 100;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, phone, skillOrBusiness } = body || {};

    if (!fullName || !email || !skillOrBusiness) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: row, error: insertErr } = await supabase
      .from("skill_to_business_purchases")
      .insert({
        full_name: fullName,
        email,
        phone: phone || null,
        skill_or_business: skillOrBusiness,
        amount_usd: PRICE_USD,
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
      amount: PRICE_USD,
      currency: "USD",
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
