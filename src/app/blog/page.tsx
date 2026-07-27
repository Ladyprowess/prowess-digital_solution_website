import Link from "next/link";
import BlogSearchBar from "./BlogSearchBar";
import Script from "next/script";
import AgencyPageHeader from "@/components/AgencyPageHeader";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";

export const dynamic = "force-dynamic";
export const revalidate = 0; // always fetch fresh

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
      className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
        isActive
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-foreground hover:bg-muted"
      }`}
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

  // Fetch once (and include q)
  const { posts, found } = await fetchWpPosts(currentPage, perPage, q);
  const totalPages = Math.max(1, Math.ceil(found / perPage));

  // Build page number range
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="pb-16">
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7888248635786937"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      <AgencyPageHeader
        eyebrow="Blog"
        title={
          <>
            Practical business <span className="text-primary">thinking and guides.</span>
          </>
        }
        description="Articles that help you build structure, make better decisions, and think long term about your business."
        proof={[
          "Business structure and operations",
          "Founder decision making",
          "Practical guides you can apply",
        ]}
      />

      <section className="py-12 sm:py-16">
        <Container>
          <Reveal>
            <header className="mb-8">
              <p className="text-base leading-relaxed text-muted-foreground">
                Latest Articles From Prowess Digital Solutions.
              </p>

              <BlogSearchBar />

              {q ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Showing results for: <strong className="text-foreground">{q}</strong>
                </p>
              ) : null}
            </header>
          </Reveal>

          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => {
              const title = stripHtml(p.title) || "Untitled";
              const date = formatDate(p.date);
              const excerpt = makeExcerpt(p);
              const image = p.featured_image || null;
              const slug = new URL(p.URL).pathname.split("/").filter(Boolean).pop();

              return (
                <Reveal key={p.ID} delay={i * 70}>
                  <article className="group h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                    {image ? (
                      <div className="h-40 w-full overflow-hidden bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : null}

                    <div className="p-5">
                      <div className="text-xs font-medium text-muted-foreground">{date}</div>

                      <h2 className="mt-2 text-lg font-bold leading-snug text-foreground">
                        {title}
                      </h2>

                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {excerpt}
                      </p>

                      <Link
                        href={`/blog/${slug}`}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary transition group-hover:opacity-80"
                      >
                        Read Blog
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </Link>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </section>

          <Reveal delay={120}>
            <nav
              aria-label="Pagination"
              className="mt-10 flex flex-wrap items-center gap-2"
            >
              <span className="mr-2 text-sm text-muted-foreground">
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
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
