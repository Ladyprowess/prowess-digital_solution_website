import Link from "next/link";
import BlogSearchBar from "./BlogSearchBar";


export const revalidate = 600; // refresh every 10 minutes

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
  return clean.length > 170 ? clean.slice(0, 170) + "…" : clean;
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
        border: "1px solid #e5e5e5",
        textDecoration: "none",
        fontWeight: 600,
        opacity: isActive ? 1 : 0.85,
      }}
    >
      {label}
    </Link>
  );
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; q?: string }>;
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
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700 }}>Blog</h1>
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

              <a
                href={p.URL}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: 10,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Read Blog →
              </a>
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
  );
}

