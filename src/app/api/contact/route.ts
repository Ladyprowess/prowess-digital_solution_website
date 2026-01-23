import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const full_name = String(body.full_name || "").trim();
    const email = String(body.email || "").trim();
    const topic = String(body.topic || "").trim();
    const message = String(body.message || "").trim();

    // Honeypot (bots)
    const website = String(body.website || "").trim();
    if (website) return NextResponse.json({ ok: true });

    if (!full_name || !email || !topic || !message) {
      return NextResponse.json(
        { ok: false, error: "Please fill in all fields." },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    const { error } = await supabase.from("contact_messages").insert([
      { full_name, email, topic, message, source: "website" },
    ]);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
