import Link from "next/link";
import BlogSearchBar from "./BlogSearchBar";
import Script from "next/script";
import Container from "@/components/Container";

export const dynamic = "force-dynamic";
export const revalidate = 0; // always fetch fresh



// ✅ ADD THIS HERE (TOP LEVEL)
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

function makeExcerpt(p: WPPost) {
  const raw = p.excerpt || p.content || "";
  const clean = stripHtml(raw);

  const words = clean.split(" ").filter(Boolean);

  return words.length > 20
    ? words.slice(0, 20).join(" ") + "…"
    : clean;
}


async function fetchWpPosts(page: number, perPage: number, q?: string) {
  const site = "prowessdigitalsolutions.wordpress.com";
  

  const params = new URLSearchParams({
    number: String(perPage),
    page: String(page),
  });

  if (q && q.trim()) params.set("search", q.trim());

  const url = `https://public-api.wordpress.com/rest/v1.1/sites/${site}/posts/?${params.toString()}`;

  const res = await fetch(url, {
    next: { revalidate },
    headers: { "user-agent": "Mozilla/5.0" },
  });
  
  

  if (!res.ok) throw new Error(`WP API error: ${res.status}`);

  return (await res.json()) as { posts: WPPost[]; found: number };
}


function PageLink({
  page,
  current,
  label,
  q,
}: {
  page: number;
  current: number;
  label: React.ReactNode;
  q?: string;
}) {
  const isActive = page === current;

  const params = new URLSearchParams({ page: String(page) });
  if (q && q.trim()) params.set("q", q.trim());

  return (
    <Link
      href={`/blog?${params.toString()}`}
      aria-current={isActive ? "page" : undefined}
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        border: `1px solid ${isActive ? BRAND : "#e5e5e5"}`,
        textDecoration: "none",
        fontWeight: 700,
        opacity: 1,
        color: isActive ? BRAND : "inherit",
        background: isActive ? "rgba(80,124,128,0.08)" : "white",
      }}
      
    >
      {label}
    </Link>
  );
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {

  const perPage = 6;

  const sp = (await searchParams) ?? {};
  const currentPageRaw = sp.page ?? "1";
  const currentPage = Math.max(1, Number.parseInt(currentPageRaw, 10) || 1);

  const q = sp.q?.trim() || "";




  // ✅ Fetch ONCE (and include q)
  const { posts, found } = await fetchWpPosts(currentPage, perPage, q);
  const totalPages = Math.max(1, Math.ceil(found / perPage));

  // Build page number range
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <>
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7888248635786937"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />

    {/* ── HERO ──────────────────────────────────────────────────────────── */}
    <section className="relative overflow-hidden bg-[#0c1a1b] py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(80,124,128,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(80,124,128,.07) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, #000 40%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, #507c80 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <Container>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#507c80]/30 bg-[#507c80]/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#507c80]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#6a9ea3]">
              Blog
            </span>
          </div>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Practical Business
            <span className="block text-[#507c80]">Thinking & Guides</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
            Articles that help you build structure, make better decisions, and think long-term about your business.
          </p>
        </div>
      </Container>
    </section>

    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ marginBottom: 18 }}>
        <p style={{ marginTop: 8, opacity: 0.8 }}>
          Latest Articles From Prowess Digital Solutions.
        </p>

        <BlogSearchBar />

        {q ? (
          <p style={{ marginTop: 10, opacity: 0.75 }}>
            Showing results for: <strong>{q}</strong>
          </p>
        ) : null}
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        {posts.map((p) => {
          const title = stripHtml(p.title) || "Untitled";
          const date = formatDate(p.date);
          const excerpt = makeExcerpt(p);
          const image = p.featured_image || null;

          return (
            <article
              key={p.ID}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 14,
                padding: 14,
                background: "white",
              }}
            >
              {image ? (
                <div style={{ marginBottom: 10 }}>
                  <img
                    src={image}
                    alt=""
                    style={{
                      width: "100%",
                      height: 160,
                      objectFit: "cover",
                      borderRadius: 12,
                      display: "block",
                    }}
                    loading="lazy"
                  />
                </div>
              ) : null}

              <div style={{ fontSize: 13, opacity: 0.7 }}>{date}</div>

              <h2 style={{ marginTop: 8, fontSize: 18, fontWeight: 700 }}>
                {title}
              </h2>

              <p style={{ marginTop: 8, opacity: 0.85, lineHeight: 1.5 }}>
                {excerpt}
              </p>

              <Link
  href={`/blog/${new URL(p.URL).pathname.split("/").filter(Boolean).pop()}`}
  style={{
    display: "inline-block",
    marginTop: 10,
    fontWeight: 700,
    textDecoration: "none",
    color: BRAND,
  }}
>
  Read Blog →
</Link>

            </article>
          );
        })}
      </section>

      <nav
        aria-label="Pagination"
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          marginTop: 18,
        }}
      >
        <span style={{ opacity: 0.7, marginRight: 8 }}>
          Page {currentPage} of {totalPages}
        </span>

        {currentPage > 1 ? (
          <PageLink page={currentPage - 1} current={currentPage} label="← Prev" q={q} />
        ) : null}

        {pageNumbers.map((n) => (
          <PageLink key={n} page={n} current={currentPage} label={n} q={q} />
        ))}

        {currentPage < totalPages ? (
          <PageLink page={currentPage + 1} current={currentPage} label="Next →" q={q} />
        ) : null}
      </nav>
    </main>
    </>
  );
}

