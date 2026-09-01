import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Project = { title: string; role?: string; description?: string; link?: string; tags?: string[] };
type Portfolio = { full_name: string; headline: string; bio: string; projects: Project[] };

async function getPortfolio(slug: string): Promise<Portfolio | null> {
  // Relies on member_portfolios' "public_read_public_portfolios" RLS
  // policy (is_public = true) - this query uses the anon key, so a
  // portfolio its owner has switched to private simply returns no row,
  // same as if the slug never existed.
  const { data } = await supabase
    .from("member_portfolios")
    .select("full_name, headline, bio, projects")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  return data as Portfolio | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const portfolio = await getPortfolio(slug);
  if (!portfolio) return { title: "Portfolio not found" };
  return {
    title: `${portfolio.full_name} - Portfolio`,
    description: portfolio.headline || portfolio.bio?.slice(0, 155) || `${portfolio.full_name}'s portfolio on Prowess Digital Solutions.`,
  };
}

export default async function PortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const portfolio = await getPortfolio(slug);
  if (!portfolio) return notFound();

  const projects = Array.isArray(portfolio.projects) ? portfolio.projects : [];

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{portfolio.full_name}</h1>
        {portfolio.headline && <p className="mt-2 text-lg text-muted-foreground">{portfolio.headline}</p>}

        {portfolio.bio && (
          <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">{portfolio.bio}</p>
        )}

        {projects.length > 0 && (
          <div className="mt-10 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Projects</h2>
            {projects.map((p, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold text-foreground">{p.title}</h3>
                </div>
                {p.role && <p className="mt-0.5 text-sm text-muted-foreground">{p.role}</p>}
                {p.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.description}</p>}
                {p.link && (
                  <a href={p.link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                    View project →
                  </a>
                )}
                {p.tags && p.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.map((tag, ti) => (
                      <span key={ti} className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="mt-16 text-center text-xs text-muted-foreground">
          Built with Prowess Digital Solutions&rsquo; Portfolio Builder.
        </p>
      </div>
    </div>
  );
}
