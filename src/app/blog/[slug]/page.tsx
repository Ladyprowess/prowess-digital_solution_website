import type { Metadata } from "next";
import Container from "@/components/Container";
import Link from "next/link";

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

  return (
    <div className="page-wrap">
      <section className="section bg-[#eef6f6]">
        <Container>
          <div className="mx-auto max-w-3xl">
            <p style={{ opacity: 0.75, marginBottom: 8 }}>{date}</p>
            <h1 className="h1">{title}</h1>

            <div style={{ marginTop: 16 }}>
              <Link href="/blog" style={{ color: BRAND, fontWeight: 700, textDecoration: "none" }}>
                ← Back to Blog
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="section bg-white">
        <Container>
          <div className="mx-auto max-w-3xl">
            {post.featured_image ? (
              <img
                src={post.featured_image}
                alt=""
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 16,
                  marginBottom: 18,
                }}
              />
            ) : null}

            {/* ✅ Render HTML from WordPress */}
            <article
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content || "" }}
            />

            {/* ✅ Simple CTA (keeps brand positioning) */}
            <div
              style={{
                marginTop: 28,
                padding: 18,
                borderRadius: 16,
                border: "1px solid #e5e5e5",
                background: "white",
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
                Need clarity and structure in your business?
              </h3>
              <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
                If you are overwhelmed or unsure of your next step, start with a Business Clarity Session. We’ll help you
                organise your thinking, identify priorities, and decide what to do next.
              </p>

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link
                  href="/services/business-clarity-session"
                  style={{
                    background: BRAND,
                    color: "white",
                    padding: "10px 14px",
                    borderRadius: 12,
                    textDecoration: "none",
                    fontWeight: 800,
                  }}
                >
                  Start with a Clarity Session
                </Link>

                <Link
                  href="/services"
                  style={{
                    background: "white",
                    border: "1px solid #e5e5e5",
                    padding: "10px 14px",
                    borderRadius: 12,
                    textDecoration: "none",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  View All Services
                </Link>
              </div>
            </div>

            {/* Optional: source link */}
            <p style={{ marginTop: 16, opacity: 0.7 }}>
              Original post:{" "}
              <a href={post.URL} target="_blank" rel="noreferrer" style={{ color: BRAND, fontWeight: 700 }}>
                View on WordPress
              </a>
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}
