import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("consultation_services")
      .select("id,name,duration_minutes,price_ngn,is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: true }); // ✅ no sort_order

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      items: data ?? [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
