import type { SortValue } from "./constants";

// Every filter dimension on /jobs, kept in one object instead of one
// useState per filter (the old approach) so it can round-trip through the
// URL as a single unit - required for shareable/bookmarkable filtered
// search results.
export type JobFilters = {
  q: string;
  category: string; // job_categories.slug
  type: string; // job_types.slug
  locationType: string; // "" | remote | hybrid | on_site
  country: string;
  remoteRegion: string;
  experience: string; // "" | entry | junior | mid | senior | executive
  skills: string[]; // skills.slug[]
  salaryMin: string;
  salaryMax: string;
  currency: string;
  datePosted: string; // "" | days as string, e.g. "7"
  closingSoon: boolean;
  company: string; // free-text company name search
  sort: SortValue;
  page: number;
};

export const DEFAULT_FILTERS: JobFilters = {
  q: "", category: "", type: "", locationType: "", country: "", remoteRegion: "",
  experience: "", skills: [], salaryMin: "", salaryMax: "", currency: "",
  datePosted: "", closingSoon: false, company: "", sort: "relevant", page: 1,
};

export function filtersFromSearchParams(sp: URLSearchParams): JobFilters {
  return {
    q: sp.get("q") || "",
    category: sp.get("category") || "",
    type: sp.get("type") || "",
    locationType: sp.get("location") || "",
    country: sp.get("country") || "",
    remoteRegion: sp.get("region") || "",
    experience: sp.get("experience") || "",
    skills: sp.get("skills") ? sp.get("skills")!.split(",").filter(Boolean) : [],
    salaryMin: sp.get("salary_min") || "",
    salaryMax: sp.get("salary_max") || "",
    currency: sp.get("currency") || "",
    datePosted: sp.get("posted") || "",
    closingSoon: sp.get("closing_soon") === "1",
    company: sp.get("company") || "",
    sort: (sp.get("sort") as SortValue) || "relevant",
    page: Math.max(1, Number(sp.get("page")) || 1),
  };
}

// Only ever writes non-default values, so the URL stays clean (no
// "?sort=relevant&page=1" clutter on a plain visit).
export function searchParamsFromFilters(f: JobFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.category) sp.set("category", f.category);
  if (f.type) sp.set("type", f.type);
  if (f.locationType) sp.set("location", f.locationType);
  if (f.country) sp.set("country", f.country);
  if (f.remoteRegion) sp.set("region", f.remoteRegion);
  if (f.experience) sp.set("experience", f.experience);
  if (f.skills.length) sp.set("skills", f.skills.join(","));
  if (f.salaryMin) sp.set("salary_min", f.salaryMin);
  if (f.salaryMax) sp.set("salary_max", f.salaryMax);
  if (f.currency) sp.set("currency", f.currency);
  if (f.datePosted) sp.set("posted", f.datePosted);
  if (f.closingSoon) sp.set("closing_soon", "1");
  if (f.company) sp.set("company", f.company);
  if (f.sort !== "relevant") sp.set("sort", f.sort);
  if (f.page > 1) sp.set("page", String(f.page));
  return sp;
}

const FACET_KEYS = [
  "q", "category", "type", "locationType", "country", "remoteRegion",
  "experience", "salaryMin", "salaryMax", "currency", "datePosted",
  "closingSoon", "company",
] as const;

export function hasActiveFilters(f: JobFilters): boolean {
  return FACET_KEYS.some((k) => {
    const v = f[k];
    return typeof v === "boolean" ? v : Boolean(v);
  }) || f.skills.length > 0;
}
