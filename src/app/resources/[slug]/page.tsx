import { createClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, Calendar, CheckCircle2, Clock, Download, Eye, FileText, Headphones, Layers, Package, Users } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { ResourceBody } from "@/components/ResourceBody";
import { ChecklistBody } from "@/components/resources/ChecklistBody";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RelatedSection } from "@/components/RelatedSection";
import ResourceCard, { type ResourceItem } from "@/components/resources/ResourceCard";
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
const TYPE_COPY: Record<string, { verb: string; noun: string }> = {
  ebook: { verb: "Read", noun: "ebook" },
  guide: { verb: "Use", noun: "guide" },
  template: { verb: "Apply", noun: "template" },
  checklist: { verb: "Follow", noun: "checklist" },
  article: { verb: "Read", noun: "article" },
  business_guide: { verb: "Use", noun: "business guide" },
  podcast: { verb: "Listen", noun: "audio resource" },
};

function defaultSalesCopy(resource: {
  resource_type: string | null;
  category: string | null;
  audience: "consumer" | "business" | "both";
}) {
  const topic = resource.category || "this topic";
  const audience =
    resource.audience === "business"
      ? "founders, business owners and small teams"
      : resource.audience === "consumer"
        ? "people building their skills or next career move"
        : "people and teams who need practical direction";

  if (resource.resource_type === "template") {
    return {
      get: [`A ready structure for ${topic}.`, "Prompts you can adapt to your own work.", "A cleaner starting point than building from scratch."],
      for: [`${audience}.`, "Anyone who wants a useful format they can reuse.", "Anyone who needs to move faster without losing quality."],
      outcomes: ["Organise your ideas faster.", "Present your work more clearly.", "Turn the template into something practical for your own situation."],
    };
  }

  if (resource.resource_type === "checklist") {
    return {
      get: [`A focused checklist for ${topic}.`, "Clear steps to review before you take action.", "A simple way to track what still needs attention."],
      for: [`${audience}.`, "Anyone who wants fewer loose ends.", "Anyone preparing to apply, launch, publish or improve something important."],
      outcomes: ["Know what to check first.", "Avoid missing important details.", "Move forward with a clearer next step."],
    };
  }

  return {
    get: [`A practical guide on ${topic}.`, "Explanations written for real use, not theory alone.", "Examples and prompts to help you apply the ideas."],
    for: [`${audience}.`, "Anyone who wants better structure before making decisions.", "Anyone who wants something they can read, apply and return to."],
    outcomes: ["Understand the topic more clearly.", "Apply the ideas to your work, business or career.", "Make your next action more organised and confident."],
  };
}

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
  what_you_get: string | null;
  who_is_this_for: string | null;
  key_outcomes: string | null;
  preview_note: string | null;
  table_of_contents?: string | null;
  content_display: "text" | "pdf";
  allow_download: boolean;
  published_at: string | null;
  cover_url: string | null;
  cover_path: string | null;
  resource_skill_map: { skills: { id: string; name: string; slug: string } }[];
  resource_mockups: { url: string; position: number }[];
};

const RESOURCE_COLUMNS =
  "id, slug, title, description, category, resource_type, level, audience, access, price_usd, price_ngn, price_read_usd, price_read_ngn, price_download_usd, price_download_ngn, price_hardcopy_usd, price_hardcopy_ngn, source, reading_minutes, page_count, what_you_get, who_is_this_for, key_outcomes, preview_note, content_display, allow_download, published_at, cover_url, cover_path, resource_skill_map(skills(id, name, slug)), resource_mockups(url, position)";

// Columns added by a migration that may not have been applied yet. Postgres
// rejects the whole select when one is missing, which would turn every
// resource page into a 404 in the window between deploying the code and
// running the SQL - so they are asked for separately and simply come back
// empty until the migration lands.
const OPTIONAL_RESOURCE_COLUMNS = "table_of_contents";

