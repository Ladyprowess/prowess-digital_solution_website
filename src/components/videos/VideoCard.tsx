import Link from "next/link";
import { getYoutubeThumbnail } from "@/lib/youtube";

export type VideoCardData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  source: string;
  external_url: string | null;
  thumbnail_url: string | null;
  access: "free" | "premium";
};

export function thumbnailFor(v: VideoCardData): string | null {
  if (v.thumbnail_url) return v.thumbnail_url;
  // Derived from the link itself, not gated on `source` -- an admin can
  // paste a YouTube link while Source is left on its default, and
  // getYoutubeThumbnail already returns null for anything that isn't a
  // recognisable YouTube URL, so this is safe without the source check.
  if (v.external_url) return getYoutubeThumbnail(v.external_url);
  return null;
}

// Shared between the /videos listing grid, any "More videos" rail on the
// detail page, and Continue Watching (via the optional progressPercent,
// which renders a thin progress bar under the thumbnail) -- same
// thumbnail-fallback logic /videos/page.tsx already had inline, extracted
// here so all three places stay in sync.
export function VideoCard({ video, progressPercent }: { video: VideoCardData; progressPercent?: number }) {
  const thumb = thumbnailFor(video);
  return (
    <Link
      href={`/videos/${video.slug}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-video w-full bg-muted">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element -- external video-host thumbnail, not a local/optimizable asset
          <img src={thumb} alt={video.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No thumbnail</div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/15 transition group-hover:bg-black/30">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-primary shadow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </span>
        {video.access === "premium" && (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Premium</span>
        )}
        {typeof progressPercent === "number" && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
            <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }} />
          </div>
        )}
      </div>
      <div className="p-5">
        {video.category && <p className="text-xs font-semibold uppercase tracking-wide text-primary">{video.category}</p>}
        <h3 className="mt-1 font-semibold text-foreground line-clamp-2">{video.title}</h3>
        {typeof progressPercent === "number" ? (
          <p className="mt-2 text-xs text-muted-foreground">{progressPercent}% watched</p>
        ) : (
          video.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{video.description}</p>
        )}
      </div>
    </Link>
  );
}
