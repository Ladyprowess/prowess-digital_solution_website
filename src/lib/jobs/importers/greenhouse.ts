import type { NormalizedListing } from "./types";
import { htmlToText } from "@/lib/htmlToText";

type GreenhouseItem = {
  id?: number;
  title?: string;
  absolute_url?: string;
  content?: string;
  location?: { name?: string };
  company_name?: string;
  departments?: { name: string }[];
};

// One job_sources row per company, e.g.
// https://boards-api.greenhouse.io/v1/boards/{company_token}/jobs?content=true
// - Greenhouse itself is a job board platform, not one source, so this
// connector is reused across as many company-specific rows as get added.
export async function fetchGreenhouseListings(feedUrl: string): Promise<NormalizedListing[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "ProwessDigitalSolutionsJobsBot/1.0 (+https://prowessdigitalsolutions.com)" },
  });
  if (!res.ok) throw new Error(`Greenhouse request failed: ${res.status}`);

  const body = (await res.json()) as { jobs?: GreenhouseItem[] };
  const items = body.jobs || [];

  return items
    .filter((item) => item.id && item.title && item.absolute_url)
    .map((item) => {
      const locationName = item.location?.name?.trim() || "";
      return {
        externalId: String(item.id),
        title: String(item.title).trim(),
        companyName: item.company_name?.trim() || "Unknown",
        companyLogoUrl: null,
        descriptionText: item.content ? htmlToText(item.content) : "",
        applyUrl: item.absolute_url || "",
        // Greenhouse gives no clean remote/on-site flag - the location text
        // is the only signal, so it's read for the word "remote" rather
        // than assumed, since most Greenhouse postings are office-based.
        locationType: /remote/i.test(locationName) ? ("remote" as const) : ("on_site" as const),
        country: null,
        city: locationName || null,
        tags: (item.departments || []).map((d) => d.name),
      };
    });
}
