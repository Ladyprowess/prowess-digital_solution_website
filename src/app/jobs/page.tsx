import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import JobsPageClient, { type JobsInitialData } from "./JobsPageClient";
import { filtersFromSearchParams, searchParamsFromFilters } from "@/lib/jobs/filters";
import { fetchJobLookups, fetchJobsPage } from "@/lib/jobs/search";

const SITE_URL = "https://www.prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Find Jobs Worldwide - Remote & On-site Opportunities",
  description:
    "Browse remote, hybrid and on-site jobs worldwide. Filter by role, skill, location, experience level and salary to find opportunities that match where you want to go.",
  alternates: {
    canonical: `${SITE_URL}/jobs`,
  },
  openGraph: {
    title: "Find Jobs Worldwide - Remote & On-site Opportunities",
    description:
      "Browse remote, hybrid and on-site jobs worldwide. Filter by role, skill, location, experience level and salary to find opportunities that match where you want to go.",
    url: `${SITE_URL}/jobs`,
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
async function loadInitialJobs(params: SearchParams): Promise<JobsInitialData | undefined> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return undefined;
  try {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const filters = filtersFromSearchParams(toUrlSearchParams(params));
    const lookups = await fetchJobLookups(db);
    const results = await fetchJobsPage(db, filters, lookups);
    return { lookups, results, queryKey: searchParamsFromFilters(filters).toString() };
  } catch {
    return undefined;
  }
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const initial = await loadInitialJobs(await searchParams);
  return <JobsPageClient initial={initial} />;
}
