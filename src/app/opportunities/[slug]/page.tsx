import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { RichText } from "@/components/RichText";
import { RelatedSection } from "@/components/RelatedSection";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ApplyButton } from "@/components/opportunities/ApplyButton";
import { stripHtmlForMeta } from "@/lib/stripHtml";
import { getSkillGraph } from "@/lib/careerPathGraph";
import { isClosingSoon } from "@/lib/closingSoon";
import { FUNDING_TYPES } from "@/lib/opportunities/constants";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type OpportunityDetail = {
  id: string;
  slug: string;
  title: string;
  organisation_name: string | null;
  organisation_logo_url: string | null;
  description: string | null;
  eligibility: string | null;
  eligibility_summary: string | null;
  eligible_locations: string[] | null;
  requirements: string | null;
  application_process: string | null;
  benefits: string | null;
  benefit_tags: string[] | null;
  funding_type: (typeof FUNDING_TYPES)[number]["value"] | null;
  funding_description: string | null;
  application_cost: "free" | "paid" | "not_specified";
  application_fee: number | null;
  application_fee_currency: string | null;
  apply_url: string;
  location_type: "remote" | "hybrid" | "on_site" | "any" | null;
  country: string | null;
  city: string | null;
  remote_regions: string[] | null;
  deadline_at: string | null;
  application_opens_at: string | null;
  program_start_at: string | null;
  program_end_at: string | null;
  status: "draft" | "published" | "closed" | "expired";
  expires_at: string | null;
  updated_at: string;
  type_id: string;
  opportunity_types: { slug: string; name: string } | null;
  opportunity_skill_map: { skills: { id: string; name: string; slug: string } }[];
  job_sources: { name: string; source_type: string } | null;
};

// No status/expires_at filter here - RLS restricts anon reads to
// published/closed/expired (never draft); the component below tells the
// difference so a closed/expired opportunity renders its own state instead
// of a 404.
async function getOpportunity(slug: string) {
  const { data } = await supabase
    .from("opportunities")
    .select(
      "id, slug, title, organisation_name, organisation_logo_url, description, eligibility, eligibility_summary, eligible_locations, requirements, application_process, benefits, benefit_tags, funding_type, funding_description, application_cost, application_fee, application_fee_currency, apply_url, location_type, country, city, remote_regions, deadline_at, application_opens_at, program_start_at, program_end_at, status, expires_at, updated_at, type_id, opportunity_types(slug, name), opportunity_skill_map(skills(id, name, slug)), job_sources(name, source_type)"
    )
    .eq("slug", slug)
    .maybeSingle();
  return data as unknown as OpportunityDetail | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const opp = await getOpportunity(slug);
  if (!opp) return { title: "Opportunity not found" };
  return {
    title: opp.title,
    description: (opp.description ? stripHtmlForMeta(opp.description) : "") || `${opp.title} - apply on Prowess Digital Solutions.`,
  };
}

