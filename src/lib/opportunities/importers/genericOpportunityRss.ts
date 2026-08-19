import type { NormalizedOpportunity } from "./types";
import { fetchRssItems } from "@/lib/rss/fetchRss";
import { htmlToText } from "@/lib/htmlToText";

// WordPress/Jetpack auto-appends "The post <title> appeared first on <site>."
// to every feed description - confirmed against a live fetch, and this
// exact phrasing is a standard Jetpack feature used across huge numbers of
// WordPress sites, not something specific to one source here.
const WORDPRESS_BOILERPLATE = /\s*The post\b[\s\S]*?\bappeared first on\b[\s\S]*$/i;

// Promotional inserts common across this genre of site (African youth
// opportunity aggregators almost universally push a Telegram/WhatsApp
// channel inside the post body itself) - stripped by phrase rather than by
// tag, since they're plain text mixed into the same paragraph as real
// content, not a separate element.
const PROMO_PHRASES = [/join our telegram channel/gi, /join our whatsapp group/gi];

function cleanOpportunityDescription(raw: string): string {
  let text = raw.replace(WORDPRESS_BOILERPLATE, "");
  for (const phrase of PROMO_PHRASES) text = text.replace(phrase, "");
  return text.replace(/\s{2,}/g, " ").trim();
}

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
      // htmlToText(content) over contentSnippet - see the jobs connectors
      // for why: rss-parser's snippet extraction handles paragraph breaks
      // inconsistently, htmlToText always inserts one at every </p>.
      descriptionText: cleanOpportunityDescription(item.content ? htmlToText(item.content) : (item.contentSnippet || "")),
      applyUrl: item.link || "",
      locationType: "any" as const,
      country: null,
      city: null,
      tags: item.categories || [],
    }));
}
