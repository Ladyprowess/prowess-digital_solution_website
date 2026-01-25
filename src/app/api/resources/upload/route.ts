import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const file = form.get("file") as File | null;
    const cover = form.get("cover") as File | null;

    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const type = String(form.get("type") || "").trim();
    const category = String(form.get("category") || "").trim();
    const stage = String(form.get("stage") || "").trim();

    const reading_minutes_raw = String(form.get("reading_minutes") || "").trim();
    const reading_minutes = reading_minutes_raw ? Number(reading_minutes_raw) : null;

    if (!file || !title || !type || !category || !stage) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields (file, title, type, category, stage)." },
        { status: 400 }
      );
    }

    // 1) Upload resource file
    const safeName = file.name.replace(/\s+/g, "-").toLowerCase();
    const filePath = `${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("resources")
      .upload(filePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });
    }

    // 2) Upload cover (optional)
    let cover_path: string | null = null;

    if (cover) {
      const coverSafeName = cover.name.replace(/\s+/g, "-").toLowerCase();
      cover_path = `${Date.now()}-${coverSafeName}`;
      const coverBuffer = Buffer.from(await cover.arrayBuffer());

      const { error: coverUploadError } = await supabaseAdmin.storage
        .from("resource-covers")
        .upload(cover_path, coverBuffer, { contentType: cover.type, upsert: false });

      if (coverUploadError) {
        return NextResponse.json({ ok: false, error: coverUploadError.message }, { status: 500 });
      }
    }

    // 3) Insert into DB
    const { data: inserted, error: dbError } = await supabaseAdmin
      .from("resources")
      .insert([
        {
          title,
          description,
          type,
          category,
          stage,
          file_name: file.name,
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
          reading_minutes,
          cover_path,
          cover_url: null,
          downloads: 0,
          rating: 0,
          file_path: filePath,
        },
      ])
      .select("*")
      .single();

    if (dbError) {
      return NextResponse.json({ ok: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, inserted }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
