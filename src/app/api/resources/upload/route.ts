import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // ✅ Parse form data (metadata only)
    const form = await req.formData();

    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const type = String(form.get("type") || "").trim();
    const category = String(form.get("category") || "").trim();
    const stage = String(form.get("stage") || "").trim();

    const reading_minutes_raw = String(form.get("reading_minutes") || "").trim();
    const reading_minutes = reading_minutes_raw
      ? Number(reading_minutes_raw)
      : null;

    const file_path = String(form.get("file_path") || "");
    const file_name = String(form.get("file_name") || "");
    const file_size = Number(form.get("file_size") || 0);
    const file_type = String(form.get("file_type") || "");
    const cover_path = String(form.get("cover_path") || "") || null;

    if (!title || !type || !category || !stage || !file_path) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    // ✅ Insert into DB
    const { data: inserted, error: dbError } = await supabaseAdmin
      .from("resources")
      .insert([
        {
          title,
          description,
          type,
          category,
          stage,
          file_name,
          file_type,
          file_size,
          reading_minutes,
          cover_path,
          cover_url: null,
          downloads: 0,
          rating: 0,
          file_path,
        },
      ])
      .select("*")
      .single();

    if (dbError) {
      return NextResponse.json(
        { ok: false, error: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, inserted }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}