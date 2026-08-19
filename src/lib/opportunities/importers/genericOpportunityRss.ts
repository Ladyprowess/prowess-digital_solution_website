import type { NormalizedOpportunity } from "./types";
import { fetchRssItems } from "@/lib/rss/fetchRss";
import { htmlToText } from "@/lib/htmlToText";

// Covers any standard WordPress-style opportunity RSS feed (Opportunities
// for Youth, Youth Opportunities Hub, Your Opportunities Africa, and any
// future site with the same /feed/ shape) - title/link/description/
// category are all it needs, so one connector serves every source that
// fits this shape instead of one per site.
export async function fetchGenericOpportunityRss(feedUrl: string): Promise<NormalizedOpportunity[]> {
  const items = await fetchRssItems(feedUrl);

  return items
    .filter((item) => item.title && item.link)
    .map((item) => ({
      externalId: item.guid || item.link || item.title || "",
      title: (item.title || "").trim(),
      organisationName: null,
      descriptionText: item.contentSnippet || (item.content ? htmlToText(item.content) : ""),
      applyUrl: item.link || "",
      locationType: "any" as const,
      country: null,
      city: null,
      tags: item.categories || [],
    }));
}
