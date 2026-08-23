import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { initializePayment, generateReference } from "@/lib/payments/flutterwave";
import { getItemPrice } from "@/lib/payments/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://prowessdigitalsolutions.com";

const VALID_ITEM_TYPES = ["resource", "course", "career_path"];

export async function POST(req: Request) {
  try {
    // No more guest checkout by typing an email - a real signed-in session
    // is required, and the email always comes from that verified session,
    // never from client input (removes any risk of buying under someone
    // else's address, and matches what the user asked for: every paid
    // purchase requires being logged in first).
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }
    const email = member.email;

    const body = await req.json();
    const { itemType, itemId } = body || {};

    if (!itemType || !itemId) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }
    if (!VALID_ITEM_TYPES.includes(itemType)) {
      return NextResponse.json({ ok: false, error: "Invalid item type" }, { status: 400 });
    }

    // The price is always read from the item's own row - never trust an
    // amount supplied by the client.
    const priced = await getItemPrice(itemType, itemId);
    if (!priced) {
      return NextResponse.json({ ok: false, error: "This item isn't available for purchase." }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: row, error: insertErr } = await supabase
      .from("purchases")
      .insert({
        email,
        item_type: itemType,
        item_id: itemId,
        amount: priced.amount,
        currency: priced.currency,
        payment_status: "pending",
      })
      .select()
      .single();

    if (insertErr || !row) {
      return NextResponse.json({ ok: false, error: "Could not create purchase record" }, { status: 500 });
    }

    const reference = generateReference("CONTENT");

    const { link } = await initializePayment({
      email,
      amount: priced.amount,
      currency: priced.currency === "NGN" ? "NGN" : "USD",
      reference,
      callbackUrl: `${SITE_URL}/purchase/success`,
      metadata: { type: "content_purchase", purchase_id: row.id },
    });

    await supabase.from("purchases").update({ flutterwave_reference: reference }).eq("id", row.id);

    return NextResponse.json({ ok: true, authorizationUrl: link });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
