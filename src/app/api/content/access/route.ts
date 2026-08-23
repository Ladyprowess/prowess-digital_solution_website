import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { hasEntitlement } from "@/lib/payments/entitlement";
import { signDownloadUrl } from "@/lib/resourceDownload";

export const runtime = "nodejs";

const VALID_ITEM_TYPES = ["resource", "course", "career_path"];

// The one sanctioned way to read a premium content body (a resource's
// content/file_url/external_url, or a course's modules+lessons). Identity
// only ever comes from a verified Supabase access token - never a
// client-supplied email - so a caller with no session is always treated as
// anonymous and only gets free content. A guest who just paid has to sign
// in (the same email claims their purchase automatically, see
// /api/account/claim-purchases) before they can actually read what they
// bought; that's a deliberate consequence of guest checkout having no
// session to check against, not an oversight.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const itemType = String(body?.itemType || "");
    const itemId = String(body?.itemId || "");

    if (!VALID_ITEM_TYPES.includes(itemType) || !itemId) {
      return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    }

    const member = await verifyMember(req);
    const { entitled, reason } = await hasEntitlement(
      itemType as "resource" | "course" | "career_path",
      itemId,
      { userId: member?.id ?? null, email: member?.email ?? null }
    );

    if (reason === "not_found") {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    if (!entitled) {
      return NextResponse.json({ ok: false, error: "This content is premium. Purchase or sign in to access it.", premium: true }, { status: 403 });
    }

    const supabase = supabaseAdmin();

    if (itemType === "resource") {
      const { data } = await supabase
        .from("resources")
        .select("id, title, content, file_url, external_url, source, file_path")
        .eq("id", itemId)
        .single();

      // Older resources (uploaded before the B2C content model existed)
      // store their file in Supabase Storage via file_path. Rather than
      // handing back a raw Supabase signed URL (which leaks the storage
      // domain the moment the browser navigates to it, even if hidden
      // behind a button beforehand), mint a same-origin proxy link that
      // streams the file through our own /api/resources/[id]/file route -
      // the actual URL the user ever sees stays on our domain throughout.
      const downloadUrl = data?.file_path ? signDownloadUrl(itemId, member?.email ?? null) : null;

      return NextResponse.json({ ok: true, resource: { ...data, download_url: downloadUrl } });
    }

    if (itemType === "course") {
      const { data: modules } = await supabase
        .from("course_modules")
        .select("id, title, position, course_lessons(id, title, content_type, content_url, content_text, position)")
        .eq("course_id", itemId)
        .order("position");
      return NextResponse.json({ ok: true, modules: modules || [] });
    }

    // career_path currently has no gated body beyond its own (already
    // public) row - nothing further to return here yet.
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
