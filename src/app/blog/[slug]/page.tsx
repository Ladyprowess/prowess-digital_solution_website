import type { Metadata } from "next";
import Container from "@/components/Container";
import Link from "next/link";
import Script from "next/script";
import WrapBlogTables from "@/components/WrapBlogTables";
import { Reveal } from "@/components/Reveal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SITE_URL = "https://prowessdigitalsolutions.com";
const WP_SITE = "prowessdigitalsolutions.wordpress.com";

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
      <Container>
        <div className="py-14 text-foreground">Post not found.</div>
      </Container>
    );
  }

  const post = await fetchWpPostBySlug(slug);

  if (!post) {
    return (
      <Container>
        <div className="py-14">
          <p className="text-foreground">Post not found.</p>
          <Link href="/blog" className="mt-3 inline-flex font-bold text-primary hover:opacity-80">
            ← Back to Blog
          </Link>
        </div>
      </Container>
    );
  }

  const title = stripHtml(post.title);
const date = formatDate(post.date);

// WordPress.com often returns an author object; we’ll gracefully fallback
const authorName =
  // @ts-expect-error - WP API shape varies
  post.author?.name ||
  // @ts-expect-error - WordPress may return display_name in the author object
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
    <section className="section bg-primary/5">
      <Container>
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold tracking-wide text-muted-foreground">
              {date} • {readTime} • By {authorName}
            </p>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              {title}
            </h1>

            <div className="mt-6">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 font-semibold text-primary hover:opacity-80"
              >
                <span aria-hidden>←</span> Back to Blog
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>

    {/* BODY */}
    <section className="section bg-background">
      <Container>
        <div className="mx-auto max-w-3xl">
          {post.featured_image ? (
            <Reveal>
              <img
                src={post.featured_image}
                alt=""
                className="mb-8 w-full rounded-2xl border border-border object-cover"
                loading="lazy"
              />
            </Reveal>
          ) : null}

          {/* Clean typography wrapper */}
          <WrapBlogTables />

          <Reveal delay={60}>
            <article className="blog-content">
              <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
            </article>
          </Reveal>

          {/* CTA block */}
          <Reveal delay={120}>
            <div className="mt-10 rounded-2xl border border-border bg-primary/5 p-6 sm:p-8">
              <h3 className="text-xl font-bold text-foreground">
                Need clarity and structure in your business?
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                If you are overwhelmed or unsure of your next step, start with the Business Structure
                Diagnostic. We&apos;ll help you organise your thinking, identify priorities, and decide
                what to do next.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-95"
                >
                  Start the Diagnostic
                </Link>

                <Link
                  href="/services"
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3 font-semibold text-foreground transition hover:bg-muted"
                >
                  View All Services
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  </div>
);

}