async function getResource(slug: string) {
  // published check covers both the legacy is_published-driven rows and
  // the newer status field, kept in sync on every admin write
  const fetchWith = (columns: string) =>
    supabase.from("resources").select(columns).eq("slug", slug).eq("status", "published").maybeSingle();

  const first = await fetchWith(`${RESOURCE_COLUMNS}, ${OPTIONAL_RESOURCE_COLUMNS}`);
  let data = first.data;
  const error = first.error;
  if (error) {
    console.warn(`[resources] Falling back without optional columns: ${error.message}`);
    ({ data } = await fetchWith(RESOURCE_COLUMNS));
  }

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

// The old "supporting resources" list came only from the skill graph, so a
// resource tagged with no skills (or skills nothing else shares) ended the
// page with nothing after it. This widens the net in order - same category,
// then shared skills, then simply the most recent - so there is always
// somewhere to go next, which is the whole point of the section.
async function getMoreResources(resourceId: string, category: string | null, skillIds: string[]) {
  const admin = supabaseAdmin();
  const base = () =>
    admin
      .from("resources")
      .select("*")
      .eq("status", "published")
      .eq("show_in_library", true)
      .neq("id", resourceId)
      // Video has its own /videos page and its own card, so it never
      // belongs in this grid. Written as an `or` because `neq` alone drops
      // rows whose resource_type is null - older uploads, mostly.
      .or("resource_type.is.null,resource_type.neq.video");

  const [byCategory, bySkill] = await Promise.all([
    category ? base().eq("category", category).limit(6) : Promise.resolve({ data: [] }),
    skillIds.length > 0
      ? admin.from("resource_skill_map").select("resource_id").in("skill_id", skillIds)
      : Promise.resolve({ data: [] }),
  ]);

  const skillMatchIds = Array.from(new Set((bySkill.data || []).map((r) => r.resource_id))).filter((id) => id !== resourceId);
  const bySkillRows = skillMatchIds.length > 0 ? await base().in("id", skillMatchIds).limit(6) : { data: [] };

  // Dedupe before deciding whether the list is thin. The category and skill
  // queries routinely return the same rows, so counting the raw merge made
  // two results look like four and skipped the recency top-up that was
  // supposed to fill the gap.
  const dedupe = (rows: unknown[]) =>
    Array.from(new Map((rows as { id: string }[]).map((r) => [r.id, r])).values()) as unknown as ResourceItem[];

  let pool = dedupe([...(byCategory.data || []), ...(bySkillRows.data || [])]);
  if (pool.length < 3) {
    const recent = await base().order("published_at", { ascending: false, nullsFirst: false }).limit(6);
    pool = dedupe([...pool, ...(recent.data || [])]);
  }

  // Relevance alone quietly buried everything paid. With most of the
  // library free, a free resource's category and recency matches filled all
  // six slots with other free resources, so the pages people actually land
  // on never pointed at anything they could buy - while a paid resource's
  // page, having no same-category siblings, fell through to the mixed
  // recency list and showed free ones. Up to two slots are now held for
  // paid resources, fetched separately when the relevant ones are all free.
  let premium = pool.filter((item) => item.access === "premium");
  if (premium.length === 0) {
    const paid = await base().eq("access", "premium").order("published_at", { ascending: false, nullsFirst: false }).limit(2);
    premium = (paid.data || []) as unknown as ResourceItem[];
  }

  const LIMIT = 6;
  const premiumQuota = Math.min(2, premium.length);
  const free = pool.filter((item) => item.access !== "premium");

  const keep = new Set<string>([
    ...free.slice(0, LIMIT - premiumQuota).map((item) => item.id),
    ...premium.slice(0, premiumQuota).map((item) => item.id),
  ]);
  // Top up from the relevance pool if either side came up short.
  for (const item of pool) {
    if (keep.size >= LIMIT) break;
    keep.add(item.id);
  }

  // Filtering the combined list back through `keep` restores relevance
  // order - the quota decides who is in, not what position they sit in.
  const chosen = [...pool, ...premium.filter((item) => !pool.some((p) => p.id === item.id))]
    .filter((item) => keep.has(item.id))
    .slice(0, LIMIT);

  // Covers live in a private bucket, so cover_url is null on the row and
  // has to be signed here - same as /api/resources does for the listing.
  return Promise.all(
    chosen.map(async (item) => {
      if (!item.cover_path) return item;
      const { data: signed } = await admin.storage.from("resource-covers").createSignedUrl(item.cover_path, 60 * 60);
      return signed?.signedUrl ? { ...item, cover_url: signed.signedUrl } : item;
    })
  );
}

// Same shape ResourceBody parses for the in-reader panel, duplicated here
// rather than imported so the server page doesn't pull a client module in
// just for ten lines of string handling.
function parseContentsLines(value: string | null | undefined) {
  return (value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const withPage = line.match(/^(.*?)\s*\|\s*(\d+)\s*$/);
      return withPage ? { label: withPage[1].trim(), page: Number(withPage[2]) } : { label: line, page: null };
    })
    .filter((entry) => entry.label.length > 0);
}

