"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hero = featuredPicks[0] || null;
  const popularPicks = featuredPicks.slice(1);
  const showCurated = hero || popularPicks.length > 0 || templatesAndChecklists.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="border-b border-border bg-muted py-16 sm:py-20">
        <Container>
          <Reveal>
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Resources</div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Guides, templates and tools to help you move forward.</h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Downloadable and readable material -- articles, guides, ebooks, templates and checklists -- for building a career or growing a business.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-6">
              <input
                value={filters.q}
                onChange={(e) => updateFilters({ q: e.target.value })}
                placeholder="Search resources..."
                className="w-full rounded-xl border border-border bg-card px-5 py-3.5 text-sm text-foreground shadow-sm sm:max-w-xl"
              />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* AUDIENCE + TYPE */}
      <section className="border-b border-border py-8">
        <Container>
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

      {/* FEATURED RESOURCE */}
      {hero && (
        <section className="border-b border-border py-14">
          <Container>
            <Reveal>
              <div className="grid gap-6 sm:grid-cols-[3fr_2fr]">
                <Link href={`/resources/${hero.slug}`} className="group relative block overflow-hidden rounded-2xl border border-border bg-muted">
                  {hero.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hero.cover_url} alt={hero.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-64 w-full items-center justify-center text-sm text-muted-foreground">No cover image</div>
                  )}
                </Link>
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Featured</span>
                  <h2 className="mt-2 text-xl font-bold text-foreground">{hero.title}</h2>
                  {hero.resource_type && <p className="mt-1 text-sm capitalize text-muted-foreground">{typeLabel(hero.resource_type)}</p>}
                  {hero.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{hero.description}</p>}
                  <Link href={`/resources/${hero.slug}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">View resource →</Link>
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
            <h2 className="text-xl font-bold text-foreground">Browse by need</h2>
            <p className="mt-1 text-sm text-muted-foreground">Not sure where to start? Tell us what you&apos;re after.</p>
          </Reveal>
          <Reveal delay={40}>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {USE_CASES.map((uc) => (
                <button
                  key={uc}
                  type="button"
                  onClick={() => browseByNeed(uc)}
                  className={`rounded-2xl border p-5 text-left transition ${filters.useCase === uc ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}
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
                  <h2 className="text-lg font-bold text-foreground">Popular Resources</h2>
                  <div className="mt-4"><ScrollCarousel>{popularPicks.map((r) => <div key={r.id} className="w-72 flex-shrink-0 snap-start"><ResourceCard item={r} /></div>)}</ScrollCarousel></div>
                </div>
              </Reveal>
            )}

            {templatesAndChecklists.length > 0 && (
              <Reveal delay={120}>
                <div className="mt-10">
                  <h2 className="text-lg font-bold text-foreground">Templates & Checklists</h2>
                  <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
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
            <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
              <h2 className="text-lg font-semibold text-foreground">No resources found</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {activeFiltersPresent ? "We couldn't find anything matching your current filters." : "We're adding resources here soon - check back shortly."}
              </p>
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
            <div className="rounded-3xl bg-foreground px-8 py-12 text-center">
              <h2 className="text-2xl font-bold text-background sm:text-3xl">Looking for something more structured?</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-background/70">Resources are just one part of building your career or business -- explore what else is here.</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href="/learn" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">Explore Learn</Link>
                <Link href="/videos" className="rounded-xl border border-background/30 px-6 py-3 text-sm font-semibold text-background hover:bg-background/10">Watch Videos</Link>
                <Link href="/jobs" className="rounded-xl border border-background/30 px-6 py-3 text-sm font-semibold text-background hover:bg-background/10">Browse Jobs</Link>
                <Link href="/opportunities" className="rounded-xl border border-background/30 px-6 py-3 text-sm font-semibold text-background hover:bg-background/10">Find Opportunities</Link>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
