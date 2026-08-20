import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminOrCron } from "@/lib/auth/verifyAdmin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = "nodejs";

// The admin-only equivalent of the old public /api/resources/upload -
// writes to the same "resources" and "resource-covers" storage buckets
// and returns file_path/cover_path in the same shape those legacy columns
// already expect, so this plugs straight into the existing, already-working
// signing/entitlement pipeline (/api/content/access, /api/resources) instead
// of inventing a second one. Gated by a real admin session instead of being
// a public, unauthenticated route.
export async function POST(req: NextRequest) {
  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const cover = form.get("cover") as File | null;

    if (!file && !cover) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result: { file_path?: string; file_name?: string; file_type?: string; file_size?: number; cover_path?: string } = {};

    if (file) {
      const safeName = file.name.replace(/\s+/g, "-").toLowerCase();
      const filePath = `${Date.now()}-${safeName}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error } = await supabase.storage.from("resources").upload(filePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (error) return NextResponse.json({ error: `File upload failed: ${error.message}` }, { status: 500 });
      result.file_path = filePath;
      result.file_name = file.name;
      result.file_type = file.type || "application/octet-stream";
      result.file_size = file.size;
    }

    if (cover) {
      const safeName = cover.name.replace(/\s+/g, "-").toLowerCase();
      const coverPath = `${Date.now()}-${safeName}`;
      const buffer = Buffer.from(await cover.arrayBuffer());
      const { error } = await supabase.storage.from("resource-covers").upload(coverPath, buffer, {
        contentType: cover.type || "image/jpeg",
        upsert: false,
      });
      if (error) return NextResponse.json({ error: `Cover upload failed: ${error.message}` }, { status: 500 });
      result.cover_path = coverPath;
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 500 });
  }
}
