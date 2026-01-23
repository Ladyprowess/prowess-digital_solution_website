import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { file_path } = await req.json();

    if (!file_path) {
      return NextResponse.json({ ok: false, error: "Missing file_path" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase.storage
      .from("resource_files")
      .createSignedUrl(file_path, 60 * 10); // 10 minutes

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url: data.signedUrl });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
