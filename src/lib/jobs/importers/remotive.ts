import type { NormalizedListing } from "./types";
import { htmlToText } from "@/lib/htmlToText";

type RemotiveItem = {
  id?: number;
  url?: string;
  title?: string;
  company_name?: string;
  company_logo?: string;
  category?: string;
  tags?: string[];
  job_type?: string;
  candidate_required_location?: string;
  description?: string;
};

// Remotive's own terms cap this at "max 4 times a day" - the job_sources
// row for this connector should be seeded with import_frequency_minutes
// >= 360, not the default hourly cadence.
export async function fetchRemotiveListings(feedUrl: string): Promise<NormalizedListing[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "ProwessDigitalSolutionsJobsBot/1.0 (+https://prowessdigitalsolutions.com)" },
  });
  if (!res.ok) throw new Error(`Remotive request failed: ${res.status}`);

  const body = (await res.json()) as { jobs?: RemotiveItem[] };
  const items = body.jobs || [];

  return items
    .filter((item) => item.id && item.title && item.company_name && item.url)
    .map((item) => ({
      externalId: String(item.id),
      title: String(item.title).trim(),
      companyName: String(item.company_name).trim(),
      companyLogoUrl: item.company_logo || null,
      descriptionText: item.description ? htmlToText(item.description) : "",
      applyUrl: item.url || "",
      locationType: "remote" as const,
      country: null,
      city: item.candidate_required_location?.trim() || null,
      tags: [...(item.tags || []), ...(item.category ? [item.category] : []), ...(item.job_type ? [item.job_type] : [])],
    }));
}
