"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Pagination } from "@/components/Pagination";
import { PillTabs, type PillTab } from "@/components/PillTabs";
import { ScrollCarousel } from "@/components/ScrollCarousel";
import { VideoCard, thumbnailFor, type VideoCardData } from "@/components/videos/VideoCard";
import { ContinueWatching } from "@/components/videos/ContinueWatching";
import { supabase } from "@/lib/supabase";
import {
  filtersFromSearchParams, searchParamsFromFilters, hasActiveFilters,
  type VideoFilters, type SortValue,
} from "@/lib/videos/filters";

const PAGE_SIZE = 12;

const AUDIENCE_TABS: PillTab<string>[] = [
  { value: "", label: "All Videos" },
  { value: "consumer", label: "For Individuals" },
  { value: "business", label: "For Businesses" },
];

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "shortest", label: "Shortest" },
  { value: "longest", label: "Longest" },
];

const VIDEO_SELECT = "id, slug, title, description, category, source, external_url, thumbnail_url, access, content_role, duration_minutes, created_at";

type VideoRow = VideoCardData & { content_role: string | null; duration_minutes: number | null; created_at: string };

// A video tagged "both" should surface under either audience filter -- only
// "All" excludes nothing.
function audienceValues(audience: string): string[] {
  if (audience === "consumer") return ["consumer", "both"];
  if (audience === "business") return ["business", "both"];
  return ["consumer", "business", "both"];
}

export default function VideosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <VideosPageContent />
    </Suspense>
  );
}

function VideosPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);
  const activeFiltersPresent = hasActiveFilters(filters);

  const [categories, setCategories] = useState<string[]>([]);
  const [items, setItems] = useState<VideoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [featured, setFeatured] = useState<VideoRow | null>(null);
  const [businessRail, setBusinessRail] = useState<VideoRow[]>([]);
  const [careerRail, setCareerRail] = useState<VideoRow[]>([]);
  const [ideasRail, setIdeasRail] = useState<VideoRow[]>([]);

  useEffect(() => {
    supabase
      .from("resources")
      .select("category")
      .eq("status", "published").eq("resource_type", "video").eq("show_in_library", true)
      .not("category", "is", null)
      .then(({ data }) => setCategories(Array.from(new Set((data || []).map((r) => r.category as string))).sort()));
  }, []);

  // Curated sections (featured, For Business Owners, For Your Career, Ideas
  // Worth Watching) sit above the main discovery feed and don't participate
  // in pagination -- only shown on the unfiltered, first-page view, same
  // convention as /learn's Featured Learning strip.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (activeFiltersPresent || filters.page > 1) {
        if (!cancelled) { setFeatured(null); setBusinessRail([]); setCareerRail([]); setIdeasRail([]); }
        return;
      }
      const base = () => supabase.from("resources").select(VIDEO_SELECT).eq("status", "published").eq("resource_type", "video").eq("show_in_library", true);
      const [f, b, c, i] = await Promise.all([
        base().eq("featured", true).order("created_at", { ascending: false }).limit(1),
        base().eq("show_in_business", true).order("created_at", { ascending: false }).limit(8),
        base().eq("show_in_career", true).order("created_at", { ascending: false }).limit(8),
        base().in("content_role", ["motivation", "interview"]).order("created_at", { ascending: false }).limit(8),
      ]);
      if (cancelled) return;
      setFeatured(((f.data as VideoRow[]) || [])[0] || null);
      setBusinessRail((b.data as VideoRow[]) || []);
      setCareerRail((c.data as VideoRow[]) || []);
      setIdeasRail((i.data as VideoRow[]) || []);
    })();
    return () => { cancelled = true; };
  }, [activeFiltersPresent, filters.page]);

  // Every video already shown in a curated rail above (Featured, For
  // Business Owners, For Your Career, Ideas Worth Watching) -- excluded
  // from the main grid below so the same handful of videos don't appear
  // twice on one page load, matching the same fix on /resources.
  const curatedVideoIds = useMemo(() => {
    const ids = new Set<string>();
    if (featured) ids.add(featured.id);
    for (const v of businessRail) ids.add(v.id);
    for (const v of careerRail) ids.add(v.id);
    for (const v of ideasRail) ids.add(v.id);
    return Array.from(ids);
  }, [featured, businessRail, careerRail, ideasRail]);

  useEffect(() => {
    let cancelled = false;
    // Debounced, matching /learn and /jobs' 150ms search-input pattern --
    // without this, every keystroke fired its own query + router.replace.
    const t = setTimeout(async () => {
      setLoading(true);
      let q = supabase
        .from("resources")
        .select(VIDEO_SELECT, { count: "exact" })
        .eq("status", "published").eq("resource_type", "video").eq("show_in_library", true)
        .in("audience", audienceValues(filters.audience));
      if (filters.category) q = q.eq("category", filters.category);
      if (filters.q.trim()) q = q.ilike("title", `%${filters.q.trim()}%`);
      if (curatedVideoIds.length > 0) q = q.not("id", "in", `(${curatedVideoIds.join(",")})`);
      // Secondary order by id -- duration_minutes is nullable and admins
      // often share the same value, and Postgres doesn't guarantee a
      // stable order among ties, which would let a row appear on two
      // pages (or neither) between requests.
      if (filters.sort === "shortest") q = q.order("duration_minutes", { ascending: true, nullsFirst: false }).order("id", { ascending: true });
      else if (filters.sort === "longest") q = q.order("duration_minutes", { ascending: false, nullsFirst: false }).order("id", { ascending: true });
      else q = q.order("created_at", { ascending: false }).order("id", { ascending: true });

      const from = (filters.page - 1) * PAGE_SIZE;
      const { data, count } = await q.range(from, from + PAGE_SIZE - 1);
      if (cancelled) return;
      setItems((data as VideoRow[]) || []);
      setTotal(count || 0);
      setLoading(false);
    }, 150);
    return () => { cancelled = true; clearTimeout(t); };
  }, [filters.audience, filters.category, filters.q, filters.sort, filters.page, curatedVideoIds]);

  function updateFilters(patch: Partial<VideoFilters>) {
    const next: VideoFilters = { ...filters, ...patch };
    if (!("page" in patch)) next.page = 1;
    const qs = searchParamsFromFilters(next).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const popularCategories = categories.slice(0, 6);
  const categoryTabs: PillTab<string>[] = [{ value: "", label: "All" }, ...categories.map((c) => ({ value: c, label: c }))];
  const featuredThumb = featured ? thumbnailFor(featured) : null;
  const showCuratedVideos = Boolean(featured) || businessRail.length > 0 || careerRail.length > 0 || ideasRail.length > 0;
  // Every video already appeared in a rail above -- an empty "no videos
  // found" box directly beneath a fully-populated curated section reads as
  // broken, not as "nothing here yet". Only suppressed on the unfiltered
  // first page; a real "no results" for an active filter still needs to show.
  const exploreIsRedundant = !loading && !activeFiltersPresent && filters.page === 1 && items.length === 0 && showCuratedVideos;

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="border-b border-border bg-muted py-16 sm:py-20">
        <Container>
          <Reveal>
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Videos</div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Videos that help you learn, build and grow.</h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Practical tutorials, career advice, business insights, interviews, motivation and useful ideas from Prowess Digital Solutions and trusted creators.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-6">
              <input
                value={filters.q}
                onChange={(e) => updateFilters({ q: e.target.value })}
                placeholder="Search videos..."
                className="w-full rounded-xl border border-border bg-card px-5 py-3.5 text-sm text-foreground shadow-sm sm:max-w-xl"
              />
            </div>
          </Reveal>
          {popularCategories.length > 0 && (
            <Reveal delay={120}>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Popular:</span>
                {popularCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateFilters({ category: c })}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Reveal>
          )}
        </Container>
      </section>

      {/* AUDIENCE + CATEGORY */}
      <section className="border-b border-border py-8">
        <Container>
          <Reveal>
            <PillTabs tabs={AUDIENCE_TABS} active={filters.audience} onChange={(v) => updateFilters({ audience: v })} />
          </Reveal>
          {categoryTabs.length > 1 && (
            <Reveal delay={40}>
              <div className="mt-4">
                <PillTabs tabs={categoryTabs} active={filters.category} onChange={(v) => updateFilters({ category: v })} />
              </div>
            </Reveal>
          )}
        </Container>
      </section>

      {/* FEATURED VIDEO */}
      {featured && (
        <section className="border-b border-border py-14">
          <Container>
            <Reveal>
              <div className="grid gap-6 sm:grid-cols-[3fr_2fr]">
                <Link href={`/videos/${featured.slug}`} className="group relative block aspect-video overflow-hidden rounded-2xl border border-border bg-black">
                  {featuredThumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featuredThumb} alt={featured.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No thumbnail</div>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/15 transition group-hover:bg-black/30">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary shadow">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </span>
                </Link>
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Featured</span>
                  <h2 className="mt-2 text-xl font-bold text-foreground">{featured.title}</h2>
                  {featured.category && <p className="mt-1 text-sm text-muted-foreground">{featured.category}</p>}
                  {featured.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{featured.description}</p>}
                  {featured.duration_minutes && <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{featured.duration_minutes} min</p>}
                  <Link href={`/videos/${featured.slug}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Watch video →</Link>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>
      )}

      {/* CONTINUE WATCHING + CURATED RAILS */}
      {(businessRail.length > 0 || careerRail.length > 0 || ideasRail.length > 0) && (
        <section className="border-b border-border bg-muted/40 py-14">
          <Container>
            <Reveal><ContinueWatching /></Reveal>

            {businessRail.length > 0 && (
              <Reveal delay={40}>
                <div className="mt-10">
                  <h2 className="text-lg font-bold text-foreground">For Business Owners</h2>
                  <div className="mt-4"><ScrollCarousel>{businessRail.map((v) => <div key={v.id} className="w-72 flex-shrink-0 snap-start"><VideoCard video={v} /></div>)}</ScrollCarousel></div>
                </div>
              </Reveal>
            )}

            {careerRail.length > 0 && (
              <Reveal delay={80}>
                <div className="mt-10">
                  <h2 className="text-lg font-bold text-foreground">For Your Career</h2>
                  <div className="mt-4"><ScrollCarousel>{careerRail.map((v) => <div key={v.id} className="w-72 flex-shrink-0 snap-start"><VideoCard video={v} /></div>)}</ScrollCarousel></div>
                </div>
              </Reveal>
            )}

            {ideasRail.length > 0 && (
              <Reveal delay={120}>
                <div className="mt-10">
                  <h2 className="text-lg font-bold text-foreground">Ideas Worth Watching</h2>
                  <div className="mt-4"><ScrollCarousel>{ideasRail.map((v) => <div key={v.id} className="w-72 flex-shrink-0 snap-start"><VideoCard video={v} /></div>)}</ScrollCarousel></div>
                </div>
              </Reveal>
            )}
          </Container>
        </section>
      )}
      {!(businessRail.length > 0 || careerRail.length > 0 || ideasRail.length > 0) && !activeFiltersPresent && filters.page === 1 && (
        <section className="border-b border-border py-8"><Container><ContinueWatching /></Container></section>
      )}

      {/* EXPLORE VIDEOS -- hidden on the unfiltered first page once every
          video is already shown in a curated rail above (an empty "no
          videos found" box directly beneath a fully-populated curated
          section reads as broken, not "nothing here yet"). An active
          filter still shows its own real "no results" state. */}
      {!exploreIsRedundant && (
        <section className="py-12 sm:py-16">
          <Container>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  More videos also live on our{" "}
                  <a href="https://www.youtube.com/@ProwessDigitalSolutions" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">YouTube channel →</a>
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{loading ? "Searching…" : `${total} video${total === 1 ? "" : "s"} found`}</p>
              </div>
              <select
                value={filters.sort}
                onChange={(e) => updateFilters({ sort: e.target.value as SortValue })}
                className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
                <h2 className="text-lg font-semibold text-foreground">No videos found</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {activeFiltersPresent ? "We couldn't find anything matching your current filters." : "We're adding videos here soon - check back shortly."}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((v) => <VideoCard key={v.id} video={v} />)}
              </div>
            )}

            <Pagination page={filters.page} totalPages={totalPages} onPageChange={(p) => updateFilters({ page: p })} />
          </Container>
        </section>
      )}
    </div>
  );
}
