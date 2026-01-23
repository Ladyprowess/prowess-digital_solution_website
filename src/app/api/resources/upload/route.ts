import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const type = String(formData.get("type") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const stage = String(formData.get("stage") || "").trim();
    const reading_minutes = Number(formData.get("reading_minutes") || 0) || null;

    const file = formData.get("file") as File | null;
    const cover = formData.get("cover") as File | null; // optional

    if (!title || !description || !type || !category || !stage || !file) {
      return NextResponse.json(
        { ok: false, error: "Please fill all fields and upload the file." },
        { status: 400 }
      );
    }

    // File limits
    const maxFileBytes = 20 * 1024 * 1024; // 20MB
    if (file.size > maxFileBytes) {
      return NextResponse.json(
        { ok: false, error: "File is too large. Max size is 20MB." },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Upload main resource file (private bucket)
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const fileExt = (file.name.split(".").pop() || "file").toLowerCase();
    const filePath = `resources/${Date.now()}-${safeTitle}.${fileExt}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: fileErr } = await supabase.storage
      .from("resource_files")
      .upload(filePath, fileBuffer, { contentType: file.type, upsert: false });

    if (fileErr) {
      return NextResponse.json({ ok: false, error: fileErr.message }, { status: 500 });
    }

    // Upload cover image (public bucket) optional
    let cover_url: string | null = null;

    if (cover) {
      const coverExt = (cover.name.split(".").pop() || "png").toLowerCase();
      const coverPath = `covers/${Date.now()}-${safeTitle}.${coverExt}`;
      const coverBuffer = Buffer.from(await cover.arrayBuffer());

      const { error: coverErr } = await supabase.storage
        .from("resource_covers")
        .upload(coverPath, coverBuffer, { contentType: cover.type, upsert: false });

      if (coverErr) {
        // cleanup main file if cover fails
        await supabase.storage.from("resource_files").remove([filePath]);
        return NextResponse.json({ ok: false, error: coverErr.message }, { status: 500 });
      }

      const { data } = supabase.storage.from("resource_covers").getPublicUrl(coverPath);
      cover_url = data.publicUrl;
    }

    // Insert DB row
    const { error: dbErr } = await supabase.from("resources").insert([
      {
        title,
        description,
        type,
        category,
        stage,
        file_path: filePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        cover_url,
        reading_minutes,
        is_published: true,
      },
    ]);

    if (dbErr) {
      await supabase.storage.from("resource_files").remove([filePath]);
      return NextResponse.json({ ok: false, error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
