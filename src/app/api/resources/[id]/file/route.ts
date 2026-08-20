import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyDownloadSignature } from "@/lib/resourceDownload";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// A real proxy, not a redirect: the response is the file's bytes, served
// from this route's own URL, so the browser's address bar / download
// history never shows the underlying Supabase storage domain - the actual
// fix for "it's supposed to show the website URL, not the raw Supabase
// link", which a hidden-but-still-navigated-to signed URL didn't solve.
//
// Free resources need no proof of entitlement - they're free. Premium
// resources require a short-lived signature that /api/content/access mints
// only after it has already verified the caller is entitled; this route
// re-derives the same signature and rejects anything else, so a guessed or
// reused-after-expiry link can't pull a premium file.

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);

  const { data: resource } = await supabase
    .from("resources")
    .select("file_path, file_name, file_type, access, status")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!resource || !resource.file_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (resource.access === "premium") {
    const exp = searchParams.get("exp");
    const sig = searchParams.get("sig");
    if (!exp || !sig || Date.now() > Number(exp) || !verifyDownloadSignature(id, exp, sig)) {
      return NextResponse.json({ error: "This link has expired or is invalid." }, { status: 403 });
    }
  }

  // Older resources (pre-B2C) store file_path with a "pdfs/" prefix that
  // isn't part of the actual storage key - same cleanup /api/content/access
  // already applies before signing, kept consistent here.
  const cleanPath = resource.file_path.replace(/^pdfs\//, "");
  const { data: blob, error } = await supabase.storage.from("resources").download(cleanPath);
  if (error || !blob) {
    return NextResponse.json({ error: "File not found in storage." }, { status: 404 });
  }

  return new NextResponse(blob, {
    headers: {
      "Content-Type": resource.file_type || "application/octet-stream",
      "Content-Disposition": `inline; filename="${(resource.file_name || "download").replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
