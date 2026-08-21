import type { SortValue } from "./constants";

// Kept deliberately short per review: Location / Eligibility location /
// Funding / Application cost / Deadline / Skills, plus the type tab and
// keyword search. No standalone `country` facet - eligibleLocation and
// locationType already cover the geography question, and country remains
// searchable via keyword instead of getting its own sidebar control.
export type OpportunityFilters = {
  q: string;
  type: string; // opportunity_types.slug
  locationType: string; // "" | remote | hybrid | on_site | any
  eligibleLocation: string;
  skills: string[]; // skills.slug[]
  fundingType: string;
  applicationCost: string; // "" | free | paid
  deadlineWindow: string; // "" | today | week | month | no_deadline
  sort: SortValue;
  page: number;
};

export const DEFAULT_FILTERS: OpportunityFilters = {
  q: "", type: "", locationType: "", eligibleLocation: "", skills: [],
  fundingType: "", applicationCost: "", deadlineWindow: "", sort: "relevant", page: 1,
};

export function filtersFromSearchParams(sp: URLSearchParams): OpportunityFilters {
  return {
    q: sp.get("q") || "",
    type: sp.get("type") || "",
    locationType: sp.get("location") || "",
    eligibleLocation: sp.get("eligible") || "",
    skills: sp.get("skills") ? sp.get("skills")!.split(",").filter(Boolean) : [],
    fundingType: sp.get("funding") || "",
    applicationCost: sp.get("cost") || "",
    deadlineWindow: sp.get("deadline") || "",
    sort: (sp.get("sort") as SortValue) || "relevant",
    page: Math.max(1, Number(sp.get("page")) || 1),
  };
}

export function searchParamsFromFilters(f: OpportunityFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.type) sp.set("type", f.type);
  if (f.locationType) sp.set("location", f.locationType);
  if (f.eligibleLocation) sp.set("eligible", f.eligibleLocation);
  if (f.skills.length) sp.set("skills", f.skills.join(","));
  if (f.fundingType) sp.set("funding", f.fundingType);
  if (f.applicationCost) sp.set("cost", f.applicationCost);
  if (f.deadlineWindow) sp.set("deadline", f.deadlineWindow);
  if (f.sort !== "relevant") sp.set("sort", f.sort);
  if (f.page > 1) sp.set("page", String(f.page));
  return sp;
}

const FACET_KEYS = ["q", "type", "locationType", "eligibleLocation", "fundingType", "applicationCost", "deadlineWindow"] as const;

export function hasActiveFilters(f: OpportunityFilters): boolean {
  return FACET_KEYS.some((k) => Boolean(f[k])) || f.skills.length > 0;
}
