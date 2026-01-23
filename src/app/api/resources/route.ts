import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || "").trim();
    const sort = (searchParams.get("sort") || "popular").trim(); // popular | newest | rating
    const category = (searchParams.get("category") || "").trim();
    const stage = (searchParams.get("stage") || "").trim();
    const type = (searchParams.get("type") || "").trim();

    const supabase = supabaseAdmin();

    let query = supabase
      .from("resources")
      .select("*")
      .eq("is_published", true);

    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    if (category) query = query.eq("category", category);
    if (stage) query = query.eq("stage", stage);
    if (type) query = query.eq("type", type);

    if (sort === "newest") query = query.order("created_at", { ascending: false });
    else if (sort === "rating") query = query.order("rating", { ascending: false });
    else query = query.order("downloads", { ascending: false }); // popular

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, items: data || [] });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
