// Mirrors src/lib/videos/filters.ts's exact shape for
// /resources?q=...&audience=...&type=...&use_case=...&page=...
// No sort param -- /api/resources/route.ts only ever orders by newest
// (popular/rating sorts were removed as dead, nothing writes real values
// to either column), so there's nothing meaningful to let the user choose.
export type ResourceFilters = {
  q: string;
  audience: string; // "" | consumer | business
  type: string; // "" | resource_type value
  useCase: string; // "" | use_case value
  page: number;
};

export const DEFAULT_FILTERS: ResourceFilters = { q: "", audience: "", type: "", useCase: "", page: 1 };

export function filtersFromSearchParams(sp: URLSearchParams): ResourceFilters {
  return {
    q: sp.get("q") || "",
    audience: sp.get("audience") || "",
    type: sp.get("type") || "",
    useCase: sp.get("use_case") || "",
    page: Math.max(1, Number(sp.get("page")) || 1),
  };
}

export function searchParamsFromFilters(f: ResourceFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.audience) sp.set("audience", f.audience);
  if (f.type) sp.set("type", f.type);
  if (f.useCase) sp.set("use_case", f.useCase);
  if (f.page > 1) sp.set("page", String(f.page));
  return sp;
}

const FACET_KEYS: (keyof ResourceFilters)[] = ["q", "audience", "type", "useCase"];

export function hasActiveFilters(f: ResourceFilters): boolean {
  return FACET_KEYS.some((k) => f[k] !== DEFAULT_FILTERS[k]);
}
