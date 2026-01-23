import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const file = form.get("file") as File | null;
    const cover = form.get("cover") as File | null; // ✅ cover image file

    // Required fields
    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const type = String(form.get("type") || "").trim();
    const category = String(form.get("category") || "").trim();
    const stage = String(form.get("stage") || "").trim();

    // Optional fields
    const reading_minutes_raw = String(form.get("reading_minutes") || "").trim();
    const reading_minutes = reading_minutes_raw ? Number(reading_minutes_raw) : null;

    if (!file || !title || !type || !category || !stage) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Missing required fields (file, title, type, category, stage).",
        }),
        { status: 400 }
      );
    }

    // ✅ 1) Upload resource file to bucket: resources
    const safeName = file.name.replace(/\s+/g, "-").toLowerCase();
    const filePath = `${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("resources")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return new Response(JSON.stringify({ ok: false, error: uploadError.message }), {
        status: 500,
      });
    }

    // ✅ 2) Upload cover image (optional) to bucket: resource-covers
    // Make sure bucket exists in Supabase Storage: resource-covers
    let cover_url: string | null = null;

    if (cover) {
      const coverSafeName = cover.name.replace(/\s+/g, "-").toLowerCase();
      const coverPath = `${Date.now()}-${coverSafeName}`;
      const coverBuffer = Buffer.from(await cover.arrayBuffer());

      const { error: coverUploadError } = await supabaseAdmin.storage
        .from("resource-covers")
        .upload(coverPath, coverBuffer, {
          contentType: cover.type,
          upsert: false,
        });

      if (coverUploadError) {
        return new Response(JSON.stringify({ ok: false, error: coverUploadError.message }), {
          status: 500,
        });
      }

      const { data: coverPublic } = supabaseAdmin.storage
        .from("resource-covers")
        .getPublicUrl(coverPath);

      cover_url = coverPublic?.publicUrl || null;
    }

    // ✅ 3) Insert into DB (ONE time)
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
          cover_url,
cover_path: cover ? coverPath : null,
          downloads: 0,
          rating: 0,
          file_path: filePath,
        },
      ])
      .select("*");

    if (dbError) {
      return new Response(JSON.stringify({ ok: false, error: dbError.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ ok: true, inserted }), { status: 200 });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || "Server error" }),
      { status: 500 }
    );
  }
}