function locationLabel(o: OpportunityDetail) {
  if (!o.location_type || o.location_type === "any") return "Global";
  if (o.location_type === "remote") return o.remote_regions?.length ? `Remote - ${o.remote_regions.join(", ")}` : "Remote";
  return [o.location_type === "hybrid" ? "Hybrid" : "On-site", o.city, o.country].filter(Boolean).join(" · ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function OpportunityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const opp = await getOpportunity(slug);
  if (!opp) return notFound();

  const nowIso = new Date().toISOString();
  const isClosed = opp.status === "closed" || opp.status === "expired" || (opp.status === "published" && Boolean(opp.expires_at) && opp.expires_at! < nowIso);

  if (isClosed) {
    return (
      <div className="min-h-screen bg-background py-24">
        <div className="mx-auto max-w-xl px-4 text-center">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Opportunities", href: "/opportunities" }, { label: opp.title }]} />
          <h1 className="mt-6 text-2xl font-bold text-foreground">{opp.title}</h1>
          <p className="mt-1 text-muted-foreground">{opp.organisation_name || "Prowess Digital Solutions"}</p>
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-border bg-card p-6">
            <p className="font-semibold text-foreground">Applications are closed.</p>
            <p className="mt-2 text-sm text-muted-foreground">This opportunity is no longer accepting applications.</p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {opp.opportunity_types && (
              <Link href={`/opportunities?type=${opp.opportunity_types.slug}`} className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
                Explore Similar Opportunities
              </Link>
            )}
            <Link href="/opportunities" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Find Current Opportunities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const skills = opp.opportunity_skill_map?.map((m) => m.skills).filter(Boolean) || [];
  const skillIds = skills.map((s) => s.id);
  const graph = await getSkillGraph(skillIds, { limit: 4 });

  let related: { slug: string; title: string; organisation_name: string | null }[] = [];
  const { data: sameType } = await supabase
    .from("opportunities")
    .select("slug, title, organisation_name")
    .eq("type_id", opp.type_id)
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
    .neq("id", opp.id)
    .limit(3);
  related = sameType || [];

  const isUpcoming = Boolean(opp.application_opens_at) && opp.application_opens_at! > nowIso;
  const closingSoon = isClosingSoon(opp.deadline_at);
  const statusLabel = isUpcoming ? "Upcoming" : closingSoon ? "Closing Soon" : "Open";
  const statusClass = isUpcoming
    ? "bg-blue-50 text-blue-700"
    : closingSoon
    ? "bg-amber-50 text-amber-700"
    : "bg-green-50 text-green-700";

  const fundingLabel = opp.funding_type ? FUNDING_TYPES.find((f) => f.value === opp.funding_type)?.label : null;

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <Reveal>
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Opportunities", href: "/opportunities" },
              ...(opp.opportunity_types ? [{ label: opp.opportunity_types.name, href: `/opportunities?type=${opp.opportunity_types.slug}` }] : []),
              { label: opp.title },
            ]}
          />

          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wide text-primary">{opp.opportunity_types?.name || "Opportunity"}</span>
              <h1 className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">{opp.title}</h1>
              {opp.organisation_name && <p className="mt-2 text-muted-foreground">{opp.organisation_name}</p>}
              <p className="mt-1 text-xs text-muted-foreground">Last updated: {formatDate(opp.updated_at)}</p>
            </div>
          </div>

          <div className="mt-4">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusClass}`}>{statusLabel}</span>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-border bg-card p-5 text-sm">
            <span className="text-foreground"><b>Where:</b> {locationLabel(opp)}</span>
            {opp.deadline_at && <span className="text-foreground"><b>Deadline:</b> {formatDate(opp.deadline_at)}</span>}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ApplyButton opportunityId={opp.id} opportunityTitle={opp.title} organisationName={opp.organisation_name} applyUrl={opp.apply_url} />
            <SaveButton itemType="opportunity" itemId={opp.id} />
          </div>
        </Reveal>

        {opp.description && (
          <Reveal delay={80}>
            <section className="mt-10">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">OVERVIEW</h2>
              <RichText html={opp.description} className="mt-3" />
            </section>
          </Reveal>
        )}

        {(fundingLabel || opp.funding_description || (opp.benefit_tags && opp.benefit_tags.length > 0) || opp.benefits) && (
          <Reveal delay={120}>
            <section className="mt-8 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">BENEFITS &amp; FUNDING</h2>
              {fundingLabel && <p className="mt-3 text-base font-bold text-foreground">{fundingLabel}</p>}
              {opp.benefit_tags && opp.benefit_tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {opp.benefit_tags.map((b) => (
                    <span key={b} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{b}</span>
                  ))}
                </div>
              )}
              {opp.funding_description && <RichText html={opp.funding_description} className="mt-4" />}
              {opp.benefits && <RichText html={opp.benefits} className="mt-4" />}
            </section>
          </Reveal>
        )}

        {opp.application_cost !== "not_specified" && (
          <Reveal delay={140}>
            <section className="mt-6 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">APPLICATION COST</h2>
              <p className="mt-3 text-base font-bold text-foreground">
                {opp.application_cost === "free"
                  ? "Free to apply"
                  : `Application fee${opp.application_fee ? `: ${opp.application_fee_currency || ""} ${opp.application_fee.toLocaleString()}`.trim() : ""}`}
              </p>
            </section>
          </Reveal>
        )}

        {(opp.eligibility || (opp.eligible_locations && opp.eligible_locations.length > 0)) && (
          <Reveal delay={160}>
            <section className="mt-8">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">WHO CAN APPLY</h2>
              {opp.eligible_locations && opp.eligible_locations.length > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">Eligible locations: {opp.eligible_locations.join(", ")}</p>
              )}
              {opp.eligibility && <RichText html={opp.eligibility} className="mt-3" />}
            </section>
          </Reveal>
        )}

        {opp.requirements && (
          <Reveal delay={200}>
            <section className="mt-8">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">REQUIREMENTS</h2>
              <RichText html={opp.requirements} className="mt-3" />
            </section>
          </Reveal>
        )}

        {opp.application_process && (
          <Reveal delay={220}>
            <section className="mt-8">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">HOW TO APPLY</h2>
              <RichText html={opp.application_process} className="mt-3" />
            </section>
          </Reveal>
        )}

        {(opp.application_opens_at || opp.deadline_at || opp.program_start_at || opp.program_end_at) && (
          <Reveal delay={240}>
            <section className="mt-8 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">IMPORTANT DATES</h2>
              <div className="mt-3 space-y-1.5 text-sm text-foreground">
                {opp.application_opens_at && <p><b>Application opens:</b> {formatDate(opp.application_opens_at)}</p>}
                {opp.deadline_at && <p><b>Application deadline:</b> {formatDate(opp.deadline_at)}</p>}
                {opp.program_start_at && <p><b>Program starts:</b> {formatDate(opp.program_start_at)}</p>}
                {opp.program_end_at && <p><b>Program ends:</b> {formatDate(opp.program_end_at)}</p>}
              </div>
            </section>
          </Reveal>
        )}

        {skills.length > 0 && (
          <Reveal delay={260}>
            <section className="mt-8">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">SKILLS</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Link key={s.slug} href={`/skills/${s.slug}`} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
                    {s.name}
                  </Link>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {graph.careerPaths.length > 0 && (
          <Reveal delay={280}>
            <section className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">INTERESTED IN THIS CAREER?</h2>
              {graph.careerPaths.slice(0, 1).map((c) => (
                <div key={c.slug} className="mt-2">
                  <p className="text-lg font-bold text-foreground">Explore {c.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Learn what skills you need, what to study, and where this career can take you.</p>
                  <Link href={`/career-paths/${c.slug}`} className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
                    Explore Career Path →
                  </Link>
                </div>
              ))}
            </section>
          </Reveal>
        )}

        <Reveal delay={300}>
          <RelatedSection title="LEARN THESE SKILLS" items={graph.courses} render={() => graph.courses.map((c) => (
            <Link key={c.slug} href={`/learn/${c.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{c.access}</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{c.title}</p>
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={320}>
          <RelatedSection title="RECOMMENDED RESOURCES" items={[...graph.resources, ...graph.videos]} render={() => [...graph.resources, ...graph.videos].map((r) => (
            <Link key={r.slug} href={r.resource_type === "video" ? `/videos/${r.slug}` : `/resources/${r.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">{r.resource_type?.replace("_", " ") || "Resource"}</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{r.title}</p>
            </Link>
          ))} />
        </Reveal>

        {related.length > 0 && (
          <Reveal delay={340}>
            <section className="mt-12">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">RELATED OPPORTUNITIES</h2>
              <div className="mt-4 grid gap-3">
                {related.map((r) => (
                  <Link key={r.slug} href={`/opportunities/${r.slug}`} className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition hover:border-primary/30">
                    <span>
                      <span className="block text-sm font-semibold text-foreground">{r.title}</span>
                      {r.organisation_name && <span className="block text-xs text-muted-foreground">{r.organisation_name}</span>}
                    </span>
                    <span className="text-sm font-semibold text-primary">View →</span>
                  </Link>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        <Reveal delay={360}>
          <RelatedSection title="RELATED JOBS" items={graph.jobs} render={() => graph.jobs.map((j) => (
            <Link key={j.slug} href={`/jobs/${j.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <p className="text-sm font-semibold text-foreground">{j.title}</p>
              {j.companies?.name && <p className="mt-0.5 text-xs text-muted-foreground">{j.companies.name}</p>}
            </Link>
          ))} />
        </Reveal>

        {opp.job_sources && opp.job_sources.source_type !== "manual" && (
          <p className="mt-10 text-xs text-muted-foreground">
            Source: {opp.job_sources.name} ·{" "}
            <a href={opp.apply_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              Visit Official Website
            </a>
          </p>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          Prowess Digital Solutions provides this opportunity for discovery purposes. Application decisions, eligibility requirements, deadlines and program terms are determined by the organisation offering the opportunity.
        </p>
      </div>
    </div>
  );
}
