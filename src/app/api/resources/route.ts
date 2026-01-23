import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const sort = (searchParams.get("sort") || "newest").toLowerCase();
    const q = (searchParams.get("q") || "").trim();

    // Base query
    let query = supabaseAdmin.from("resources").select("*");

    // Optional search (only if your table has title/description)
    if (q) {
      // If your column names differ, change title/description here.
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    // Safe sorting (only use columns that exist in your DB)
    // Based on your ResourceCard + types: downloads, rating, created_at
    if (sort === "popular") {
      query = query.order("downloads", { ascending: false }).order("created_at", { ascending: false });
    } else if (sort === "top") {
      query = query.order("rating", { ascending: false }).order("created_at", { ascending: false });
    } else {
      // newest/default
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error("GET /api/resources error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, items: data || [] }, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/resources crash:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
