import { createClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { ResourceBody } from "@/components/ResourceBody";
import { ChecklistBody } from "@/components/resources/ChecklistBody";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RelatedSection } from "@/components/RelatedSection";
import { getSkillGraph } from "@/lib/careerPathGraph";
import { supabaseAdmin } from "@/lib/supabase/admin";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const AUDIENCE_LABELS: Record<string, string> = { consumer: "Individuals", business: "Businesses", both: "Everyone" };
const SOURCE_LABELS: Record<string, string> = { prowess: "Prowess Digital Solutions", youtube: "YouTube", external: "External" };

type ResourceDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  resource_type: string | null;
  level: string | null;
  audience: "consumer" | "business" | "both";
  access: "free" | "premium";
  price: number | null;
  price_currency: string | null;
  source: string;
  reading_minutes: number | null;
  page_count: number | null;
  content_display: "text" | "pdf";
  allow_download: boolean;
  published_at: string | null;
  cover_url: string | null;
  cover_path: string | null;
  resource_skill_map: { skills: { id: string; name: string; slug: string } }[];
};

async function getResource(slug: string) {
  const { data } = await supabase
    .from("resources")
    .select(
      "id, slug, title, description, category, resource_type, level, audience, access, price, price_currency, source, reading_minutes, page_count, content_display, allow_download, published_at, cover_url, cover_path, resource_skill_map(skills(id, name, slug))"
    )
    // published check covers both the legacy is_published-driven rows and
    // the newer status field, kept in sync on every admin write
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  const resource = data as unknown as ResourceDetail | null;
  if (!resource) return null;

  // cover_url is always stored null on real rows - the actual image lives
  // at cover_path in Storage and has to be signed server-side, same as
  // /api/resources already does for the main resources listing.
  if (!resource.cover_url && resource.cover_path) {
    const { data: signed } = await supabaseAdmin().storage
      .from("resource-covers")
      .createSignedUrl(resource.cover_path, 60 * 60);
    resource.cover_url = signed?.signedUrl ?? null;
  }

  return resource;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResource(slug);
  if (!resource) return { title: "Resource not found" };
  return {
    title: resource.title,
    description: resource.description?.slice(0, 155) || `${resource.title} on Prowess Digital Solutions.`,
  };
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = await getResource(slug);
  if (!resource) return notFound();
  // Video gets its own dedicated player-first detail page -- this is a
  // safety net for any link that still points here (existing bookmarks,
  // pages not yet repointed) rather than serving the generic layout.
  if (resource.resource_type === "video") redirect(`/videos/${slug}`);

  const skills = resource.resource_skill_map?.map((m) => m.skills).filter(Boolean) || [];
  const skillIds = skills.map((s) => s.id);
  const typeLabel = (resource.resource_type || "Resource").toString().replace(/_/g, " ");

  const graph = await getSkillGraph(skillIds, { limit: 4 });

  const publishedLabel = resource.published_at
    ? new Date(resource.published_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  // A resource explicitly authored as a business guide, or tagged for a
  // business/both audience, gets a bridge into Prowess's actual business
  // services -- subtle, not on every resource.
  const showBusinessCta = resource.resource_type === "business_guide" || resource.audience !== "consumer";

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <Reveal>
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Resources", href: "/resources" },
              ...(resource.category ? [{ label: resource.category, href: `/resources?category=${encodeURIComponent(resource.category)}` }] : []),
              { label: resource.title },
            ]}
          />

          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-primary capitalize">{typeLabel}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${resource.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {resource.access === "premium" ? `Premium${resource.price ? ` - ${resource.price_currency || "USD"} ${resource.price}` : ""}` : "Free"}
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{resource.title}</h1>
            </div>
            <SaveButton itemType="resource" itemId={resource.id} className="flex-shrink-0" />
          </div>

          {resource.cover_url && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resource.cover_url} alt={resource.title} className="w-full object-cover" />
            </div>
          )}
        </Reveal>

        <Reveal delay={40}>
          <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-4">
            {resource.category && (
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p><p className="mt-1 text-sm font-semibold text-foreground">{resource.category}</p></div>
            )}
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Audience</p><p className="mt-1 text-sm font-semibold text-foreground">{AUDIENCE_LABELS[resource.audience]}</p></div>
            {resource.level && (
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Level</p><p className="mt-1 text-sm font-semibold capitalize text-foreground">{resource.level}</p></div>
            )}
            {resource.resource_type === "article" && resource.reading_minutes && (
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Reading time</p><p className="mt-1 text-sm font-semibold text-foreground">{resource.reading_minutes} min</p></div>
            )}
            {resource.resource_type === "ebook" && resource.page_count && (
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Pages</p><p className="mt-1 text-sm font-semibold text-foreground">{resource.page_count}</p></div>
            )}
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Source</p><p className="mt-1 text-sm font-semibold text-foreground">{SOURCE_LABELS[resource.source] || resource.source}</p></div>
            {publishedLabel && (
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Published</p><p className="mt-1 text-sm font-semibold text-foreground">{publishedLabel}</p></div>
            )}
          </div>
        </Reveal>

        {resource.description && (
          <Reveal delay={80}>
            <p className="mt-6 leading-relaxed text-muted-foreground">{resource.description}</p>
          </Reveal>
        )}

        {skills.length > 0 && (
          <Reveal delay={100}>
            <div className="mt-6 flex flex-wrap gap-2">
              {skills.map((s) => (
                <Link key={s.slug} href={`/skills/${s.slug}`} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
                  {s.name}
                </Link>
              ))}
            </div>
          </Reveal>
        )}

        <Reveal delay={120}>
          {resource.resource_type === "checklist" ? (
            <ChecklistBody resourceId={resource.id} price={resource.price} currency={resource.price_currency} allowDownload={resource.allow_download} />
          ) : (
            <ResourceBody resourceId={resource.id} title={resource.title} price={resource.price} currency={resource.price_currency} contentDisplay={resource.content_display} allowDownload={resource.allow_download} />
          )}
        </Reveal>

        {showBusinessCta && (
          <Reveal delay={140}>
            <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
              <p className="text-base font-bold text-foreground">Need help implementing this?</p>
              <p className="mt-1 text-sm text-muted-foreground">Prowess Digital Solutions works directly with founders and business owners on exactly this kind of work.</p>
              <Link href="/services" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Explore our business services →</Link>
            </div>
          </Reveal>
        )}

        <Reveal delay={160}>
          <RelatedSection title="RELATED LEARNING" items={[...graph.courses, ...graph.resources]} render={() => (
            <>
              {graph.courses.map((c) => (
                <Link key={c.slug} href={`/learn/${c.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>Course</span>
                  <p className="mt-1.5 text-sm font-semibold text-foreground">{c.title}</p>
                </Link>
              ))}
              {graph.resources.map((r) => (
                <Link key={r.slug} href={`/resources/${r.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">{r.resource_type?.replace("_", " ") || "Resource"}</span>
                  <p className="mt-1.5 text-sm font-semibold text-foreground">{r.title}</p>
                </Link>
              ))}
            </>
          )} />
        </Reveal>

        <Reveal delay={200}>
          <RelatedSection title="WHERE CAN THIS TAKE YOU?" items={graph.careerPaths} render={() => graph.careerPaths.map((c) => (
            <Link key={c.slug} href={`/career-paths/${c.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{c.access}</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{c.title}</p>
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={220}>
          <RelatedSection title="RELEVANT JOBS" items={graph.jobs} render={() => graph.jobs.map((j) => (
            <Link key={j.slug} href={`/jobs/${j.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <p className="text-sm font-semibold text-foreground">{j.title}</p>
              {j.companies?.name && <p className="mt-0.5 text-xs text-muted-foreground">{j.companies.name}</p>}
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={240}>
          <RelatedSection title="RELEVANT OPPORTUNITIES" items={graph.opportunities} render={() => graph.opportunities.map((o) => (
            <Link key={o.slug} href={`/opportunities/${o.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <p className="text-sm font-semibold text-foreground">{o.title}</p>
              {o.organisation_name && <p className="mt-0.5 text-xs text-muted-foreground">{o.organisation_name}</p>}
            </Link>
          ))} />
        </Reveal>

        {resource.source !== "prowess" && (
          <p className="mt-10 text-center text-xs text-muted-foreground">
            This resource is hosted on {SOURCE_LABELS[resource.source] || "a third-party site"} and shared here for its educational value - all rights belong to the original creator.
          </p>
        )}
      </div>
    </div>
  );
}
