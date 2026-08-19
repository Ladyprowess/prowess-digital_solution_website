import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import type { Metadata } from "next";
import Container from "@/components/Container";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const metadata: Metadata = { title: "Search" };

type ResultGroup = {
  title: string;
  items: { slug: string; title: string; sub?: string | null; href: string }[];
};

async function runSearch(query: string): Promise<ResultGroup[]> {
  const like = `%${query}%`;

  const [jobs, opportunities, careerPaths, courses, resources] = await Promise.all([
    supabase.from("jobs").select("slug, title, companies(name)").eq("status", "published").or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`).ilike("title", like).limit(6),
    supabase.from("opportunities").select("slug, title, organisation_name").eq("status", "published").or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`).ilike("title", like).limit(6),
    supabase.from("career_paths").select("slug, title").eq("status", "published").ilike("title", like).limit(6),
    supabase.from("courses").select("slug, title").eq("status", "published").ilike("title", like).limit(6),
    supabase.from("resources").select("slug, title, category").eq("status", "published").ilike("title", like).limit(6),
  ]);

  const groups: ResultGroup[] = [
    {
      title: "Jobs",
      items: (jobs.data || []).map((j) => ({
        slug: j.slug,
        title: j.title,
        sub: (j.companies as unknown as { name: string } | null)?.name,
        href: `/jobs/${j.slug}`,
      })),
    },
    {
      title: "Opportunities",
      items: (opportunities.data || []).map((o) => ({ slug: o.slug, title: o.title, sub: o.organisation_name, href: `/opportunities/${o.slug}` })),
    },
    {
      title: "Career Paths",
      items: (careerPaths.data || []).map((c) => ({ slug: c.slug, title: c.title, href: `/career-paths/${c.slug}` })),
    },
    {
      title: "Learn",
      items: (courses.data || []).map((c) => ({ slug: c.slug, title: c.title, href: `/learn/${c.slug}` })),
    },
    {
      title: "Resources",
      items: (resources.data || []).map((r) => ({ slug: r.slug, title: r.title, sub: r.category, href: `/resources/${r.slug}` })),
    },
  ];

  return groups.filter((g) => g.items.length > 0);
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q || "").trim();
  const groups = query ? await runSearch(query) : [];
  const totalResults = groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="min-h-screen bg-background py-16">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold text-foreground">Search Prowess Digital Solutions</h1>
          <form action="/search" className="mt-6 flex gap-3">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search jobs, opportunities, courses, resources…"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
            />
            <button type="submit" className="flex-shrink-0 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Search
            </button>
          </form>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          {!query ? (
            <p className="text-center text-sm text-muted-foreground">Type something above to search across jobs, opportunities, career paths, courses and resources.</p>
          ) : totalResults === 0 ? (
            <p className="text-center text-sm text-muted-foreground">Nothing found for &ldquo;{query}&rdquo;. Try a different word.</p>
          ) : (
            <div className="space-y-10">
              {groups.map((group) => (
                <section key={group.title}>
                  <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">{group.title.toUpperCase()}</h2>
                  <div className="mt-3 grid gap-3">
                    {group.items.map((item) => (
                      <Link key={item.href} href={item.href} className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition hover:border-primary/30">
                        <span>
                          <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                          {item.sub && <span className="block text-xs text-muted-foreground">{item.sub}</span>}
                        </span>
                        <span className="text-sm font-semibold text-primary">View →</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
