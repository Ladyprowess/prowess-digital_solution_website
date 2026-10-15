import type { NormalizedListing } from "./types";
import { htmlToText } from "@/lib/htmlToText";

const USER_AGENT = "ProwessDigitalSolutionsJobsBot/1.0 (+https://www.prowessdigitalsolutions.com)";

// CryptoJobsList's own jobs.rss exists and returns 200, but every fetch of
// it - confirmed repeatedly, from this server and with a browser user agent
// alike - comes back with a well-formed <channel> and zero <item> elements.
// The feed is dead on their end even though the site itself has 650+ live
// postings (verified against sitemap-jobs.xml). So this connector doesn't
// touch jobs.rss at all: job_sources.feed_url for this source should be
// sitemap-jobs.xml instead, which is a plain index of live job URLs and is
// explicitly allowed for crawling in their robots.txt. Each job's own page
// embeds a full schema.org JobPosting as JSON-LD (salary, benefits, skills,
// structured location) - richer data than the RSS ever had.
const SITEMAP_URL_PATTERN = /sitemap.*\.xml$/i;

// The sitemap lists every live job, not just new ones - fetching all 650+
// on every run would blow a serverless function's time budget for no
// benefit, since runImportForSource already skips anything already
// imported by external_id. Each run only visits the most recently updated
// ones (sitemap <lastmod> is real and sorts newest-first); periodic cron
// re-runs work through the rest over time.
const MAX_JOBS_PER_RUN = 25;
const FETCH_CONCURRENCY = 5;

type SitemapEntry = { url: string; lastmod: string };

function parseSitemapEntries(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  for (const block of urlBlocks) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim();
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim() || "";
    if (loc) entries.push({ url: loc, lastmod });
  }
  return entries;
}

type SchemaAddress = { addressLocality?: string | null; addressCountry?: string | null };
type SchemaPlace = { address?: SchemaAddress };

type JobPostingSchema = {
  "@type"?: string;
  title?: string;
  description?: string;
  url?: string;
  hiringOrganization?: { name?: string; logo?: string };
  employmentType?: string[] | string;
  jobLocation?: SchemaPlace | SchemaPlace[];
  jobLocationType?: string;
  skills?: string;
  industry?: string;
  datePosted?: string;
};

// Job pages carry several ld+json blocks (WebSite, JobPosting, BreadcrumbList) -
// only the JobPosting one matters here, and it's sometimes the top-level
// object and sometimes nested in an "@graph" array depending on the page.
function extractJobPosting(html: string): JobPostingSchema | null {
  const blocks = html.match(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/g) || [];
  for (const block of blocks) {
    const jsonText = block.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    try {
      const parsed = JSON.parse(jsonText);
      const graph = Array.isArray(parsed?.["@graph"]) ? parsed["@graph"] : [parsed];
      const job = graph.find((node: { "@type"?: string }) => node?.["@type"] === "JobPosting");
      if (job) return job as JobPostingSchema;
    } catch {
      // Malformed block on their end - keep checking the others.
    }
  }
  return null;
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R | null>): Promise<R[]> {
  const results: R[] = [];
  let next = 0;
  async function run() {
    while (next < items.length) {
      const item = items[next++];
      const result = await worker(item);
      if (result) results.push(result);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

async function fetchJobPosting(url: string, sitemapLastmod: string): Promise<NormalizedListing | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const html = await res.text();
    const job = extractJobPosting(html);
    if (!job || !job.title) return null;

    const places = Array.isArray(job.jobLocation) ? job.jobLocation : job.jobLocation ? [job.jobLocation] : [];
    const cities = places.map((p) => p.address?.addressLocality).filter((v): v is string => Boolean(v));
    const countries = places.map((p) => p.address?.addressCountry).filter((v): v is string => Boolean(v));

    const employmentTypes = Array.isArray(job.employmentType) ? job.employmentType : job.employmentType ? [job.employmentType] : [];
    const skillTags = job.skills ? job.skills.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const industryTags = job.industry ? job.industry.split(",").map((s) => s.trim()).filter(Boolean) : [];

    return {
      externalId: job.url || url,
      title: job.title.trim(),
      companyName: job.hiringOrganization?.name?.trim() || "Unknown",
      companyLogoUrl: job.hiringOrganization?.logo || null,
      descriptionText: job.description ? htmlToText(job.description) : "",
      applyUrl: job.url || url,
      locationType: job.jobLocationType === "TELECOMMUTE" ? "remote" : "on_site",
      country: countries[0] || null,
      city: cities.join(", ") || null,
      tags: [...employmentTypes, ...skillTags, ...industryTags],
      // schema.org JobPosting's own datePosted is more precise than the
      // sitemap's <lastmod> (which can reflect any edit, not just the
      // original posting) - only fall back to it when the page's JSON-LD
      // doesn't include one.
      postedAt: job.datePosted || sitemapLastmod || null,
    };
  } catch {
    return null;
  }
}

export async function fetchCryptoJobsListListings(sitemapUrl: string): Promise<NormalizedListing[]> {
  if (!SITEMAP_URL_PATTERN.test(sitemapUrl)) {
    throw new Error("CryptoJobsList source is misconfigured: feed_url must point at sitemap-jobs.xml, not jobs.rss (that feed is dead - see comment in cryptoJobsList.ts).");
  }

  const res = await fetch(sitemapUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`CryptoJobsList sitemap request failed: ${res.status}`);
  const xml = await res.text();

  const entries = parseSitemapEntries(xml)
    .sort((a, b) => b.lastmod.localeCompare(a.lastmod))
    .slice(0, MAX_JOBS_PER_RUN);

  return mapWithConcurrency(entries, FETCH_CONCURRENCY, (entry) => fetchJobPosting(entry.url, entry.lastmod));
}
