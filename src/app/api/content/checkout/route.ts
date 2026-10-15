import { paymentPrice } from "@/lib/payments/validation";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { initializePayment, generateReference } from "@/lib/payments/flutterwave";
import { getItemPrice } from "@/lib/payments/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.prowessdigitalsolutions.com";

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
    const { itemType, itemId, currency, format, shipping } = body || {};

    if (!itemType || !itemId) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }
    if (!VALID_ITEM_TYPES.includes(itemType)) {
      return NextResponse.json({ ok: false, error: "Invalid item type" }, { status: 400 });
    }

    // The price is always read from the item's own row - never trust an
    // amount supplied by the client. The client picks which currency to pay
    // in; the server picks the amount for that currency, or falls back to
    // whichever currency the item actually has a price in if the client
    // didn't send one (legacy single-currency items, or an old client).
    const priced = await getItemPrice(itemType, itemId);
    if (!priced) {
      return NextResponse.json({ ok: false, error: "This item isn't available for purchase." }, { status: 400 });
    }

    const requestedCurrency = currency;
    let resolvedCurrency: "USD" | "NGN";
    let amount: number | null;
    let purchaseFormat: "read" | "download" | "hardcopy" | null = null;
    let shippingFields: { full_name: string; phone: string; address: string } | null = null;

    if (priced.formats) {
      // Format pricing is a hard requirement here, not a fallback - there
      // is no generic price left on this item for an unset/invalid format
      // to fall back to (see getItemPrice).
      const requestedFormat: "read" | "download" | "hardcopy" | null =
        format === "read" || format === "download" || format === "hardcopy" ? format : null;
      if (!requestedFormat || !priced.formats[requestedFormat]) {
        return NextResponse.json({ ok: false, error: "Please choose a valid format for this ebook." }, { status: 400 });
      }
      purchaseFormat = requestedFormat;

      const formatPrice = priced.formats[requestedFormat];
      const selected = paymentPrice(formatPrice.usd, formatPrice.ngn, requestedCurrency);
      if (!selected) return NextResponse.json({ ok: false, error: "This format is not priced in that currency." }, { status: 400 });
      ({ currency: resolvedCurrency, amount } = selected);

      if (requestedFormat === "hardcopy") {
        const fullName = String(shipping?.fullName || "").trim();
        const phone = String(shipping?.phone || "").trim();
        const address = String(shipping?.address || "").trim();
        if (!fullName || !phone || !address) {
          return NextResponse.json({ ok: false, error: "Please fill in your delivery details." }, { status: 400 });
        }
        shippingFields = { full_name: fullName, phone, address };
      }
    } else {
      const selected = paymentPrice(priced.usd, priced.ngn, requestedCurrency);
      if (!selected) return NextResponse.json({ ok: false, error: "This item is not priced in that currency." }, { status: 400 });
      ({ currency: resolvedCurrency, amount } = selected);
    }

    if (!amount) {
      return NextResponse.json({ ok: false, error: "This item isn't priced in that currency." }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: row, error: insertErr } = await supabase
      .from("purchases")
      .insert({
        email,
        user_id: member.id,
        item_type: itemType,
        item_id: itemId,
        amount,
        currency: resolvedCurrency,
        format: purchaseFormat,
        shipping_full_name: shippingFields?.full_name ?? null,
        shipping_phone: shippingFields?.phone ?? null,
        shipping_address: shippingFields?.address ?? null,
        payment_status: "pending",
      })
      .select()
      .single();

    if (insertErr || !row) {
      return NextResponse.json({ ok: false, error: "Could not create purchase record" }, { status: 500 });
    }

    const reference = generateReference("CONTENT");
    const { error: referenceError } = await supabase.from("purchases")
      .update({ flutterwave_reference: reference }).eq("id", row.id);
    if (referenceError) throw new Error("Could not save payment reference. Please try again.");

    const { link } = await initializePayment({
      email,
      amount,
      currency: resolvedCurrency,
      reference,
      callbackUrl: `${SITE_URL}/purchase/success`,
      metadata: { type: "content_purchase", purchase_id: row.id },
    });

    return NextResponse.json({ ok: true, authorizationUrl: link });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
