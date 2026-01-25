import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const file_path = String(body?.file_path || "").trim();

    if (!file_path) {
      return NextResponse.json(
        { ok: false, error: "Missing file_path" },
        { status: 400 }
      );
    }

    // ✅ FIX: call the function to get the client
    const supabase = await supabaseAdmin();

    const { data, error } = await supabase.storage
      .from("resources")
      // inline viewing (not forced download)
      .createSignedUrl(file_path, 60 * 10, { download: false });

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Could not create link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, url: data.signedUrl });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
