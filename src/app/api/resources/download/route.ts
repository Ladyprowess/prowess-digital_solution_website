import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normaliseStoragePath(input: string) {
  let p = String(input || "").trim();

  // full public URL -> extract path after "/resources/"
  if (p.startsWith("http")) {
    const marker = "/resources/";
    try {
      const u = new URL(p);
      const idx = u.pathname.indexOf(marker);
      if (idx !== -1) p = u.pathname.slice(idx + marker.length);
    } catch {}
  }

  p = p.replace(/^\/+/, ""); // remove leading slash
  if (p.startsWith("resources/")) p = p.slice("resources/".length); // remove bucket prefix

  try {
    p = decodeURIComponent(p);
  } catch {}

  return p;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

const rawPath = String(body?.file_path || "").trim();
const file_path = rawPath.replace(/^pdfs\//, "");

if (!file_path) {
  return NextResponse.json({ ok: false, error: "Missing file_path" }, { status: 400 });
}

const supabase = supabaseAdmin();

const { data, error } = await supabase.storage
  .from("resources")
  .createSignedUrl(file_path, 60 * 10, { download: false });

if (error || !data?.signedUrl) {
  return NextResponse.json(
    { ok: false, error: error?.message || "Object not found", debug_path: file_path },
    { status: 500 }
  );
}

return NextResponse.json({ ok: true, url: data.signedUrl });
  } catch (e: any) {
    // ✅ THIS is what will expose the real crash reason in your browser response
    return NextResponse.json(
      { ok: false, error: e?.message || "Route crashed" },
      { status: 500 }
    );
  }
}