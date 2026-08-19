import type { NormalizedListing } from "./types";
import { fetchRssItems } from "@/lib/rss/fetchRss";
import { htmlToText } from "@/lib/htmlToText";

type WwrItem = { region?: string; type?: string; skills?: string };

// WeWorkRemotely titles are always "{Company}: {Job Title}" - confirmed
// against a live fetch. Splitting on the first ": " handles job titles that
// themselves contain a colon further in.
function splitCompanyAndTitle(rawTitle: string): { title: string; company: string } {
  const idx = rawTitle.indexOf(": ");
  if (idx === -1) return { title: rawTitle.trim(), company: "Unknown" };
  return { company: rawTitle.slice(0, idx).trim(), title: rawTitle.slice(idx + 2).trim() };
}

export async function fetchWeWorkRemotelyListings(feedUrl: string): Promise<NormalizedListing[]> {
  const items = await fetchRssItems<WwrItem>(feedUrl, [
    ["region", "region"],
    ["type", "type"],
    ["skills", "skills"],
  ]);

  return items
    .filter((item) => item.title && item.link)
    .map((item) => {
      const { title, company } = splitCompanyAndTitle(item.title || "");
      const skillTags = item.skills ? item.skills.split(",").map((s) => s.trim()).filter(Boolean) : [];
      return {
        externalId: item.guid || item.link || title,
        title,
        companyName: company,
        companyLogoUrl: null,
        descriptionText: item.contentSnippet || (item.content ? htmlToText(item.content) : ""),
        applyUrl: item.link || "",
        locationType: "remote" as const,
        country: null,
        city: item.region?.trim() || null,
        tags: [...(item.categories || []), ...(item.type ? [item.type] : []), ...skillTags],
      };
    });
}
