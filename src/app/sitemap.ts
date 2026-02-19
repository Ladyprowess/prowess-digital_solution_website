import { MetadataRoute } from "next";
import { services } from "@/content/site";

const baseUrl = "https://prowessdigitalsolutions.com";

// 🔥 Fetch WordPress posts (for slug indexing)
async function getBlogPosts() {
  try {
    const res = await fetch(
      "https://public-api.wordpress.com/rest/v1.1/sites/prowessdigitalsolutions.wordpress.com/posts?number=100",
      { headers: { "user-agent": "Mozilla/5.0" } }
    );

    if (!res.ok) return [];

    const data = await res.json();

    return data.posts.map((post: any) => ({
      slug: post.slug,
      date: post.date,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = await getBlogPosts();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date("2026-02-19"),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date("2026-02-19"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date("2026-02-19"),
      changeFrequency: "yearly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date("2026-02-19"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date("2026-02-19"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/case-studies`,
      lastModified: new Date("2026-02-19"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date("2026-02-19"),
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date("2026-02-19"),
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date("2026-02-19"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: new Date("2026-02-19"),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  // ✅ Service pages
  const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${baseUrl}/services/${service.slug}`,
    lastModified: new Date("2026-02-19"),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // 🔥 Blog slug pages
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...servicePages, ...blogPages];
}
