import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Project = { title: string; role?: string; description?: string; link?: string; tags?: string[]; coverImageUrl?: string; videoUrl?: string };
type Portfolio = { full_name: string; headline: string; bio: string; photo_url?: string; projects: Project[] };

async function getPortfolio(slug: string): Promise<Portfolio | null> {
  // Relies on member_portfolios' "public_read_public_portfolios" RLS
  // policy (is_public = true) - this query uses the anon key, so a
  // portfolio its owner has switched to private simply returns no row,
  // same as if the slug never existed.
  const { data } = await supabase
    .from("member_portfolios")
    .select("full_name, headline, bio, photo_url, projects")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  return data as Portfolio | null;
}

// Converts a YouTube/Vimeo watch URL into its embeddable form. Returns
// null for anything else so the card falls back to a plain "Watch" link
// instead of trying to iframe a URL that was never meant to be embedded.
function embedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.pathname.startsWith("/shorts/") ? u.pathname.split("/")[2] : u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
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

function TagRow({ tags }: { tags?: string[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {tags.map((tag, ti) => (
        <span key={ti} className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{tag}</span>
      ))}
    </div>
  );
}

function VisualProjectCard({ project }: { project: Project }) {
  const video = project.videoUrl ? embedUrl(project.videoUrl) : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-video w-full bg-muted">
        {video ? (
          <iframe
            src={video}
            title={project.title}
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : project.coverImageUrl ? (
          <Image src={project.coverImageUrl} alt={project.title} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
        ) : null}
      </div>
      <div className="p-5">
        <h3 className="text-base font-bold text-foreground">{project.title}</h3>
        {project.role && <p className="mt-0.5 text-sm text-muted-foreground">{project.role}</p>}
        {project.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{project.description}</p>}
        {project.link && (
          <a href={project.link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
            View project →
          </a>
        )}
        <TagRow tags={project.tags} />
      </div>
    </div>
  );
}

function TextProjectCard({ project }: { project: Project }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-lg font-bold text-foreground">{project.title}</h3>
      {project.role && <p className="mt-0.5 text-sm text-muted-foreground">{project.role}</p>}
      {project.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{project.description}</p>}
      {project.link && (
        <a href={project.link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          View project →
        </a>
      )}
      <TagRow tags={project.tags} />
    </div>
  );
}

export default async function PortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const portfolio = await getPortfolio(slug);
  if (!portfolio) return notFound();

  const allProjects = Array.isArray(portfolio.projects) ? portfolio.projects : [];
  // Grouped by shape, not just listed in order: image/video projects are
  // naturally uniform-height (fixed aspect-video media), so a 2-column
  // grid reads clean. Text-only projects vary a lot in length, so they
  // stay a single stacked column - mixing both kinds in one grid is what
  // produces the uneven, "disorganized" look a side-by-side grid gets
  // when one card is a paragraph and its neighbor is a single line.
  const visualProjects = allProjects.filter((p) => p.coverImageUrl || p.videoUrl);
  const textProjects = allProjects.filter((p) => !p.coverImageUrl && !p.videoUrl);

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex flex-wrap items-center gap-5">
          {portfolio.photo_url && (
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border border-border">
              <Image src={portfolio.photo_url} alt={portfolio.full_name} fill sizes="96px" className="object-cover" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{portfolio.full_name}</h1>
            {portfolio.headline && <p className="mt-1 text-lg text-primary">{portfolio.headline}</p>}
          </div>
        </div>

        {portfolio.bio && (
          <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">{portfolio.bio}</p>
        )}

        {visualProjects.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Visual &amp; video work</h2>
            <div className="mt-4 grid items-start gap-5 sm:grid-cols-2">
              {visualProjects.map((p, i) => <VisualProjectCard key={i} project={p} />)}
            </div>
          </div>
        )}

        {textProjects.length > 0 && (
          <div className="mt-12 max-w-3xl">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Writing &amp; other work</h2>
            <div className="mt-4 space-y-5">
              {textProjects.map((p, i) => <TextProjectCard key={i} project={p} />)}
            </div>
          </div>
        )}

        <p className="mt-16 text-center text-xs text-muted-foreground">
          Built with Prowess Digital Solutions&rsquo; Portfolio Builder.
        </p>
      </div>
    </div>
  );
}
