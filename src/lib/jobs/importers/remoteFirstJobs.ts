import type { NormalizedListing } from "./types";
import { fetchRssItems } from "@/lib/rss/fetchRss";
import { htmlToText } from "@/lib/htmlToText";

// RemoteFirstJobs titles are always "{Job Title} at {Company}" - confirmed
// against a live fetch of their cybersecurity feed. Splitting on the last
// " at " handles titles that themselves contain the word "at".
function splitTitleAndCompany(rawTitle: string): { title: string; company: string } {
  const idx = rawTitle.lastIndexOf(" at ");
  if (idx === -1) return { title: rawTitle.trim(), company: "Unknown" };
  return { title: rawTitle.slice(0, idx).trim(), company: rawTitle.slice(idx + 4).trim() };
}

export async function fetchRemoteFirstJobsListings(feedUrl: string): Promise<NormalizedListing[]> {
  const items = await fetchRssItems(feedUrl);

  return items
    .filter((item) => item.title && item.link)
    .map((item) => {
      const { title, company } = splitTitleAndCompany(item.title || "");
      return {
        externalId: item.guid || item.link || title,
        title,
        companyName: company,
        companyLogoUrl: null,
        // htmlToText(content) over contentSnippet: rss-parser's own snippet
        // extraction handles paragraph breaks inconsistently (depends on
        // incidental whitespace in the source HTML), while htmlToText
        // deterministically inserts a real break at every </p> - confirmed
        // by comparing both against live feed data.
        descriptionText: item.content ? htmlToText(item.content) : (item.contentSnippet || ""),
        applyUrl: item.link || "",
        locationType: "remote" as const,
        country: null,
        city: null,
        tags: item.categories || [],
      };
    });
}
