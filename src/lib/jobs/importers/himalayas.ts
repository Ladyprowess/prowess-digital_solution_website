import type { NormalizedListing } from "./types";
import { fetchRssItems } from "@/lib/rss/fetchRss";
import { htmlToText } from "@/lib/htmlToText";

type HimalayasItem = { companyName?: string };

export async function fetchHimalayasListings(feedUrl: string): Promise<NormalizedListing[]> {
  const items = await fetchRssItems<HimalayasItem>(feedUrl, [["himalayasJobs:companyName", "companyName"]]);

  return items
    .filter((item) => item.title && item.link)
    .map((item) => ({
      externalId: item.guid || item.link || item.title || "",
      title: (item.title || "").trim(),
      companyName: item.companyName?.trim() || "Unknown",
      companyLogoUrl: null,
      // htmlToText(content) over contentSnippet - see remoteFirstJobs.ts for
      // why: rss-parser's snippet extraction handles paragraph breaks
      // inconsistently, htmlToText always inserts one at every </p>.
      descriptionText: item.content ? htmlToText(item.content) : (item.contentSnippet || ""),
      applyUrl: item.link || "",
      locationType: "remote" as const,
      country: null,
      city: null,
      tags: item.categories || [],
    }));
}
