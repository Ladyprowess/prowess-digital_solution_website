import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    const stage = (searchParams.get("stage") || "").trim();
    const type = (searchParams.get("type") || "").trim();
    const access = (searchParams.get("access") || "").trim();
    const audience = (searchParams.get("audience") || "").trim();
    const resourceType = (searchParams.get("resource_type") || "").trim();
    const excludeResourceType = (searchParams.get("exclude_resource_type") || "").trim();
    const useCase = (searchParams.get("use_case") || "").trim();
    const featured = (searchParams.get("featured") || "").trim();
    const showInBusiness = (searchParams.get("show_in_business") || "").trim();
    const showInCareer = (searchParams.get("show_in_career") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(24, Math.max(1, Number(searchParams.get("pageSize")) || 6));

    let query = supabaseAdmin().from("resources").select("*", { count: "exact" })
      .eq("status", "published")
      .eq("show_in_library", true);

    // filters
    if (category) query = query.eq("category", category);
    if (stage) query = query.eq("stage", stage);
    if (type) query = query.eq("type", type);
    if (access) query = query.eq("access", access);
    if (audience) query = query.in("audience", audience.split(","));
    if (resourceType) query = query.in("resource_type", resourceType.split(","));
    if (excludeResourceType) {
      const excluded = excludeResourceType.split(",").map((v) => v.trim()).filter(Boolean);
      if (excluded.length > 0) query = query.not("resource_type", "in", `(${excluded.join(",")})`);
    }
    if (useCase) query = query.eq("use_case", useCase);
    if (featured === "true") query = query.eq("featured", true);
    if (showInBusiness === "true") query = query.eq("show_in_business", true);
    if (showInCareer === "true") query = query.eq("show_in_career", true);

    // search
    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    // Newest-first only -- "popular"/"rating" sorts used to order by
    // downloads/rating, but nothing writes non-zero values to either column
    // outside the legacy upload flow (removed), so those sorts never
    // differentiated real content from a tie at zero.
    // Secondary order by id -- created_at ties (common on seeded/imported
    // batches) would otherwise let a row appear on two pages or neither
    // between requests, since Postgres doesn't guarantee stable tie order.
    query = query.order("created_at", { ascending: false }).order("id", { ascending: true });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);

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

    return NextResponse.json({ ok: true, items: itemsWithCover, total: count || 0 }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}