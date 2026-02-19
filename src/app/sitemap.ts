import { MetadataRoute } from "next";
import { services } from "@/content/site";

const baseUrl = "https://prowessdigitalsolutions.com";
const WP_SITE = "prowessdigitalsolutions.wordpress.com";

type WPPostLite = {
  slug: string;
  date: string;
};

async function getAllWpPostSlugs(): Promise<WPPostLite[]> {
  const perPage = 100;
  let page = 1;
  const all: WPPostLite[] = [];

  try {
    while (true) {
      const url = `https://public-api.wordpress.com/rest/v1.1/sites/${WP_SITE}/posts/?number=${perPage}&page=${page}`;
      const res = await fetch(url, {
        headers: { "user-agent": "Mozilla/5.0" },
        // sitemap runs server-side, caching is fine
        next: { revalidate: 3600 },
      });

      if (!res.ok) break;

      const data = await res.json();
      const posts = (data?.posts || []) as any[];

      if (!posts.length) break;

      for (const p of posts) {
        if (p?.slug) all.push({ slug: p.slug, date: p.date });
      }

      // WordPress returns `found` total count
      const found = Number(data?.found || 0);
      if (all.length >= found) break;

      page += 1;

      // safety stop (so it never loops forever)
      if (page > 50) break;
    }
  } catch {
    return [];
  }

  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "monthly", priority: 1.0 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/resources`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/case-studies`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.7 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.6 },
    { url: `${baseUrl}/events`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },

    // ✅ IMPORTANT: match your real route name
    { url: `${baseUrl}/careers`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
  ];

  const servicePages: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${baseUrl}/services/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const wpPosts = await getAllWpPostSlugs();
  const blogPostPages: MetadataRoute.Sitemap = wpPosts.map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: p.date ? new Date(p.date) : new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...servicePages, ...blogPostPages];
}
