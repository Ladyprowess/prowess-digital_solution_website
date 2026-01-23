import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const { cover_path } = await req.json();

    if (!cover_path) {
      return NextResponse.json({ ok: false, error: "Missing cover_path" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.storage
      .from("resource-covers")
      .createSignedUrl(cover_path, 60 * 20); // 20 mins

    if (error || !data?.signedUrl) {
      return NextResponse.json({ ok: false, error: error?.message || "Could not create link" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url: data.signedUrl });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
