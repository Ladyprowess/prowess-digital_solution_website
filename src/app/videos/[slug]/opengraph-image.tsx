import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

export const runtime = "nodejs";
export const alt = "Prowess Digital Solutions video";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";

const SITE_URL = "https://prowessdigitalsolutions.com";
const BRAND = { r: 61, g: 95, b: 98 };

// Why this file exists:
//
// Sharing a video link showed the title and description but no picture.
// A bare image URL leaves the crawler to work out the size for itself, and
// Facebook, LinkedIn and WhatsApp routinely fall back to the text-only card
// rather than wait. Next's opengraph-image convention declares og:image
// along with its width, height and type, at the 1200x630 every platform
// expects, so there is nothing left to guess.
//
// It also fixes the shape and the weight. Covers are portrait or 3:2 and
// were being cropped into a 1.91:1 card; here the cover is composed onto a
// branded canvas at the right ratio. And the output is JPEG rather than
// PNG: the same card as a PNG came to roughly 750KB, comfortably over the
// size at which WhatsApp stops showing a preview image at all.

async function fetchBytes(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function coverUrlFor(slug: string) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: resource } = await supabase
    .from("resources")
    .select("cover_path, cover_url, thumbnail_url")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("resource_type", "video")
    .maybeSingle();

  if (resource?.cover_path) {
    const { data: signed } = await supabase.storage.from("resource-covers").createSignedUrl(resource.cover_path, 60 * 10);
    if (signed?.signedUrl) return signed.signedUrl;
  }
  const external = resource?.cover_url || resource?.thumbnail_url;
  return external && /^https?:\/\//i.test(external) ? external : null;
}

async function card(source: Buffer) {
  const fitted = await sharp(source)
    .resize(size.width, size.height, { fit: "contain", background: { ...BRAND, alpha: 1 } })
    .toBuffer();
  return sharp(fitted).jpeg({ quality: 82, progressive: true }).toBuffer();
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Cover first, then the site's default share image, then a plain branded
  // panel. Each step falls through on any failure: an error here would mean
  // no image at all for the crawler, which is exactly the problem being
  // fixed, so the handler must always return something valid.
  const attempts: (() => Promise<Buffer>)[] = [
    async () => {
      const url = await coverUrlFor(slug);
      if (!url) throw new Error("No cover for this resource");
      return card(await fetchBytes(url));
    },
    async () => card(await fetchBytes(`${SITE_URL}/og-image.png`)),
    async () =>
      sharp({ create: { width: size.width, height: size.height, channels: 3, background: BRAND } })
        .jpeg({ quality: 82 })
        .toBuffer(),
  ];

  for (const attempt of attempts) {
    try {
      const body = await attempt();
      return new Response(new Uint8Array(body), {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        },
      });
    } catch {
      // Try the next fallback.
    }
  }

  // Unreachable: the last attempt has no external dependency.
  return new Response("Image unavailable", { status: 500 });
}
