import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json({ error: "Missing reference." }, { status: 400 });
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
        },
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData?.status) {
      return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    }

    const payment = verifyData.data;
    if (payment.status !== "success") {
      return NextResponse.json({ error: "Payment not successful." }, { status: 400 });
    }

    const meta = payment.metadata || {};
    const event_id = meta.event_id;
    const full_name = meta.full_name;
    const phone = meta.phone || "";
    const email = payment.customer?.email;

    if (!event_id || !full_name || !email) {
      return NextResponse.json({ error: "Missing registration details." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { error: regError } = await supabase.from("event_registrations").insert([
      {
        event_id,
        full_name: String(full_name).trim(),
        email: String(email).trim(),
        phone: phone ? String(phone).trim() : null,
        payment_status: "paid",
        paystack_reference: String(reference),
      },
    ]);

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}