function linesFrom(value: string | null) {
  return (value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function priceLabel(usd: number | null, ngn: number | null) {
  return [usd ? formatMoney(usd, "USD") : null, ngn ? formatMoney(ngn, "NGN") : null].filter(Boolean).join(" / ");
}

const SITE_URL = "https://prowessdigitalsolutions.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResource(slug);
  if (!resource) return { title: "Resource not found" };

  const description = resource.description?.slice(0, 155) || `${resource.title} on Prowess Digital Solutions.`;
  const url = `${SITE_URL}/resources/${resource.slug}`;

  // Only title and description used to be set here. Next inherits every
  // field a page does not declare, so the whole openGraph block fell
  // through from the root layout - meaning a shared resource link showed
  // the site's generic name, tagline and default image rather than the
  // resource's own. The image points at /api/resources/[id]/cover, which is
  // stable and public; the signed cover_url this page renders on screen
  // expires within the hour and is useless to a crawler that re-fetches
  // days later. That route falls back to the site image on its own, so a
  // resource with no cover still shares with a picture.
  const image = `${SITE_URL}/api/resources/${resource.id}/cover`;

  return {
    title: resource.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: resource.title,
      description,
      url,
      type: "article",
      siteName: "Prowess Digital Solutions",
      images: [{ url: image, alt: resource.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: resource.title,
      description,
      images: [image],
    },
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
  const isPremium = resource.access === "premium";

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

  const [graph, moreResources] = await Promise.all([
    getSkillGraph(skillIds, { limit: 4 }),
    getMoreResources(resource.id, resource.category, skillIds),
  ]);

  const publishedLabel = resource.published_at
    ? new Date(resource.published_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;
  const resourceKind = TYPE_COPY[resource.resource_type || ""] || { verb: "Open", noun: "resource" };

  // One byline-style strip under the title instead of the old stack of
  // metadata cards plus a second copy of the same fields in the sidebar --
  // every fact about this resource is stated exactly once, in one row.
  const metaItems = [
    resource.page_count ? { icon: FileText, value: `${resource.page_count} pages` } : null,
    resource.reading_minutes ? { icon: Clock, value: `${resource.reading_minutes} min read` } : null,
    resource.level ? { icon: BookOpen, value: resource.level } : null,
    resource.category ? { icon: Layers, value: resource.category } : null,
    { icon: Users, value: `For ${AUDIENCE_LABELS[resource.audience].toLowerCase()}` },
    resource.content_display === "pdf" ? { icon: Headphones, value: "Read or listen" } : null,
    publishedLabel ? { icon: Calendar, value: publishedLabel } : null,
  ].filter(Boolean);

  // Format rows double as the sidebar buy box on a premium ebook: the
  // price sits next to the format it belongs to, rather than in a separate
  // "available formats" panel that never showed what anything costs.
  const formatOptions = formatPrices
    ? [
        { icon: Eye, title: "Read online", text: "Opens inside your account.", usd: formatPrices.read.usd, ngn: formatPrices.read.ngn },
        { icon: Download, title: "Download PDF", text: "Keep a copy on your device.", usd: formatPrices.download.usd, ngn: formatPrices.download.ngn },
        { icon: Package, title: "Hard copy", text: "Printed copy, delivered to you.", usd: formatPrices.hardcopy.usd, ngn: formatPrices.hardcopy.ngn },
      ].filter((option) => option.usd || option.ngn)
    : [];
  const fromUsd = formatOptions.map((o) => o.usd).filter((v): v is number => Boolean(v)).sort((a, b) => a - b)[0] ?? null;
  const fromNgn = formatOptions.map((o) => o.ngn).filter((v): v is number => Boolean(v)).sort((a, b) => a - b)[0] ?? null;
  const headlinePrice = hasFormatPricing
    ? priceLabel(fromUsd, fromNgn)
    : priceLabel(resource.price_usd, resource.price_ngn);

  const whatYouGet = linesFrom(resource.what_you_get);
  const whoIsThisFor = linesFrom(resource.who_is_this_for);
  const keyOutcomes = linesFrom(resource.key_outcomes);
  const hasAuthoredSalesCopy = whatYouGet.length > 0 || whoIsThisFor.length > 0 || keyOutcomes.length > 0;
  const fallbackSalesCopy = defaultSalesCopy(resource);
  const sellingSections = [
    { title: "What you get", items: whatYouGet.length > 0 ? whatYouGet : fallbackSalesCopy.get },
    { title: "Who it helps", items: whoIsThisFor.length > 0 ? whoIsThisFor : fallbackSalesCopy.for },
    { title: "What changes after", items: keyOutcomes.length > 0 ? keyOutcomes : fallbackSalesCopy.outcomes },
  ];
  // On a premium resource the visitor has to decide before they can see
  // anything, so the pitch has to be there even when an admin wrote none
  // and the generated fallback is all we have. On a free resource the
  // actual content is sitting right below the fold - generated filler in
  // front of it just pushes it down, so it only appears when a human
  // actually wrote something specific.
  const showSellingSections = isPremium || hasAuthoredSalesCopy;

  // A resource explicitly authored as a business guide, or tagged for a
  // business/both audience, gets a bridge into Prowess Digital Solutions's
  // actual business services -- subtle, not on every resource.
  const showBusinessCta = resource.resource_type === "business_guide" || resource.audience !== "consumer";

  const sellingBlock = showSellingSections ? (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        {isPremium ? `Inside this ${resourceKind.noun}` : "About this resource"}
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {sellingSections.map((section) => (
          <div key={section.title} className="rounded-lg bg-muted p-5">
            <p className="text-sm font-bold text-foreground">{section.title}</p>
            <ul className="mt-3 space-y-2.5">
              {section.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
                  <CheckCircle2 size={15} className="mt-1 flex-shrink-0 text-primary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  // An admin who wrote a preview note but uploaded no mockup images still
  // gets their note shown - it used to be dropped unless images existed.
  // Rendered by the page, not by ResourceBody: a paid resource's body
  // short-circuits to the paywall, so a contents list living in there was
  // hidden behind the very purchase it exists to justify. Out here it shows
  // whether or not somebody has bought yet.
  const contentsEntries = parseContentsLines(resource.table_of_contents);
  const contentsBlock = contentsEntries.length > 0 ? (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Contents</h2>
      <p className="mt-2 text-sm text-muted-foreground">What this {resourceKind.noun} covers, in order.</p>
      <ol className="mt-5 divide-y divide-border">
        {contentsEntries.map((entry, index) => (
          <li key={`${entry.label}-${index}`} className="flex items-baseline justify-between gap-4 py-3">
            <span className="flex gap-3 text-sm leading-6 text-foreground">
              <span className="w-5 flex-shrink-0 text-xs font-bold text-primary">{String(index + 1).padStart(2, "0")}</span>
              {entry.label}
            </span>
            {entry.page !== null && <span className="flex-shrink-0 text-xs font-semibold text-muted-foreground">p. {entry.page}</span>}
          </li>
        ))}
      </ol>
    </section>
  ) : null;

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
          </Reveal>

          <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <Reveal>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary capitalize">{typeLabel}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${isPremium ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {isPremium ? [hasFormatPricing && headlinePrice ? "From" : null, headlinePrice || "Premium"].filter(Boolean).join(" ") : "Free"}
                  </span>
                </div>
                <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl">{resource.title}</h1>
                {resource.description && (
                  <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{resource.description}</p>
                )}
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {metaItems.map((item, index) => {
                    const Icon = item!.icon;
                    return (
                      // Index key: two facts can legitimately read the same
                      // ("Beginner" as both a level and a category name).
                      <span key={`${item!.value}-${index}`} className="flex items-center gap-1.5 text-sm font-medium capitalize text-muted-foreground">
                        <Icon size={15} className="text-primary" aria-hidden="true" />
                        {item!.value}
                      </span>
                    );
                  })}
                </div>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a href="#resource-content" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    {isPremium ? "Get access" : `${resourceKind.verb} ${resourceKind.noun}`}
                  </a>
                  <SaveButton itemType="resource" itemId={resource.id} className="flex-shrink-0" />
                </div>
              </div>
            </Reveal>

            <Reveal delay={80}>
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
                {/* The sidebar only earns a second half when there is a
                    decision to make in it. On a free resource the cover is
                    the whole card - repeating the metadata here is what
                    left a column of dead space beside a short hero. */}
                {isPremium && (
                  <div className="border-t border-border p-5">
                    <p className="text-sm font-bold text-foreground">Choose how you want it</p>
                    <div className="mt-4 space-y-3">
                      {formatOptions.length > 0 ? (
                        formatOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <div key={option.title} className="flex items-start gap-3">
                              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Icon size={16} aria-hidden="true" />
                              </span>
                              {/* Formats only. The prices sit in the picker
                                  that actually takes the payment, so they
                                  are stated once, at the point of choosing,
                                  rather than twice on the same screen. */}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-foreground">{option.title}</p>
                                <p className="text-xs leading-5 text-muted-foreground">{option.text}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm leading-6 text-muted-foreground">One payment, then it stays in your account.</p>
                      )}
                    </div>
                    <a href="#resource-content" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      {formatOptions.length > 0 ? "Choose a format" : "Get access"}
                    </a>
                  </div>
                )}
              </aside>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-8 px-4 pt-10">
        {/* Premium: the visitor cannot see the resource itself yet, so the
            pitch and the preview run ahead of the paywall. Free: the
            resource is the first thing on the page and the supporting
            detail follows it. */}
        {isPremium && (
          <>
            {sellingBlock && <Reveal delay={100}>{sellingBlock}</Reveal>}
            {contentsBlock && <Reveal delay={120}>{contentsBlock}</Reveal>}
          </>
        )}

        {!isPremium && contentsBlock && <Reveal delay={110}>{contentsBlock}</Reveal>}

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
                tableOfContents={resource.table_of_contents ?? null}
                allowDownload={resource.allow_download}
                formatPrices={formatPrices}
              />
            )}
          </section>
        </Reveal>

        {!isPremium && (
          <>
            {sellingBlock && <Reveal delay={140}>{sellingBlock}</Reveal>}
          </>
        )}

        {skills.length > 0 && (
          <Reveal delay={160}>
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Topics</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Link key={s.slug} href={`/skills/${s.slug}`} className="inline-flex min-h-9 items-center rounded-full border border-primary/20 bg-primary/5 px-3 text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        )}

        {moreResources.length > 0 && (
          <Reveal delay={180}>
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">More resources</h2>
              <p className="mt-2 text-sm text-muted-foreground">Other things worth opening next.</p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {moreResources.map((item) => (
                  <ResourceCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          </Reveal>
        )}

        <Reveal delay={190}>
          <RelatedSection title="Keep learning" items={graph.courses} render={() => graph.courses.map((c) => (
            <Link key={c.slug} href={`/learn/${c.slug}`} className="rounded-lg border border-border bg-card p-4 transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>Course</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{c.title}</p>
            </Link>
          ))} />
        </Reveal>

        {/* Last, not first. Somebody who just finished reading wants
            somewhere to go next before they want to be sold to. */}
        {showBusinessCta && (
          <Reveal delay={200}>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
              <p className="text-base font-bold text-foreground">Need help implementing this?</p>
              <p className="mt-1 text-sm text-muted-foreground">Prowess Digital Solutions helps founders and business owners turn ideas like this into practical systems.</p>
              <Link href="/services" className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Explore business services</Link>
            </div>
          </Reveal>
        )}

        {resource.source !== "prowess" && (
          <p className="text-center text-xs text-muted-foreground">
            This resource is hosted on {SOURCE_LABELS[resource.source] || "a third-party site"}. Rights belong to the original creator.
          </p>
        )}
      </div>
    </div>
  );
}
