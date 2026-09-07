import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// A stable, public URL for a resource's cover image, for social previews.
//
// Covers sit in a private bucket and are normally handed out as signed URLs
// that expire after an hour. That works for a person browsing the site and
// not at all for Facebook, X, LinkedIn or WhatsApp: they fetch the image
// when the link is first shared, cache it for days, and re-fetch later - by
// which time a signed URL is dead and the card falls back to a broken or
// blank image. This route serves the bytes from our own domain under a URL
// that never changes.
//
// Nothing here is private: the same image is already on the public resource
// listing. Only published resources resolve, and anything without a cover
// falls through to the site's default share image so a link is never posted
// with no picture at all.
const FALLBACK = "/og-image.png";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: resource } = await supabase
    .from("resources")
    .select("cover_path, cover_url, thumbnail_url, status")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  const fallbackUrl = new URL(FALLBACK, req.nextUrl.origin);

  if (!resource) return NextResponse.redirect(fallbackUrl);

  // An admin-typed external image is already a public URL - send the
  // crawler straight there rather than proxying somebody else's bytes.
  const externalUrl = resource.cover_url || resource.thumbnail_url;
  if (!resource.cover_path && externalUrl && /^https?:\/\//i.test(externalUrl)) {
    return NextResponse.redirect(externalUrl);
  }
  if (!resource.cover_path) return NextResponse.redirect(fallbackUrl);

  const { data: blob, error } = await supabase.storage.from("resource-covers").download(resource.cover_path);
  if (error || !blob) return NextResponse.redirect(fallbackUrl);

  return new NextResponse(blob.stream(), {
    headers: {
      "Content-Type": blob.type || "image/png",
      // Cover images change rarely and crawlers re-fetch on their own
      // schedule, so a long cache costs nothing and keeps repeat shares off
      // Storage entirely.
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
