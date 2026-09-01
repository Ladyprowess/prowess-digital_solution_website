import { NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/payments/flutterwave";
import { markPremiumMembershipPaid } from "@/lib/payments/premiumMembership";

export const runtime = "nodejs";

// Belt-and-suspenders alongside the webhook: the browser lands back here
// right after Flutterwave checkout, before the webhook may have arrived.
// markPremiumMembershipPaid is reference-idempotent, so whichever of this
// route and the webhook fires first wins cleanly.
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

    const subscriptionId = data?.meta?.subscription_id as string | undefined;
    if (!subscriptionId) {
      return NextResponse.json({ ok: false, error: "Missing subscription reference" }, { status: 400 });
    }

    const result = await markPremiumMembershipPaid(subscriptionId, reference);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: "Could not confirm payment" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
