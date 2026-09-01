import { NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/payments/flutterwave";
import { markCareerToolPurchasePaid } from "@/lib/payments/careerTools";

export const runtime = "nodejs";

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
      return NextResponse.json({ ok: false, error: "Missing career tools purchase reference" }, { status: 400 });
    }

    const result = await markCareerToolPurchasePaid(purchaseId, reference);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: "Could not confirm payment" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
