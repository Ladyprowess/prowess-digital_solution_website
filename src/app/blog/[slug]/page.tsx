import type { Metadata } from "next";
import Container from "@/components/Container";
import Link from "next/link";
import Script from "next/script";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SITE_URL = "https://prowessdigitalsolutions.com";
const WP_SITE = "prowessdigitalsolutions.wordpress.com";
const BRAND = "#507c80";

type WPPost = {
  ID: number;
  URL: string;
  title: string;
  date: string;
  excerpt?: string;
  content?: string;
  featured_image?: string | null;
};

function stripHtml(input: string) {
  return (input || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function readingTimeFromHtml(html: string) {
    const text = stripHtml(html);
    const words = text.split(" ").filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200)); // 200 wpm
    return `${minutes} min read`;
  }
  
  // If WP content comes without <p> tags (common), convert line breaks into paragraphs
  function normaliseWpHtml(html: string) {
    const raw = html || "";
  
    // if it already has <p> tags, just return
    if (/<p[\s>]/i.test(raw)) return raw;
  
    // Otherwise convert double newlines into paragraphs
    const blocks = raw
      .replace(/\r/g, "")
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean);
  
    return blocks.map((b) => `<p>${b.replace(/\n/g, "<br/>")}</p>`).join("");
  }
  

async function fetchWpPostBySlug(slug: string) {
  const url = `https://public-api.wordpress.com/rest/v1.1/sites/${WP_SITE}/posts/slug:${encodeURIComponent(
    slug
  )}`;

  const res = await fetch(url, {
    next: { revalidate },
    headers: { "user-agent": "Mozilla/5.0" },
  });

  if (!res.ok) return null;
  return (await res.json()) as WPPost;
}

type PageProps = {
  params?: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const slug = resolved?.slug;

  if (!slug) return {};

  const post = await fetchWpPostBySlug(slug);
  if (!post) return {};

  const title = stripHtml(post.title) || "Blog";
  const desc =
    stripHtml(post.excerpt || "") ||
    stripHtml(post.content || "").split(" ").slice(0, 25).join(" ") + "…";

  const canonical = `${SITE_URL}/blog/${slug}`;

  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title,
      description: desc,
      url: canonical,
      type: "article",
      images: post.featured_image ? [{ url: post.featured_image }] : ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: post.featured_image ? [post.featured_image] : ["/og-image.png"],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const resolved = await params;
  const slug = resolved?.slug;

  if (!slug) {
    return (
      <main style={{ padding: 24 }}>
        <p>Post not found.</p>
      </main>
    );
  }

  const post = await fetchWpPostBySlug(slug);

  if (!post) {
    return (
      <main style={{ padding: 24 }}>
        <p>Post not found.</p>
        <Link href="/blog" style={{ color: BRAND, fontWeight: 700, textDecoration: "none" }}>
          ← Back to Blog
        </Link>
      </main>
    );
  }

  const title = stripHtml(post.title);
const date = formatDate(post.date);

// WordPress.com often returns an author object; we’ll gracefully fallback
const authorName =
  // @ts-expect-error - WP API shape varies
  post.author?.name ||
  // @ts-expect-error
  post.author?.display_name ||
  "Prowess Digital Solutions";

const readTime = readingTimeFromHtml(post.content || "");
const contentHtml = normaliseWpHtml(post.content || "");

return (
  <div className="page-wrap">
<Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7888248635786937"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
    {/* HERO */}
    <section className="section bg-[#eef6f6]">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold tracking-wide text-slate-500">
            {date} • {readTime} • By {authorName}
          </p>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {title}
          </h1>

          <div className="mt-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-semibold text-[#507c80] hover:opacity-80"
            >
              <span aria-hidden>←</span> Back to Blog
            </Link>
          </div>
        </div>
      </Container>
    </section>

    {/* BODY */}
    <section className="section bg-white">
      <Container>
        <div className="mx-auto max-w-3xl">
          {post.featured_image ? (
            <img
              src={post.featured_image}
              alt=""
              className="mb-8 w-full rounded-2xl border border-slate-200 object-cover"
              loading="lazy"
            />
          ) : null}

          {/* ✅ Clean typography wrapper */}
          <article className="blog-content">
            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </article>

          {/* ✅ CTA block (matches your services positioning) */}
          <div className="mt-10 rounded-2xl border border-slate-200 bg-[#eef6f6] p-6 sm:p-8">
            <h3 className="text-xl font-bold text-slate-900">
              Need clarity and structure in your business?
            </h3>
            <p className="mt-2 text-slate-700 leading-relaxed">
              If you are overwhelmed or unsure of your next step, start with a Business Clarity Session.
              We’ll help you organise your thinking, identify priorities, and decide what to do next.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/services/business-clarity-session"
                className="inline-flex items-center justify-center rounded-xl bg-[#507c80] px-6 py-3 font-semibold text-white hover:opacity-95"
              >
                Start with a Clarity Session
              </Link>

              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50"
              >
                View All Services
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  </div>
);

}
