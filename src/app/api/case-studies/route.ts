import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// ✅ PAGINATED GET: /api/case-studies?published=true&page=1&pageSize=6
export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);

    // published=true|false (default true)
    const publishedParam = searchParams.get("published");
    const onlyPublished = publishedParam !== "false";

    // page + pageSize (default 1 and 6)
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.max(1, Number(searchParams.get("pageSize") || 6));

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("case_studies")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (onlyPublished) query = query.eq("is_published", true);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json(
      {
        ok: true,
        items: data ?? [],
        pagination: { page, pageSize, total, totalPages },
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json();

    // ✅ Parse results whether it comes as array or JSON string
    let results: any = null;

    if (body.results) {
      if (Array.isArray(body.results)) {
        results = body.results;
      } else if (typeof body.results === "string") {
        try {
          const parsed = JSON.parse(body.results);
          if (!Array.isArray(parsed)) {
            return NextResponse.json(
              { ok: false, error: "Results must be a JSON array." },
              { status: 400 }
            );
          }
          results = parsed;
        } catch {
          return NextResponse.json(
            { ok: false, error: "Results must be valid JSON." },
            { status: 400 }
          );
        }
      }
    }

    const payload = {
      title: String(body.title || "").trim(),
      slug: String(body.slug || "").trim(),
      category: String(body.category || "").trim(),
      business_size: String(body.business_size || "").trim(),
      challenge: String(body.challenge || "").trim(),
      solution: body.solution ? String(body.solution).trim() : null,
      image_url: body.image_url ? String(body.image_url).trim() : null,
      results,
      testimonial: body.testimonial ? String(body.testimonial).trim() : null,
      timeline_months:
        body.timeline_months === null || body.timeline_months === undefined
          ? null
          : Number(body.timeline_months),
      is_published: Boolean(body.is_published),
    };

    if (
      !payload.title ||
      !payload.slug ||
      !payload.category ||
      !payload.business_size ||
      !payload.challenge
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "title, slug, category, business_size, and challenge are required.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("case_studies")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, item: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
