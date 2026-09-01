"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PlayCircle, Search, Video } from "lucide-react";
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
  const [ideasRail, setIdeasRail] = useState<VideoRow[]>([]);

  useEffect(() => {
    supabase
      .from("resources")
      .select("category")
      .eq("status", "published").eq("resource_type", "video").eq("show_in_library", true)
      .not("category", "is", null)
      .then(({ data }) => setCategories(Array.from(new Set((data || []).map((r) => r.category as string))).sort()));
  }, []);

  // Curated sections (Featured, Ideas Worth Watching) sit above the main
  // discovery feed and don't participate in pagination -- only shown on
  // the unfiltered, first-page view, same convention as /learn's Featured
  // Learning strip. No separate Business/Career rails here -- the
  // Audience pill tabs above already filter by that exact dimension, so a
  // dedicated rail for it was a redundant second way to do the same thing.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (activeFiltersPresent || filters.page > 1) {
        if (!cancelled) { setFeatured(null); setIdeasRail([]); }
        return;
      }
      const base = () => supabase.from("resources").select(VIDEO_SELECT).eq("status", "published").eq("resource_type", "video").eq("show_in_library", true);
      const [f, i] = await Promise.all([
        base().eq("featured", true).order("created_at", { ascending: false }).limit(1),
        base().in("content_role", ["motivation", "interview"]).order("created_at", { ascending: false }).limit(8),
      ]);
      if (cancelled) return;
      setFeatured(((f.data as VideoRow[]) || [])[0] || null);
      setIdeasRail((i.data as VideoRow[]) || []);
    })();
    return () => { cancelled = true; };
  }, [activeFiltersPresent, filters.page]);

  // Every video already shown in a curated rail above (Featured, Ideas
  // Worth Watching) -- excluded from the main grid below so the same
  // handful of videos don't appear twice on one page load, matching the
  // same fix on /resources.
  const curatedVideoIds = useMemo(() => {
    const ids = new Set<string>();
    if (featured) ids.add(featured.id);
    for (const v of ideasRail) ids.add(v.id);
    return Array.from(ids);
  }, [featured, ideasRail]);

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

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-brand-bg py-12 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <Reveal>
              <div>
                <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                  <Video size={14} aria-hidden="true" />
                  Videos
                </div>
                <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Watch practical lessons, interviews and ideas.</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  Learn through tutorials, career advice, business insights, interviews and useful ideas from Prowess Digital Solutions and trusted creators.
                </p>
                <div className="relative mt-7 max-w-2xl">
                  <label htmlFor="video-search" className="sr-only">Search videos</label>
                  <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="video-search"
                    value={filters.q}
                    onChange={(e) => updateFilters({ q: e.target.value })}
                    placeholder="Search videos, topics or categories"
                    className="min-h-12 w-full rounded-lg border border-border bg-card pl-11 pr-4 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <p className="text-sm font-bold text-foreground">Video library</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Browse by audience and category, continue videos you started, and open lessons connected to your career growth.</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-lg font-bold text-foreground">{loading ? "…" : total}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">Videos</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-lg font-bold text-foreground">{categories.length}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">Categories</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {popularCategories.length > 0 && (
            <Reveal delay={120}>
              <div className="mt-7 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Popular</span>
                {popularCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateFilters({ category: c })}
                    className="min-h-10 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Reveal>
          )}
        </Container>
      </section>

      <section className="border-b border-border py-8">
        <Container>
          <Reveal>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Browse videos</p>
              <h2 className="mt-2 text-xl font-bold text-foreground">Choose what you want to watch</h2>
            </div>
          </Reveal>
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
                <Link href={`/videos/${featured.slug}`} className="group relative block aspect-video overflow-hidden rounded-lg border border-border bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  {featuredThumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featuredThumb} alt={featured.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No thumbnail</div>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/15 transition group-hover:bg-black/30">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary shadow">
                      <PlayCircle size={30} aria-hidden="true" />
                    </span>
                  </span>
                </Link>
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Featured</span>
                  <h2 className="mt-2 text-xl font-bold text-foreground">{featured.title}</h2>
                  {featured.category && <p className="mt-1 text-sm text-muted-foreground">{featured.category}</p>}
                  {featured.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{featured.description}</p>}
                  {featured.duration_minutes && <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{featured.duration_minutes} min</p>}
                  <Link href={`/videos/${featured.slug}`} className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Watch video</Link>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>
      )}

      {/* CONTINUE WATCHING + CURATED RAILS */}
      {ideasRail.length > 0 && (
        <section className="border-b border-border bg-muted/40 py-14">
          <Container>
            <Reveal><ContinueWatching /></Reveal>

            <Reveal delay={40}>
              <div className="mt-10">
                <h2 className="text-xl font-bold text-foreground">Ideas worth watching</h2>
                <div className="mt-4"><ScrollCarousel>{ideasRail.map((v) => <div key={v.id} className="w-72 flex-shrink-0 snap-start"><VideoCard video={v} /></div>)}</ScrollCarousel></div>
              </div>
            </Reveal>
          </Container>
        </section>
      )}
      {ideasRail.length === 0 && !activeFiltersPresent && filters.page === 1 && (
        <section className="border-b border-border py-8"><Container><ContinueWatching /></Container></section>
      )}

      {/* EXPLORE VIDEOS */}
      <section className="py-12 sm:py-16">
        <Container>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                More videos also live on our{" "}
                <a href="https://www.youtube.com/@ProwessDigitalSolutions" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">YouTube channel</a>
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">{loading ? "Searching…" : `${total} video${total === 1 ? "" : "s"} found`}</p>
            </div>
            <select
              value={filters.sort}
              onChange={(e) => updateFilters({ sort: e.target.value as SortValue })}
              className="min-h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="min-h-[300px] rounded-lg border border-border bg-card">
                  <div className="aspect-video rounded-t-lg bg-muted" />
                  <div className="p-5">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="mt-4 h-5 w-4/5 rounded bg-muted" />
                    <div className="mt-3 h-3 w-full rounded bg-muted" />
                    <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="mx-auto mt-8 max-w-lg rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center">
              <Video size={34} className="mx-auto text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">No videos found</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {activeFiltersPresent ? "We could not find anything matching your current filters." : "We are adding videos here soon. Check back shortly."}
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
    </div>
  );
}
