import type { NormalizedListing } from "./types";
import { htmlToText } from "@/lib/htmlToText";

type ArbeitnowItem = {
  slug?: string;
  company_name?: string;
  title?: string;
  description?: string;
  remote?: boolean;
  url?: string;
  tags?: string[];
  job_types?: string[];
  location?: string;
  created_at?: number;
};

export async function fetchArbeitnowListings(feedUrl: string): Promise<NormalizedListing[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "ProwessDigitalSolutionsJobsBot/1.0 (+https://www.prowessdigitalsolutions.com)" },
  });
  if (!res.ok) throw new Error(`Arbeitnow request failed: ${res.status}`);

  const body = (await res.json()) as { data?: ArbeitnowItem[] };
  const items = body.data || [];

  return items
    .filter((item) => item.slug && item.title && item.company_name && item.url)
    .map((item) => ({
      externalId: String(item.slug),
      title: String(item.title).trim(),
      companyName: String(item.company_name).trim(),
      companyLogoUrl: null,
      descriptionText: item.description ? htmlToText(item.description) : "",
      applyUrl: item.url || "",
      locationType: item.remote ? ("remote" as const) : ("on_site" as const),
      country: null,
      city: item.location?.trim() || null,
      tags: [...(item.tags || []), ...(item.job_types || [])],
      // Arbeitnow's created_at is Unix seconds, not milliseconds - confirmed
      // against a live fetch (a 10-digit value, not 13).
      postedAt: item.created_at ? new Date(item.created_at * 1000).toISOString() : null,
    }));
}
