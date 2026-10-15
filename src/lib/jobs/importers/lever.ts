import type { NormalizedListing } from "./types";
import { htmlToText } from "@/lib/htmlToText";

type LeverItem = {
  id?: string;
  text?: string;
  hostedUrl?: string;
  applyUrl?: string;
  descriptionPlain?: string;
  description?: string;
  categories?: { location?: string; team?: string; commitment?: string; department?: string };
  // Best-effort - Lever's public postings API documents createdAt as epoch
  // milliseconds on every posting, but no job_sources row currently uses
  // this connector, so this couldn't be confirmed against a live response
  // the way every other connector's date field was this session.
  createdAt?: number;
};

// One job_sources row per company, e.g. https://api.lever.co/v0/postings/{company}
// Lever's postings response has no company name field at all (it's
// implicit in which company's endpoint you called), so it's read back out
// of the feed URL itself instead.
function companyNameFromFeedUrl(feedUrl: string): string {
  const match = feedUrl.match(/postings\/([^/?]+)/);
  if (!match) return "Unknown";
  return match[1].split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export async function fetchLeverListings(feedUrl: string): Promise<NormalizedListing[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "ProwessDigitalSolutionsJobsBot/1.0 (+https://www.prowessdigitalsolutions.com)" },
  });
  if (!res.ok) throw new Error(`Lever request failed: ${res.status}`);

  const items = (await res.json()) as LeverItem[];
  const companyName = companyNameFromFeedUrl(feedUrl);

  return items
    .filter((item) => item.id && item.text && (item.hostedUrl || item.applyUrl))
    .map((item) => {
      const locationName = item.categories?.location?.trim() || "";
      return {
        externalId: String(item.id),
        title: String(item.text).trim(),
        companyName,
        companyLogoUrl: null,
        descriptionText: item.descriptionPlain || (item.description ? htmlToText(item.description) : ""),
        applyUrl: item.applyUrl || item.hostedUrl || "",
        locationType: /remote/i.test(locationName) ? ("remote" as const) : ("on_site" as const),
        country: null,
        city: locationName || null,
        tags: [item.categories?.team, item.categories?.commitment, item.categories?.department].filter(Boolean) as string[],
        postedAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
      };
    });
}
