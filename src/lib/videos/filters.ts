// Mirrors src/lib/jobs/filters.ts's exact shape for /videos?q=...&audience=...&category=...&sort=...&page=...
export type SortValue = "newest" | "shortest" | "longest";

export type VideoFilters = {
  q: string;
  audience: string; // "" | consumer | business
  category: string;
  sort: SortValue;
  page: number;
};

export const DEFAULT_FILTERS: VideoFilters = { q: "", audience: "", category: "", sort: "newest", page: 1 };

export function filtersFromSearchParams(sp: URLSearchParams): VideoFilters {
  const sort = sp.get("sort");
  return {
    q: sp.get("q") || "",
    audience: sp.get("audience") || "",
    category: sp.get("category") || "",
    sort: sort === "shortest" || sort === "longest" ? sort : "newest",
    page: Math.max(1, Number(sp.get("page")) || 1),
  };
}

// Only writes non-default values, keeps the URL clean -- same rule as
// src/lib/jobs/filters.ts's searchParamsFromFilters.
export function searchParamsFromFilters(f: VideoFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.audience) sp.set("audience", f.audience);
  if (f.category) sp.set("category", f.category);
  if (f.sort !== DEFAULT_FILTERS.sort) sp.set("sort", f.sort);
  if (f.page > 1) sp.set("page", String(f.page));
  return sp;
}

const FACET_KEYS: (keyof VideoFilters)[] = ["q", "audience", "category"];

export function hasActiveFilters(f: VideoFilters): boolean {
  return FACET_KEYS.some((k) => f[k] !== DEFAULT_FILTERS[k]);
}
