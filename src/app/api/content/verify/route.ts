import { NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/payments/flutterwave";
import { markContentPurchasePaid } from "@/lib/payments/content";

export const runtime = "nodejs";

// Belt-and-suspenders alongside the webhook: the browser lands here right
// after Flutterwave checkout, before the webhook may have arrived. This
// re-verifies the transaction directly with Flutterwave (never trusts the
// client's say-so) before granting access.
export async function POST(req: Request) {
  try {
    const { reference } = await req.json();
    if (!reference) {
      return NextResponse.json({ ok: false, error: "reference is required" }, { status: 400 });
    }

    const data = await verifyTransaction(reference);
    if (data?.status !== "successful") {
      return NextResponse.json({ ok: false, error: "Payment not successful" }, { status: 400 });
    }

    const purchaseId = data?.meta?.purchase_id as string | undefined;
    if (!purchaseId) {
      return NextResponse.json({ ok: false, error: "Missing purchase reference" }, { status: 400 });
    }

    const result = await markContentPurchasePaid(purchaseId, reference);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: "Could not confirm purchase" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, itemType: result.itemType, itemSlug: result.itemSlug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
