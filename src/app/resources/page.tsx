"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { BookOpen, BriefcaseBusiness, Building2, GraduationCap, HeartHandshake, Library, Search, Sparkles } from "lucide-react";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Pagination } from "@/components/Pagination";
import { PillTabs, type PillTab } from "@/components/PillTabs";
import { ScrollCarousel } from "@/components/ScrollCarousel";
import ResourceCard, { type ResourceItem } from "@/components/resources/ResourceCard";
import { PUBLIC_RESOURCE_TYPES, USE_CASES, USE_CASE_LABELS, USE_CASE_DESCRIPTIONS, type UseCase } from "@/lib/resources/constants";
import {
  filtersFromSearchParams, searchParamsFromFilters, hasActiveFilters,
  type ResourceFilters,
} from "@/lib/resources/filters";

const PAGE_SIZE = 12;

const AUDIENCE_TABS: PillTab<string>[] = [
  { value: "", label: "All Resources" },
  { value: "consumer", label: "For Individuals" },
  { value: "business", label: "For Businesses" },
];

function typeLabel(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const TYPE_TABS: PillTab<string>[] = [
  { value: "", label: "All Types" },
  ...PUBLIC_RESOURCE_TYPES.map((t) => ({ value: t, label: typeLabel(t) })),
];

const LIBRARY_SHELVES = [
  { label: "Self help", query: "self help", icon: Sparkles },
  { label: "Marriage", query: "marriage", icon: HeartHandshake },
  { label: "Sexual wellness", query: "sexual wellness", icon: HeartHandshake },
  { label: "Web3", query: "web3", icon: GraduationCap },
  { label: "Business", query: "business", icon: Building2 },
  { label: "Career", query: "career", icon: BriefcaseBusiness },
  { label: "Education", query: "education", icon: BookOpen },
] as const;

// A resource tagged "both" should surface under either audience filter --
// only "All" excludes nothing. Mirrors src/app/videos/page.tsx.
function audienceValues(audience: string): string[] {
  if (audience === "consumer") return ["consumer", "both"];
  if (audience === "business") return ["business", "both"];
  return ["consumer", "business", "both"];
}

// Every fetch on this page goes through /api/resources (server-side,
// service-role) rather than querying Supabase directly from the browser
// like /videos/page.tsx does -- resource covers live in a private Storage
// bucket and need a signed URL, which only the server route can generate.
async function fetchResources(params: URLSearchParams): Promise<{ items: ResourceItem[]; total: number }> {
  const res = await fetch(`/api/resources?${params.toString()}`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  return { items: data?.items || [], total: data?.total || 0 };
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResourcesPageContent />
    </Suspense>
  );
}

function ResourcesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);
  const activeFiltersPresent = hasActiveFilters(filters);

  const [items, setItems] = useState<ResourceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [featuredPicks, setFeaturedPicks] = useState<ResourceItem[]>([]);
  const [templatesAndChecklists, setTemplatesAndChecklists] = useState<ResourceItem[]>([]);

  // Curated sections (Featured, Popular Picks, Templates & Checklists
  // table) sit above the main discovery feed and don't participate in
  // pagination -- only shown on the unfiltered, first-page view, same
  // convention as /videos' curated rails. No separate Business/Career
  // rails here -- the Audience pill tabs above already filter by that
  // exact dimension, so a dedicated rail for it was a redundant second way
  // to do the same thing.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (activeFiltersPresent || filters.page > 1) {
        if (!cancelled) { setFeaturedPicks([]); setTemplatesAndChecklists([]); }
        return;
      }
      const base = () => new URLSearchParams({ exclude_resource_type: "video" });
      const featuredParams = base(); featuredParams.set("featured", "true"); featuredParams.set("pageSize", "7");
      const templatesParams = new URLSearchParams({ resource_type: "template,checklist", pageSize: "8" });

      const [f, t] = await Promise.all([
        fetchResources(featuredParams),
        fetchResources(templatesParams),
      ]);
      if (cancelled) return;
      setFeaturedPicks(f.items);
      setTemplatesAndChecklists(t.items);
    })();
    return () => { cancelled = true; };
  }, [activeFiltersPresent, filters.page]);

  // Every resource already shown in a curated rail above -- excluded from
  // the main grid below so the same handful of resources don't appear
  // twice on one page load (obvious with only a couple of resources
  // published so far, but the exclusion holds regardless of count).
  const curatedIds = useMemo(
    () => Array.from(new Set([...featuredPicks, ...templatesAndChecklists].map((r) => r.id))),
    [featuredPicks, templatesAndChecklists]
  );

  useEffect(() => {
    let cancelled = false;
    // Debounced, matching /videos and /learn's 150ms search-input pattern.
    const t = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("exclude_resource_type", "video");
      params.set("audience", audienceValues(filters.audience).join(","));
      if (filters.type) params.set("resource_type", filters.type);
      if (filters.useCase) params.set("use_case", filters.useCase);
      if (filters.q.trim()) params.set("q", filters.q.trim());
      if (curatedIds.length > 0) params.set("exclude_id", curatedIds.join(","));
      params.set("page", String(filters.page));
      params.set("pageSize", String(PAGE_SIZE));

      const { items: nextItems, total: nextTotal } = await fetchResources(params);
      if (cancelled) return;
      setItems(nextItems);
      setTotal(nextTotal);
      setLoading(false);
    }, 150);
    return () => { cancelled = true; clearTimeout(t); };
  }, [filters.audience, filters.type, filters.useCase, filters.q, filters.page, curatedIds]);

  function updateFilters(patch: Partial<ResourceFilters>) {
    const next: ResourceFilters = { ...filters, ...patch };
    if (!("page" in patch)) next.page = 1;
    const qs = searchParamsFromFilters(next).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function browseByNeed(useCase: UseCase) {
    updateFilters({ useCase });
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function browseShelf(query: string) {
    updateFilters({ q: query });
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hero = featuredPicks[0] || null;
  const popularPicks = featuredPicks.slice(1);
  const showCurated = hero || popularPicks.length > 0 || templatesAndChecklists.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="border-b border-border bg-muted py-14 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                <Library size={14} aria-hidden="true" />
                Library
              </div>
                <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                A useful library for work, business and personal growth.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                Explore ebooks, guides, templates, checklists and articles you can read now or save for later.
              </p>
            </Reveal>
            <Reveal delay={80}>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">Keep your best resources in one place.</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Save books, guides and videos from across Prowess, then return to them from your account.
                </p>
                <Link href="/account/learning" className="mt-4 inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  Open my library
                </Link>
              </div>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <div className="relative mt-7 max-w-2xl">
              <label htmlFor="resource-search" className="sr-only">Search the library</label>
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="resource-search"
                value={filters.q}
                onChange={(e) => updateFilters({ q: e.target.value })}
                placeholder="Search books, guides, templates, Web3, marriage, business..."
                className="w-full rounded-lg border border-border bg-card py-3.5 pl-11 pr-4 text-sm text-foreground shadow-sm outline-none transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/25"
              />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* AUDIENCE + TYPE */}
      <section className="border-b border-border py-8">
        <Container>
          <Reveal>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Choose your side of the library</h2>
                <p className="mt-1 text-sm text-muted-foreground">Browse as an individual, a business owner, or both.</p>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <PillTabs tabs={AUDIENCE_TABS} active={filters.audience} onChange={(v) => updateFilters({ audience: v })} />
          </Reveal>
          <Reveal delay={40}>
            <div className="mt-4">
              <PillTabs tabs={TYPE_TABS} active={filters.type} onChange={(v) => updateFilters({ type: v })} />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* LIBRARY SHELVES */}
      <section className="border-b border-border py-12">
        <Container>
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Browse the shelves</h2>
                <p className="mt-1 text-sm text-muted-foreground">Quick paths into common reading areas.</p>
              </div>
              {activeFiltersPresent && (
                <button
                  type="button"
                  onClick={() => router.replace(pathname, { scroll: false })}
                  className="inline-flex min-h-10 items-center rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors duration-150 ease-out hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          </Reveal>
          <Reveal delay={40}>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {LIBRARY_SHELVES.map((shelf) => {
                const Icon = shelf.icon;
                return (
                  <button
                    key={shelf.label}
                    type="button"
                    onClick={() => browseShelf(shelf.query)}
                    className="group flex min-h-20 items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-[border-color,background-color] duration-150 ease-out hover:border-primary/35 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                      <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-foreground">{shelf.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">Open shelf</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* FEATURED RESOURCE */}
      {hero && (
        <section className="border-b border-border py-14">
          <Container>
            <Reveal>
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <Link href={`/resources/${hero.slug}`} className="group relative block aspect-[16/9] overflow-hidden rounded-lg border border-border bg-muted transition-[border-color,box-shadow] duration-150 ease-out hover:border-primary/35 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  {hero.cover_url ? (
                    // Fixed aspect ratio (not a pixel height) keeps the
                    // crop window the same shape at every width, so
                    // object-cover doesn't crop far more aggressively on
                    // mobile than on desktop the way a fixed height did.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hero.cover_url} alt={hero.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No cover image</div>
                  )}
                </Link>
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Featured book</span>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{hero.title}</h2>
                  {hero.resource_type && <p className="mt-1 text-sm capitalize text-muted-foreground">{typeLabel(hero.resource_type)}</p>}
                  {hero.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{hero.description}</p>}
                  <Link href={`/resources/${hero.slug}`} className="mt-4 inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Start reading</Link>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>
      )}

      {/* BROWSE BY NEED */}
      <section className="border-b border-border py-14">
        <Container>
          <Reveal>
            <h2 className="text-xl font-bold text-foreground">Browse by goal</h2>
            <p className="mt-1 text-sm text-muted-foreground">Find the material that matches what you want to do next.</p>
          </Reveal>
          <Reveal delay={40}>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {USE_CASES.map((uc) => (
                <button
                  key={uc}
                  type="button"
                  onClick={() => browseByNeed(uc)}
                  className={`min-h-32 rounded-lg border p-5 text-left transition-[border-color,background-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${filters.useCase === uc ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30 hover:bg-muted/50"}`}
                >
                  <p className="text-sm font-bold text-foreground">{USE_CASE_LABELS[uc]}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{USE_CASE_DESCRIPTIONS[uc]}</p>
                </button>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* CURATED RAILS */}
      {showCurated && (
        <section className="border-b border-border bg-muted/40 py-14">
          <Container>
            {popularPicks.length > 0 && (
              <Reveal>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Popular in the library</h2>
                  <div className="mt-4"><ScrollCarousel>{popularPicks.map((r) => <div key={r.id} className="w-72 flex-shrink-0 snap-start"><ResourceCard item={r} /></div>)}</ScrollCarousel></div>
                </div>
              </Reveal>
            )}

            {templatesAndChecklists.length > 0 && (
              <Reveal delay={120}>
                <div className="mt-10">
                  <h2 className="text-lg font-bold text-foreground">Templates and checklists</h2>
                  <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <th className="px-4 py-3">Title</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Use case</th>
                          <th className="px-4 py-3">Access</th>
                        </tr>
                      </thead>
                      <tbody>
                        {templatesAndChecklists.map((r) => (
                          <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                            <td className="px-4 py-3">
                              <Link href={`/resources/${r.slug}`} className="font-semibold text-foreground hover:text-primary">{r.title}</Link>
                            </td>
                            <td className="px-4 py-3 capitalize text-muted-foreground">{r.resource_type ? typeLabel(r.resource_type) : "-"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{r.use_case ? USE_CASE_LABELS[r.use_case as UseCase] : "-"}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${r.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{r.access}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Reveal>
            )}
          </Container>
        </section>
      )}

      {/* EXPLORE RESOURCES */}
      <section id="explore" className="scroll-mt-20 py-12 sm:py-16">
        <Container>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-semibold text-foreground">{loading ? "Searching…" : `${total} resource${total === 1 ? "" : "s"} found`}</p>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card">
                  <div className="aspect-[4/3] animate-pulse border-b border-border bg-muted" />
                  <div className="space-y-3 p-5">
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="mx-auto mt-8 max-w-lg rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center">
              <Library className="mx-auto text-primary" size={28} strokeWidth={1.6} aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold text-foreground">No resources found</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {activeFiltersPresent ? "No resource matches your current search or filters." : "New ebooks, guides, templates and checklists will appear here when they are published."}
              </p>
              {activeFiltersPresent && (
                <button
                  type="button"
                  onClick={() => router.replace(pathname, { scroll: false })}
                  className="mt-6 min-h-10 rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((r) => <ResourceCard key={r.id} item={r} />)}
            </div>
          )}

          <Pagination page={filters.page} totalPages={totalPages} onPageChange={(p) => updateFilters({ page: p })} />
        </Container>
      </section>

      {/* CLOSING CTA */}
      <section className="border-t border-border py-14">
        <Container>
          <Reveal>
            <div className="rounded-lg bg-foreground px-8 py-12 text-center">
              <h2 className="text-2xl font-bold text-background sm:text-3xl">Looking for something more structured?</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-background/70">Resources are one part of Prowess. You can also learn, watch, find jobs, and discover opportunities.</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href="/learn" className="inline-flex min-h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Explore learning</Link>
                <Link href="/videos" className="inline-flex min-h-10 items-center rounded-md border border-background/30 px-5 text-sm font-semibold text-background transition-colors duration-150 ease-out hover:bg-background/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Watch videos</Link>
                <Link href="/jobs" className="inline-flex min-h-10 items-center rounded-md border border-background/30 px-5 text-sm font-semibold text-background transition-colors duration-150 ease-out hover:bg-background/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Browse jobs</Link>
                <Link href="/opportunities" className="inline-flex min-h-10 items-center rounded-md border border-background/30 px-5 text-sm font-semibold text-background transition-colors duration-150 ease-out hover:bg-background/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Find opportunities</Link>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
