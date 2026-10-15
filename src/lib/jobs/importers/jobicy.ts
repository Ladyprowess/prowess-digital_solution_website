import type { NormalizedListing } from "./types";
import { htmlToText } from "@/lib/htmlToText";

type JobicyItem = {
  id?: number;
  url?: string;
  jobTitle?: string;
  companyName?: string;
  companyLogo?: string;
  jobIndustry?: string[];
  jobType?: string[];
  jobGeo?: string;
  jobDescription?: string;
  pubDate?: string;
};

// Jobicy's RSS is behind a Cloudflare bot challenge that a server-side fetch
// can't pass, so this uses their JSON API instead (same public data, no
// auth). Their terms require Jobicy to be credited as the source - the job
// detail page already shows "Source: <name>" from job_sources.name for
// every imported listing, which covers this.
export async function fetchJobicyListings(feedUrl: string): Promise<NormalizedListing[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "ProwessDigitalSolutionsJobsBot/1.0 (+https://www.prowessdigitalsolutions.com)" },
  });
  if (!res.ok) throw new Error(`Jobicy request failed: ${res.status}`);

  const body = (await res.json()) as { jobs?: JobicyItem[] };
  const items = body.jobs || [];

  return items
    .filter((item) => item.id && item.jobTitle && item.companyName && item.url)
    .map((item) => ({
      externalId: String(item.id),
      title: String(item.jobTitle).trim(),
      companyName: String(item.companyName).trim(),
      companyLogoUrl: item.companyLogo || null,
      descriptionText: item.jobDescription ? htmlToText(item.jobDescription) : "",
      applyUrl: item.url || "",
      locationType: "remote" as const,
      country: null,
      city: item.jobGeo?.trim() || null,
      tags: [...(item.jobIndustry || []), ...(item.jobType || [])],
      postedAt: item.pubDate || null,
    }));
}
