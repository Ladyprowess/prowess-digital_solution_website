import type { NormalizedListing } from "./types";
import { htmlToText } from "@/lib/htmlToText";

type RemoteOkApiItem = {
  id?: string | number;
  slug?: string;
  position?: string;
  company?: string;
  company_logo?: string;
  description?: string;
  apply_url?: string;
  url?: string;
  location?: string;
  tags?: string[];
  date?: string;
};

export async function fetchRemoteOkListings(feedUrl: string): Promise<NormalizedListing[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "ProwessDigitalSolutionsJobsBot/1.0 (+https://prowessdigitalsolutions.com)" },
  });
  if (!res.ok) throw new Error(`Remote OK request failed: ${res.status}`);

  const data = (await res.json()) as RemoteOkApiItem[];
  // First element is a legal/attribution notice, not a job - Remote OK's
  // own documented API shape.
  const items = data.slice(1);

  return items
    .filter((item) => item.id && item.position && item.company && (item.apply_url || item.url))
    .map((item) => ({
      externalId: String(item.id),
      title: String(item.position).trim(),
      companyName: String(item.company).trim(),
      companyLogoUrl: item.company_logo || null,
      descriptionText: item.description ? htmlToText(item.description) : "",
      applyUrl: item.apply_url || item.url || "",
      locationType: "remote" as const,
      country: null,
      city: item.location?.trim() || null,
      tags: Array.isArray(item.tags) ? item.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      postedAt: item.date || null,
    }));
}
