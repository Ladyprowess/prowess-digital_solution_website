import { createClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, Calendar, FileText, Layers, Users } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { ResourceBody } from "@/components/ResourceBody";
import { ChecklistBody } from "@/components/resources/ChecklistBody";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RelatedSection } from "@/components/RelatedSection";
import { getSkillGraph } from "@/lib/careerPathGraph";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/formatMoney";
import { isFormatPriceableType } from "@/lib/resources/ebookFormats";

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
  price_usd: number | null;
  price_ngn: number | null;
  price_read_usd: number | null;
  price_read_ngn: number | null;
  price_download_usd: number | null;
  price_download_ngn: number | null;
  price_hardcopy_usd: number | null;
  price_hardcopy_ngn: number | null;
  source: string;
  reading_minutes: number | null;
  page_count: number | null;
  content_display: "text" | "pdf";
  allow_download: boolean;
  published_at: string | null;
  cover_url: string | null;
  cover_path: string | null;
  resource_skill_map: { skills: { id: string; name: string; slug: string } }[];
  resource_mockups: { url: string; position: number }[];
};

async function getResource(slug: string) {
  const { data } = await supabase
    .from("resources")
    .select(
      "id, slug, title, description, category, resource_type, level, audience, access, price_usd, price_ngn, price_read_usd, price_read_ngn, price_download_usd, price_download_ngn, price_hardcopy_usd, price_hardcopy_ngn, source, reading_minutes, page_count, content_display, allow_download, published_at, cover_url, cover_path, resource_skill_map(skills(id, name, slug)), resource_mockups(url, position)"
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

  // Same hard-override rule as checkout (see getItemPrice in content.ts):
  // once any format price is set, price_usd/price_ngn are dead for this
  // item - even if an admin's old plain price values are still sitting in
  // those columns from before this ebook switched to format pricing, the
  // "Premium" badge below must not show them as if they were real.
  const hasFormatPricing = isFormatPriceableType(resource.resource_type) && Boolean(
    resource.price_read_usd || resource.price_read_ngn ||
    resource.price_download_usd || resource.price_download_ngn ||
    resource.price_hardcopy_usd || resource.price_hardcopy_ngn
  );
  const formatPrices = isFormatPriceableType(resource.resource_type)
    ? {
        read: { usd: resource.price_read_usd, ngn: resource.price_read_ngn },
        download: { usd: resource.price_download_usd, ngn: resource.price_download_ngn },
        hardcopy: { usd: resource.price_hardcopy_usd, ngn: resource.price_hardcopy_ngn },
      }
    : null;

  const graph = await getSkillGraph(skillIds, { limit: 4 });

  const publishedLabel = resource.published_at
    ? new Date(resource.published_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  // A resource explicitly authored as a business guide, or tagged for a
  // business/both audience, gets a bridge into Prowess's actual business
  // services -- subtle, not on every resource.
  const showBusinessCta = resource.resource_type === "business_guide" || resource.audience !== "consumer";

  return (
    <div className="min-h-screen bg-background pb-16">
      <section className="border-b border-border bg-brand-bg">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <Reveal>
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Resources", href: "/resources" },
              ...(resource.category ? [{ label: resource.category, href: `/resources?category=${encodeURIComponent(resource.category)}` }] : []),
              { label: resource.title },
            ]}
          />

          <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary capitalize">{typeLabel}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${resource.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {resource.access === "premium"
                    ? `Premium${
                        !hasFormatPricing && (resource.price_usd || resource.price_ngn)
                          ? ` - ${[
                              resource.price_usd ? formatMoney(resource.price_usd, "USD") : null,
                              resource.price_ngn ? formatMoney(resource.price_ngn, "NGN") : null,
                            ].filter(Boolean).join(" / ")}`
                          : ""
                      }`
                    : "Free"}
                </span>
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl">{resource.title}</h1>
              {resource.description && (
                <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">{resource.description}</p>
              )}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a href="#resource-content" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  Open resource
                </a>
                <SaveButton itemType="resource" itemId={resource.id} className="flex-shrink-0" />
              </div>
            </div>

            <aside className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="aspect-[4/3] bg-muted">
                {resource.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resource.cover_url} alt={resource.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-background text-primary">
                    <FileText size={42} aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <p className="text-sm font-bold text-foreground">Resource overview</p>
                <div className="mt-4 space-y-3">
                  {[
                    resource.category ? { icon: Layers, label: "Category", value: resource.category } : null,
                    { icon: Users, label: "Audience", value: AUDIENCE_LABELS[resource.audience] },
                    resource.level ? { icon: BookOpen, label: "Level", value: resource.level } : null,
                    resource.resource_type === "article" && resource.reading_minutes ? { icon: BookOpen, label: "Reading time", value: `${resource.reading_minutes} min` } : null,
                    resource.resource_type === "ebook" && resource.page_count ? { icon: FileText, label: "Pages", value: String(resource.page_count) } : null,
                    publishedLabel ? { icon: Calendar, label: "Published", value: publishedLabel } : null,
                  ].filter(Boolean).map((item) => {
                    const Icon = item!.icon;
                    return (
                      <div key={item!.label} className="flex items-center gap-3 rounded-lg bg-muted p-3">
                        <Icon size={16} className="text-primary" aria-hidden="true" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item!.label}</p>
                          <p className="text-sm font-semibold capitalize text-foreground">{item!.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>

          {isFormatPriceableType(resource.resource_type) && resource.resource_mockups.length > 0 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {[...resource.resource_mockups]
                .sort((a, b) => a.position - b.position)
                .map((m, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={m.url} alt={`${resource.title} preview ${i + 1}`} className="h-40 w-28 flex-shrink-0 rounded-lg border border-border object-cover" />
                ))}
            </div>
          )}
        </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 pt-10">

        {skills.length > 0 && (
          <Reveal delay={100}>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Link key={s.slug} href={`/skills/${s.slug}`} className="inline-flex min-h-9 items-center rounded-full border border-primary/20 bg-primary/5 px-3 text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  {s.name}
                </Link>
              ))}
            </div>
          </Reveal>
        )}

        <Reveal delay={120}>
          <section id="resource-content" className="scroll-mt-28">
          {resource.resource_type === "checklist" ? (
            <ChecklistBody
              resourceId={resource.id}
              priceUsd={resource.price_usd}
              priceNgn={resource.price_ngn}
              allowDownload={resource.allow_download}
              formatPrices={formatPrices}
            />
          ) : (
            <ResourceBody
              resourceId={resource.id}
              title={resource.title}
              priceUsd={resource.price_usd}
              priceNgn={resource.price_ngn}
              contentDisplay={resource.content_display}
              allowDownload={resource.allow_download}
              formatPrices={formatPrices}
            />
          )}
          </section>
        </Reveal>

        {showBusinessCta && (
          <Reveal delay={140}>
            <div className="mt-10 rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
              <p className="text-base font-bold text-foreground">Need help implementing this?</p>
              <p className="mt-1 text-sm text-muted-foreground">Prowess Digital Solutions helps founders and business owners turn ideas like this into practical systems.</p>
              <Link href="/services" className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Explore business services</Link>
            </div>
          </Reveal>
        )}

        <Reveal delay={160}>
          <RelatedSection title="Courses that build on this" items={graph.courses} render={() => graph.courses.map((c) => (
            <Link key={c.slug} href={`/learn/${c.slug}`} className="rounded-lg border border-border bg-card p-4 transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>Course</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{c.title}</p>
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={200}>
          <RelatedSection title="Related career paths" items={graph.careerPaths} render={() => graph.careerPaths.map((c) => (
            <Link key={c.slug} href={`/career-paths/${c.slug}`} className="rounded-lg border border-border bg-card p-4 transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{c.access}</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{c.title}</p>
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={220}>
          <RelatedSection title="Jobs connected to this topic" items={graph.jobs} render={() => graph.jobs.map((j) => (
            <Link key={j.slug} href={`/jobs/${j.slug}`} className="rounded-lg border border-border bg-card p-4 transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <p className="text-sm font-semibold text-foreground">{j.title}</p>
              {j.companies?.name && <p className="mt-0.5 text-xs text-muted-foreground">{j.companies.name}</p>}
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={240}>
          <RelatedSection title="Opportunities connected to this topic" items={graph.opportunities} render={() => graph.opportunities.map((o) => (
            <Link key={o.slug} href={`/opportunities/${o.slug}`} className="rounded-lg border border-border bg-card p-4 transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <p className="text-sm font-semibold text-foreground">{o.title}</p>
              {o.organisation_name && <p className="mt-0.5 text-xs text-muted-foreground">{o.organisation_name}</p>}
            </Link>
          ))} />
        </Reveal>

        {resource.source !== "prowess" && (
          <p className="mt-10 text-center text-xs text-muted-foreground">
            This resource is hosted on {SOURCE_LABELS[resource.source] || "a third-party site"}. Rights belong to the original creator.
          </p>
        )}
      </div>
    </div>
  );
}
