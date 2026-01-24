import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// GET: fetch published roles for the public careers page
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("careers_roles")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, items: data ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}

// POST: admin creates a role
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json().catch(() => null);

    const payload = {
      title: String(body?.title || "").trim(),
      location: body?.location ? String(body.location).trim() : null,
      job_type: body?.job_type ? String(body.job_type).trim() : null,
      level: body?.level ? String(body.level).trim() : null,
      summary: body?.summary ? String(body.summary).trim() : null,
      responsibilities: body?.responsibilities ? String(body.responsibilities).trim() : null,
      requirements: body?.requirements ? String(body.requirements).trim() : null,
      apply_url: body?.apply_url ? String(body.apply_url).trim() : null,
      is_published: Boolean(body?.is_published),
    };

    if (!payload.title) {
      return NextResponse.json(
        { ok: false, error: "title is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("careers_roles")
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
