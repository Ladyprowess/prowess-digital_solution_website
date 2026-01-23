import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

// GET /api/case-studies?published=true|false
export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdmin();

    const { searchParams } = new URL(req.url);
    const publishedParam = searchParams.get("published"); // "true" | "false" | null
    const onlyPublished = publishedParam !== "false";

    let query = supabase.from("case_studies").select("*").order("created_at", {
      ascending: false,
    });

    if (onlyPublished) query = query.eq("is_published", true);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, items: data ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}

// POST /api/case-studies
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json();

    const title = String(body?.title || "").trim();
    const category = String(body?.category || "").trim();
    const business_size = String(body?.business_size || "").trim();
    const challenge = String(body?.challenge || "").trim();

    if (!title || !category || !business_size || !challenge) {
      return NextResponse.json(
        {
          ok: false,
          error: "title, category, business_size, and challenge are required.",
        },
        { status: 400 }
      );
    }

    const baseSlug = slugify(title);
    const slug = body?.slug ? slugify(String(body.slug)) : baseSlug;

    // Optional fields
    const solution =
      body?.solution === null || body?.solution === undefined
        ? null
        : String(body.solution).trim();

    const image_url =
      body?.image_url === null || body?.image_url === undefined
        ? null
        : String(body.image_url).trim();

    const is_published = Boolean(body?.is_published);

    // Results can be array or JSON string
    let results: any = null;
    if (body?.results) {
      if (Array.isArray(body.results)) results = body.results;
      else {
        try {
          results = JSON.parse(String(body.results));
        } catch {
          return NextResponse.json(
            { ok: false, error: "results must be valid JSON." },
            { status: 400 }
          );
        }
      }
    }

    const testimonial =
      body?.testimonial === null || body?.testimonial === undefined
        ? null
        : String(body.testimonial).trim();

    const timeline_months =
      body?.timeline_months === null || body?.timeline_months === undefined
        ? null
        : Number(body.timeline_months);

    const insertPayload: any = {
      title,
      slug,
      category,
      business_size,
      challenge,
      solution,
      image_url,
      is_published,
      results,
      testimonial,
      timeline_months,
    };

    const { data, error } = await supabase
      .from("case_studies")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, item: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
