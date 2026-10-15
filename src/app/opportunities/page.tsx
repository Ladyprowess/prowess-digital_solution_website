import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import OpportunitiesPageClient, { type OpportunitiesInitialData } from "./OpportunitiesPageClient";
import { filtersFromSearchParams, hasActiveFilters, searchParamsFromFilters } from "@/lib/opportunities/filters";
import { fetchOpportunitiesPage, fetchOpportunityHighlights, fetchOpportunityLookups } from "@/lib/opportunities/search";

const SITE_URL = "https://www.prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Opportunities - Scholarships, Grants & Internships",
  description:
    "Discover opportunities that can move you forward: scholarships, grants, internships and more, all in one place.",
  alternates: {
    canonical: `${SITE_URL}/opportunities`,
  },
  openGraph: {
    title: "Opportunities - Scholarships, Grants & Internships",
    description:
      "Discover opportunities that can move you forward: scholarships, grants, internships and more, all in one place.",
    url: `${SITE_URL}/opportunities`,
    type: "website",
  },
};

type SearchParams = Record<string, string | string[] | undefined>;

function toUrlSearchParams(params: SearchParams) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) sp.set(key, first);
  }
  return sp;
}

// Renders the first page of results on the server so the listings are in
// the HTML that search engines and link previews read. If the database is
// unreachable the page still renders and the client loads results itself.
async function loadInitialOpportunities(params: SearchParams): Promise<OpportunitiesInitialData | undefined> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return undefined;
  try {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const filters = filtersFromSearchParams(toUrlSearchParams(params));
    const showHighlights = !hasActiveFilters(filters) && filters.page === 1;
    const [lookups, highlights] = await Promise.all([
      fetchOpportunityLookups(db),
      showHighlights ? fetchOpportunityHighlights(db) : Promise.resolve({ featured: [], closingSoon: [] }),
    ]);
    const results = await fetchOpportunitiesPage(db, filters, lookups);
    return { lookups, results, highlights, queryKey: searchParamsFromFilters(filters).toString() };
  } catch {
    return undefined;
  }
}

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const initial = await loadInitialOpportunities(await searchParams);
  return <OpportunitiesPageClient initial={initial} />;
}
