import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const file_path = searchParams.get("file_path");

  if (!file_path) {
    return NextResponse.json({ ok: false, error: "Missing file_path" }, { status: 400 });
  }

  // ✅ IMPORTANT: call the function to get the client
  const supabase = supabaseAdmin();

  const { data, error } = await supabase.storage
    .from("resources-files")
    .createSignedUrl(file_path, 60 * 10);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Could not create signed URL" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(data.signedUrl, { status: 302 });
}