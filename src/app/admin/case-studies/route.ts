import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function unauthorised() {
  return NextResponse.json({ ok: false, error: "Unauthorised" }, { status: 401 });
}

function makeSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  try {
    // ✅ Admin secret check (no login system)
    const token = req.headers.get("x-admin-token");
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) return unauthorised();

    const body = await req.json().catch(() => null);

    const title = String(body?.title || "").trim();
    const category = String(body?.category || "").trim();
    const business_size = String(body?.business_size || "").trim();
    const challenge = String(body?.challenge || "").trim();

    const solution = body?.solution ? String(body.solution).trim() : null;
    const results = body?.results ? String(body.results).trim() : null;
    const image_url = body?.image_url ? String(body.image_url).trim() : null;
    const is_published = typeof body?.is_published === "boolean" ? body.is_published : true;

    if (!title || !category || !business_size || !challenge) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: title, category, business_size, challenge" },
        { status: 400 }
      );
    }

    const slug = body?.slug ? String(body.slug).trim() : makeSlug(title);

    const { data, error } = await supabase
      .from("case_studies")
      .insert([
        {
          title,
          slug,
          category,
          business_size,
          challenge,
          solution,
          results,
          image_url,
          is_published,
        },
      ])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Failed" }, { status: 500 });
  }
}
