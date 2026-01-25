import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || "").trim();
    const sort = (searchParams.get("sort") || "popular").toLowerCase();
    const category = (searchParams.get("category") || "").trim();
    const stage = (searchParams.get("stage") || "").trim();
    const type = (searchParams.get("type") || "").trim();

    let query = supabaseAdmin.from("resources").select("*");

    // filters
    if (category) query = query.eq("category", category);
    if (stage) query = query.eq("stage", stage);
    if (type) query = query.eq("type", type);

    // search
    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    // sorting
    if (sort === "popular") {
      query = query
        .order("downloads", { ascending: false })
        .order("created_at", { ascending: false });
    } else if (sort === "rating") {
      query = query
        .order("rating", { ascending: false })
        .order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const items = data || [];

    // ✅ Always return a usable cover_url (fresh signed url from cover_path)
    const itemsWithCover = await Promise.all(
      items.map(async (r: any) => {
        // ✅ If we have cover_path, ALWAYS return a signed url (works even if bucket is private)
        if (r.cover_path) {
          const { data: signed, error: signErr } = await supabaseAdmin().storage
            .from("resource-covers")
            .createSignedUrl(r.cover_path, 60 * 60); // 1 hour
    
          if (!signErr && signed?.signedUrl) {
            return { ...r, cover_url: signed.signedUrl };
          }
        }
  

        // Otherwise no cover
        return r;
      })
    );

    return NextResponse.json({ ok: true, items: itemsWithCover }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}