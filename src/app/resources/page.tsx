"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { BookOpen, BriefcaseBusiness, Building2, GraduationCap, HeartHandshake, Library, Search } from "lucide-react";
import { LoadError } from "@/components/LoadError";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Pagination } from "@/components/Pagination";
import { PillTabs, type PillTab } from "@/components/PillTabs";
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
  { label: "Self help", query: "self help", icon: BookOpen },
  { label: "Marriage", query: "marriage", icon: HeartHandshake },
  { label: "Sexual wellness", query: "sexual wellness", icon: HeartHandshake },
  { label: "Tech", query: "technology tech digital web3", icon: GraduationCap },
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
  if (!res.ok || !data?.ok || !Array.isArray(data.items)) {
    throw new Error("Resources could not be loaded.");
  }
  return { items: data.items, total: data.total || 0 };
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
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Debounced, matching /videos and /learn's 150ms search-input pattern.
    const t = setTimeout(async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const params = new URLSearchParams();
        params.set("exclude_resource_type", "video");
        params.set("audience", audienceValues(filters.audience).join(","));
        if (filters.type) params.set("resource_type", filters.type);
        if (filters.useCase) params.set("use_case", filters.useCase);
        if (filters.q.trim()) params.set("q", filters.q.trim());
        params.set("page", String(filters.page));
        params.set("pageSize", String(PAGE_SIZE));

        const { items: nextItems, total: nextTotal } = await fetchResources(params);
        if (cancelled) return;
        setItems(nextItems);
        setTotal(nextTotal);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150);
    return () => { cancelled = true; clearTimeout(t); };
  }, [filters.audience, filters.type, filters.useCase, filters.q, filters.page, retry]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="border-b border-border bg-brand-bg py-12 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <Reveal>
              <div>
                <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                  <Library size={14} aria-hidden="true" />
                  Library
                </div>
                <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                  A useful library for work, business and personal growth.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  Explore ebooks, guides, templates, checklists and articles you can read now or save for later.
                </p>
                <div className="relative mt-7 max-w-2xl">
                  <label htmlFor="resource-search" className="sr-only">Search the library</label>
                  <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="resource-search"
                    value={filters.q}
                    onChange={(e) => updateFilters({ q: e.target.value })}
                    placeholder="Search books, guides, templates, tech, marriage, business..."
                    className="min-h-12 w-full rounded-lg border border-border bg-card pl-11 pr-4 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="hidden rounded-lg border border-border bg-card p-5 shadow-sm lg:block">
                <p className="text-sm font-semibold text-foreground">Keep your best resources in one place.</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Save books, guides and videos from across Prowess, then return to them from your account.
                </p>
                <Link href="/account/learning" className="mt-5 inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  Open my library
                </Link>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* EXPLORE RESOURCES */}
      <section id="explore" className="scroll-mt-20 py-8 sm:py-10">
        <Container>
          <Reveal>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Ebooks and resources</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {loading ? "Loading books and guides..." : loadError ? "Resources are temporarily unavailable." : `${total} resource${total === 1 ? "" : "s"} found`}
                </p>
              </div>
              {!activeFiltersPresent && (
                <div className="mt-6 flex justify-center gap-5">
                  <Link href="/learn" className="text-primary underline">Explore learning</Link>
                  <Link href="/videos" className="text-primary underline">Watch videos</Link>
                </div>
              )}
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
            <div className="mb-8 space-y-3 rounded-lg border border-border bg-card p-3 sm:p-4">
              <PillTabs tabs={AUDIENCE_TABS} active={filters.audience} onChange={(v) => updateFilters({ audience: v })} />
              <PillTabs tabs={TYPE_TABS} active={filters.type} onChange={(v) => updateFilters({ type: v })} />
            </div>
          </Reveal>

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
          ) : loadError ? (
            <LoadError message="We couldn’t load the resources. Please try again." onRetry={() => setRetry((value) => value + 1)} />
          ) : items.length === 0 ? (
            <div className="mx-auto mt-8 max-w-lg rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center">
              <Library className="mx-auto text-primary" size={28} strokeWidth={1.6} aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold text-foreground">No resources found</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {activeFiltersPresent ? "No resource matches your current search or filters." : "There are no published resources in the library right now. You can explore courses and videos while new material is prepared."}
              </p>
              {!activeFiltersPresent && (
                <div className="mt-6 flex justify-center gap-5">
                  <Link href="/learn" className="text-primary underline">Explore learning</Link>
                  <Link href="/videos" className="text-primary underline">Watch videos</Link>
                </div>
              )}
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

          {!loadError && <Pagination page={filters.page} totalPages={totalPages} onPageChange={(p) => updateFilters({ page: p })} />}
        </Container>
      </section>

      {(!loadError && (items.length > 0 || activeFiltersPresent)) && <>
      {/* LIBRARY SHELVES */}
      <section className="border-t border-border bg-muted/35 py-12">
        <Container>
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Browse by shelf</h2>
                <p className="mt-1 text-sm text-muted-foreground">Use these when you want a more specific corner of the library.</p>
              </div>
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

      {/* BROWSE BY NEED */}
      <section className="border-t border-border py-14">
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

      </>}
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
