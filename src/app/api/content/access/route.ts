import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { hasEntitlement, getPurchasedFormats } from "@/lib/payments/entitlement";
import { signDownloadUrl } from "@/lib/resourceDownload";
import { isFormatPriceableType } from "@/lib/resources/ebookFormats";

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
        .select("id, title, content, file_url, external_url, source, file_path, resource_type, price_read_usd, price_read_ngn, price_download_usd, price_download_ngn, price_hardcopy_usd, price_hardcopy_ngn")
        .eq("id", itemId)
        .single();

      // Same hard-override signal used everywhere else (getItemPrice,
      // ResourceBody): a format-priceable resource (ebook/guide/template/
      // checklist - see isFormatPriceableType) only behaves as format-gated
      // once at least one of the six format prices is actually set. Any
      // other resource_type keeps today's all-or-nothing behavior below.
      const hasFormatPricing = Boolean(data) && isFormatPriceableType(data!.resource_type) && Boolean(
        data!.price_read_usd || data!.price_read_ngn ||
        data!.price_download_usd || data!.price_download_ngn ||
        data!.price_hardcopy_usd || data!.price_hardcopy_ngn
      );

      // Format-priced ebooks grant access per-format, not all-or-nothing -
      // the caller (ResourceBody) uses this to decide whether to show the
      // embedded reader, the download link, or a "hardcopy ordered" state.
      // Every other resource type ignores this field entirely.
      const unlockedFormats = hasFormatPricing
        ? Array.from(await getPurchasedFormats(itemId, { userId: member?.id ?? null, email: member?.email ?? null }))
        : [];

      // hasEntitlement above only proves *some* paid purchase exists on this
      // item - format-agnostic by design, since a hardcopy-only buyer still
      // needs to reach the "entitled" branch to see their shipping status.
      // But the file link itself is a digital unlock: a format-priced ebook
      // must not mint a working link for someone who paid only for Hard
      // Copy (no digital format at all) - hiding the Download *button*
      // isn't enough if the signed URL is still sitting in this response for
      // anyone to read out of the network tab.
      const canAccessFile = !hasFormatPricing || unlockedFormats.includes("read") || unlockedFormats.includes("download");

      // Older resources (uploaded before the B2C content model existed)
      // store their file in Supabase Storage via file_path. Rather than
      // handing back a raw Supabase signed URL (which leaks the storage
      // domain the moment the browser navigates to it, even if hidden
      // behind a button beforehand), mint a same-origin proxy link that
      // streams the file through our own /api/resources/[id]/file route -
      // the actual URL the user ever sees stays on our domain throughout.
      const downloadUrl = data?.file_path && canAccessFile ? signDownloadUrl(itemId, member?.email ?? null) : null;

      // Built explicitly rather than spreading `data` wholesale - file_path
      // (an internal storage key) and the format price columns have no
      // reason to reach the client here.
      return NextResponse.json({
        ok: true,
        resource: {
          id: data?.id,
          title: data?.title,
          content: data?.content,
          file_url: data?.file_url,
          external_url: data?.external_url,
          source: data?.source,
          resource_type: data?.resource_type,
          download_url: downloadUrl,
          unlocked_formats: unlockedFormats,
        },
      });
    }

    if (itemType === "course") {
      const { data: modules } = await supabase
        .from("course_modules")
        .select("id, title, position, course_lessons(id, title, content_type, content_url, content_text, quiz_id, assignment_id, position)")
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
