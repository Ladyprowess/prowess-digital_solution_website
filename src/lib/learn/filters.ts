import type { SortValue } from "./constants";
import type { LearnKind } from "./types";

export type LearnFilters = {
  q: string;
  kind: LearnKind | "";
  level: string;
  access: string;
  skills: string[];
  sort: SortValue;
  page: number;
};

export const DEFAULT_FILTERS: LearnFilters = {
  q: "", kind: "", level: "", access: "", skills: [], sort: "relevant", page: 1,
};

export function filtersFromSearchParams(sp: URLSearchParams): LearnFilters {
  return {
    q: sp.get("q") || "",
    kind: sp.get("kind") === "course" ? "course" : "",
    level: sp.get("level") || "",
    access: sp.get("access") || "",
    skills: sp.get("skills") ? sp.get("skills")!.split(",").filter(Boolean) : [],
    sort: (sp.get("sort") as SortValue) || "relevant",
    page: Math.max(1, Number(sp.get("page")) || 1),
  };
}

export function searchParamsFromFilters(f: LearnFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.kind) sp.set("kind", f.kind);
  if (f.level) sp.set("level", f.level);
  if (f.access) sp.set("access", f.access);
  if (f.skills.length) sp.set("skills", f.skills.join(","));
  if (f.sort !== "relevant") sp.set("sort", f.sort);
  if (f.page > 1) sp.set("page", String(f.page));
  return sp;
}

const FACET_KEYS = ["q", "level", "access"] as const;

export function hasActiveFilters(f: LearnFilters): boolean {
  return FACET_KEYS.some((k) => Boolean(f[k])) || f.skills.length > 0;
}
