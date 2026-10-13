import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function searchTermsForQuery(q: string): string[] {
  const terms = [q, ...q.split(/\s+/).filter(term => term.length > 2)];
  const normalized = q.toLowerCase();
  if (normalized.includes("sexual wellness")) {
    terms.push("sex");
  }
  return Array.from(new Set(terms.map((term) => term.trim()).filter(Boolean)));
}

type ResourceRow = {
  cover_path?: string | null;
  [key: string]: unknown;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || "").trim().slice(0, 200);
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
    const showOnHomepage = (searchParams.get("show_on_homepage") || "").trim();
    const excludeShowOnHomepage = (searchParams.get("exclude_show_on_homepage") || "").trim();
    const excludeId = (searchParams.get("exclude_id") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(24, Math.max(1, Number(searchParams.get("pageSize")) || 6));

    let query = supabaseAdmin().from("resources").select("*", { count: "exact" })
      .eq("status", "published");

    // show_in_library and show_on_homepage are independent placement flags
    // (matches the video homepage query's precedent in src/app/page.tsx) --
    // a resource can be homepage-curated without also being in the general
    // library, so an explicit show_on_homepage request skips the
    // show_in_library gate rather than requiring both.
    if (showOnHomepage === "true") query = query.eq("show_on_homepage", true);
    else if (showInBusiness !== "true" && showInCareer !== "true") query = query.eq("show_in_library", true);
    // Lets a caller that already shows show_on_homepage resources in their
    // own curated section (the homepage's "Resources worth exploring")
    // avoid pulling the same row into a second, un-curated section further
    // down the same page -- nothing stops an admin setting both flags true.
    if (excludeShowOnHomepage === "true") query = query.eq("show_on_homepage", false);

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
    // Lets a caller that already rendered a resource in its own curated
    // rail (Featured, For Business Owners, For Your Career, Templates &
    // Checklists) exclude those same ids from a separate "everything"
    // section below, instead of the same handful of resources appearing
    // twice on one page load -- most visible right now simply because so
    // few resources exist, but the exclusion holds regardless of count.
    if (excludeId) {
      const excluded = excludeId.split(",").map((v) => v.trim()).filter(Boolean);
      if (excluded.length > 0) query = query.not("id", "in", `(${excluded.join(",")})`);
    }

    // search
    if (q) {
      const searchTerms = searchTermsForQuery(q);
      query = query.or(searchTerms.flatMap((term) => [`title.ilike.${JSON.stringify(`%${term}%`)}`, `description.ilike.${JSON.stringify(`%${term}%`)}`]).join(","));
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

    // Always return a usable cover_url from cover_path.
    const itemsWithCover = await Promise.all(
      (items as ResourceRow[]).map(async (r) => {
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
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
