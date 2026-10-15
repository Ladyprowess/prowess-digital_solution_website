import Parser from "rss-parser";

// Every connector that reads a plain RSS feed goes through this one parser
// instance rather than re-instantiating rss-parser per source. Item-level
// custom fields (e.g. Himalayas' <himalayasJobs:companyName>) are declared
// per-call since different feeds use different namespaced tags.
export async function fetchRssItems<CustomItem extends Record<string, unknown> = Record<string, never>>(
  feedUrl: string,
  customItemFields: [string, string][] = []
): Promise<(Parser.Item & CustomItem)[]> {
  const parser = new Parser<Record<string, never>, CustomItem>({
    headers: { "User-Agent": "ProwessDigitalSolutionsJobsBot/1.0 (+https://www.prowessdigitalsolutions.com)" },
    customFields: { item: customItemFields },
  });
  const feed = await parser.parseURL(feedUrl);
  return (feed.items || []) as (Parser.Item & CustomItem)[];
}
