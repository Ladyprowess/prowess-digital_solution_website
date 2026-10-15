import type { SupabaseClient } from "@supabase/supabase-js";
import type { OpportunityCardData } from "@/components/opportunities/OpportunityCard";
import { CLOSING_SOON_DAYS } from "@/lib/closingSoon";
import type { OpportunityFilters } from "./filters";

// Shared by the /opportunities server render (so listings are in the HTML
// search engines and link previews read) and the client-side filters.

export const OPPORTUNITIES_PAGE_SIZE = 12;

export type OpportunityLookup = { id: string; slug: string; name: string };
export type OpportunityLookups = { types: OpportunityLookup[]; skills: OpportunityLookup[] };
export type OpportunitiesPage = { opportunities: OpportunityCardData[]; total: number };
export type OpportunityHighlights = { featured: OpportunityCardData[]; closingSoon: OpportunityCardData[] };

type OpportunityQueryRow = {
  id: string; slug: string; title: string;
  organisation_name: string | null; organisation_logo_url: string | null;
  location_type: "remote" | "hybrid" | "on_site" | "any";
  country: string | null; city: string | null;
  eligibility_summary: string | null; eligible_locations: string[] | null; benefit_tags: string[] | null;
  deadline_at: string | null; published_at: string | null; featured: boolean;
  opportunity_types: { name: string } | null;
  opportunity_skill_map: { skills: { slug: string; name: string } | null }[];
};

function toCardData(o: OpportunityQueryRow): OpportunityCardData {
  return {
    id: o.id, slug: o.slug, title: o.title,
    organisation_name: o.organisation_name, organisation_logo_url: o.organisation_logo_url,
    type: o.opportunity_types?.name || null,
    location_type: o.location_type, country: o.country, city: o.city,
    eligibility_summary: o.eligibility_summary, eligible_locations: o.eligible_locations, benefit_tags: o.benefit_tags,
    skills: (o.opportunity_skill_map || []).map((m) => m.skills).filter((s): s is { slug: string; name: string } => Boolean(s)),
    deadline_at: o.deadline_at, featured: o.featured,
  };
}

const BASE_SELECT = "id, slug, title, organisation_name, organisation_logo_url, location_type, country, city, eligibility_summary, eligible_locations, benefit_tags, deadline_at, published_at, featured, opportunity_types(name), opportunity_skill_map(skills(slug, name))";

export async function fetchOpportunityLookups(db: SupabaseClient): Promise<OpportunityLookups> {
  const [typeRows, skillRows] = await Promise.all([
    db.from("opportunity_types").select("id, slug, name").order("name"),
    db.from("skills").select("id, slug, name").order("name"),
  ]);
  return { types: typeRows.data || [], skills: skillRows.data || [] };
}

// Featured and Closing Soon strips for the default, unfiltered view.
export async function fetchOpportunityHighlights(db: SupabaseClient): Promise<OpportunityHighlights> {
  const nowIso = new Date().toISOString();
  const soonIso = new Date(Date.now() + CLOSING_SOON_DAYS * 86_400_000).toISOString();
  const [f, c] = await Promise.all([
    db.from("opportunities").select(BASE_SELECT).eq("status", "published").eq("featured", true)
      .or(`expires_at.is.null,expires_at.gte.${nowIso}`).order("created_at", { ascending: false }).limit(6),
    db.from("opportunities").select(BASE_SELECT).eq("status", "published")
      .gte("deadline_at", nowIso).lte("deadline_at", soonIso)
      .or(`expires_at.is.null,expires_at.gte.${nowIso}`).order("deadline_at", { ascending: true }).limit(6),
  ]);
  return {
    featured: ((f.data as unknown as OpportunityQueryRow[]) || []).map(toCardData),
    closingSoon: ((c.data as unknown as OpportunityQueryRow[]) || []).map(toCardData),
  };
}

export async function fetchOpportunitiesPage(db: SupabaseClient, filters: OpportunityFilters, lookups: OpportunityLookups): Promise<OpportunitiesPage> {
  let skillOppIds: string[] | null = null;
  if (filters.skills.length > 0) {
    const skillIds = lookups.skills.filter((s) => filters.skills.includes(s.slug)).map((s) => s.id);
    if (skillIds.length === 0) return { opportunities: [], total: 0 };
    const { data: mapRows } = await db.from("opportunity_skill_map").select("opportunity_id").in("skill_id", skillIds);
    skillOppIds = Array.from(new Set((mapRows || []).map((r: { opportunity_id: string }) => r.opportunity_id)));
    if (skillOppIds.length === 0) return { opportunities: [], total: 0 };
  }

  let query = db
    .from("opportunities")
    .select(BASE_SELECT, { count: "exact" })
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`);

  if (skillOppIds) query = query.in("id", skillOppIds);
  if (filters.q.trim()) query = query.ilike("title", `%${filters.q.trim()}%`);
  if (filters.type) {
    const t = lookups.types.find((x) => x.slug === filters.type);
    if (t) query = query.eq("type_id", t.id);
  }
  if (filters.locationType) query = query.eq("location_type", filters.locationType);
  if (filters.eligibleLocation.trim()) query = query.contains("eligible_locations", [filters.eligibleLocation.trim()]);
  if (filters.fundingType) query = query.eq("funding_type", filters.fundingType);
  if (filters.applicationCost) query = query.eq("application_cost", filters.applicationCost);

  if (filters.deadlineWindow === "no_deadline") {
    query = query.is("deadline_at", null);
  } else if (filters.deadlineWindow) {
    const now = new Date();
    const days = filters.deadlineWindow === "today" ? 1 : filters.deadlineWindow === "week" ? 7 : 30;
    const until = new Date(now.getTime() + days * 86_400_000);
    query = query.gte("deadline_at", now.toISOString()).lte("deadline_at", until.toISOString());
  }

  if (filters.sort === "newest") {
    query = query.order("published_at", { ascending: false, nullsFirst: false });
  } else if (filters.sort === "deadline") {
    query = query.order("deadline_at", { ascending: true, nullsFirst: false });
  } else if (filters.sort === "featured") {
    query = query.order("featured", { ascending: false }).order("deadline_at", { ascending: true, nullsFirst: false });
  } else {
    query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
  }

  const from = (filters.page - 1) * OPPORTUNITIES_PAGE_SIZE;
  const { data, count } = await query.range(from, from + OPPORTUNITIES_PAGE_SIZE - 1);
  return { opportunities: ((data as unknown as OpportunityQueryRow[]) || []).map(toCardData), total: count || 0 };
}
