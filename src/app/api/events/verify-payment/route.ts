import { NextResponse } from "next/server";
import { markEventPaid } from "@/lib/payments/event";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const { reference } = await req.json();
    if (typeof reference !== "string" || !reference.trim()) return NextResponse.json({ error: "Missing reference." }, { status: 400 });
    const result = await markEventPaid(reference);
    return NextResponse.json(result.ok ? result : { error: "Could not confirm payment. Please retry without paying again." }, { status: result.ok ? 200 : 500 });
  } catch {
    return NextResponse.json({ error: "Could not confirm payment. Please retry without paying again." }, { status: 500 });
  }
}
