import { NextResponse } from "next/server";
import { markConsultationPaid } from "@/lib/payments/consultation";

export const runtime = "nodejs";

// Belt-and-suspenders alongside the webhook: the browser lands here right
// after Flutterwave checkout, before the webhook may have arrived. This
// re-verifies the transaction directly with Flutterwave (never trusts the
// client's say-so) before marking anything paid.
export async function POST(req: Request) {
  try {
    const { reference } = await req.json();
    if (!reference) {
      return NextResponse.json({ ok: false, error: "Missing reference." }, { status: 400 });
    }

    const result = await markConsultationPaid(reference);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, status: "paid" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
