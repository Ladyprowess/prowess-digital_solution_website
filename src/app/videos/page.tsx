import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import Container from "@/components/Container";
import AgencyPageHeader from "@/components/AgencyPageHeader";
import { Reveal } from "@/components/Reveal";
import { getYoutubeThumbnail } from "@/lib/youtube";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const metadata: Metadata = {
  title: "Videos | Prowess Digital Solutions",
  description: "Practical and motivational videos to help you grow - your career, your skills, and your mindset.",
  alternates: { canonical: "https://prowessdigitalsolutions.com/videos" },
};

const PAGE_SIZE = 12;

type VideoResource = {
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

async function getVideos(page: number, category: string) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("resources")
    .select("id, slug, title, description, category, source, external_url, thumbnail_url, access", { count: "exact" })
    // published check covers both the legacy is_published-driven rows and
    // the newer status field, kept in sync on every admin write
    .eq("status", "published")
    .eq("resource_type", "video");

  if (category) query = query.eq("category", category);

  const { data, count } = await query.order("created_at", { ascending: false }).range(from, to);

  return { videos: (data as VideoResource[] | null) || [], total: count || 0 };
}

async function getCategories() {
  const { data } = await supabase
    .from("resources")
    .select("category")
    .eq("status", "published")
    .eq("resource_type", "video")
    .not("category", "is", null);

  const unique = Array.from(new Set((data || []).map((r) => r.category as string))).sort();
  return unique;
}

function thumbnailFor(v: VideoResource): string | null {
  if (v.thumbnail_url) return v.thumbnail_url;
  if (v.source === "youtube" && v.external_url) return getYoutubeThumbnail(v.external_url);
  return null;
}

function pageHref(page: number, category: string) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/videos${qs ? `?${qs}` : ""}`;
}

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const category = params.category?.trim() || "";

  const [{ videos, total }, categories] = await Promise.all([getVideos(page, category), getCategories()]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <AgencyPageHeader
        eyebrow="Videos"
        title={
          <>
            Watch, learn, and <span className="text-primary">keep moving.</span>
          </>
        }
        description="Practical videos to build real skills, plus motivational videos to keep you going. All in one place."
        primaryAction={{ label: "Explore Learn", href: "/learn" }}
        secondaryAction={{ label: "Browse Resources", href: "/resources" }}
        proof={[
          "Skill-building videos",
          "Motivation to keep going",
          "New videos added regularly",
        ]}
      />

      <section className="py-12 sm:py-16 bg-muted/40">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              More videos also live on our{" "}
              <a href="https://www.youtube.com/@ProwessDigitalSolutions" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                YouTube channel →
              </a>
            </p>

            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={pageHref(1, "")}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${!category ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
                >
                  All
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c}
                    href={pageHref(1, c)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${category === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
                  >
                    {c}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {videos.length === 0 ? (
            <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-border bg-card p-10 text-center">
              <h2 className="text-lg font-semibold text-foreground">No videos yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {category
                  ? `No videos in "${category}" yet - try a different category.`
                  : "We're adding videos here soon - practical lessons and motivation to help you grow. Check back shortly."}
              </p>
            </div>
          ) : (
            <>
              <p className="mt-6 text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total} video{total === 1 ? "" : "s"}
              </p>

              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((v, i) => {
                  const thumb = thumbnailFor(v);
                  return (
                    <Reveal key={v.id} delay={i * 60}>
                      <Link
                        href={`/resources/${v.slug}`}
                        className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="relative aspect-video w-full bg-muted">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element -- external video-host thumbnail, not a local/optimizable asset
                            <img src={thumb} alt={v.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No thumbnail</div>
                          )}
                          <span className="absolute inset-0 flex items-center justify-center bg-black/15 transition group-hover:bg-black/30">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-primary shadow">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            </span>
                          </span>
                          {v.access === "premium" && (
                            <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Premium</span>
                          )}
                        </div>
                        <div className="p-5">
                          {v.category && <p className="text-xs font-semibold uppercase tracking-wide text-primary">{v.category}</p>}
                          <h3 className="mt-1 font-semibold text-foreground line-clamp-2">{v.title}</h3>
                          {v.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{v.description}</p>}
                        </div>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">
                  <Link
                    href={pageHref(page - 1, category)}
                    aria-disabled={page <= 1}
                    className={`rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
                  >
                    ← Previous
                  </Link>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Link
                    href={pageHref(page + 1, category)}
                    aria-disabled={page >= totalPages}
                    className={`rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
                  >
                    Next →
                  </Link>
                </div>
              )}
            </>
          )}
        </Container>
      </section>
    </div>
  );
}
