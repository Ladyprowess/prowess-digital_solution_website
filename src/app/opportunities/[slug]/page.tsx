import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { RichText } from "@/components/RichText";
import { RelatedSection } from "@/components/RelatedSection";
import { stripHtmlForMeta } from "@/lib/stripHtml";
import { getSkillGraph } from "@/lib/careerPathGraph";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type OpportunityDetail = {
  id: string;
  slug: string;
  title: string;
  organisation_name: string | null;
  description: string | null;
  eligibility: string | null;
  benefits: string | null;
  apply_url: string;
  location_type: "remote" | "hybrid" | "on_site" | "any" | null;
  country: string | null;
  city: string | null;
  remote_regions: string[] | null;
  deadline_at: string | null;
  opportunity_types: { name: string } | null;
  opportunity_skill_map: { skills: { id: string; name: string; slug: string } }[];
};

async function getOpportunity(slug: string) {
  const { data } = await supabase
    .from("opportunities")
    .select("id, slug, title, organisation_name, description, eligibility, benefits, apply_url, location_type, country, city, remote_regions, deadline_at, opportunity_types(name), opportunity_skill_map(skills(id, name, slug))")
    .eq("slug", slug)
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
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
  if (!o.location_type || o.location_type === "any") return "Open to anywhere";
  if (o.location_type === "remote") return o.remote_regions?.length ? `Remote - ${o.remote_regions.join(", ")}` : "Remote";
  return [o.location_type === "hybrid" ? "Hybrid" : "On-site", o.city, o.country].filter(Boolean).join(" · ");
}

export default async function OpportunityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const opp = await getOpportunity(slug);
  if (!opp) return notFound();

  const skills = opp.opportunity_skill_map?.map((m) => m.skills).filter(Boolean) || [];
  const skillIds = skills.map((s) => s.id);
  const graph = await getSkillGraph(skillIds, { limit: 4 });

  const { data: typeRow } = await supabase.from("opportunities").select("type_id").eq("id", opp.id).single();
  let related: { slug: string; title: string; organisation_name: string | null }[] = [];
  if (typeRow?.type_id) {
    const { data } = await supabase
      .from("opportunities")
      .select("slug, title, organisation_name")
      .eq("type_id", typeRow.type_id)
      .eq("status", "published")
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      .neq("id", opp.id)
      .limit(3);
    related = data || [];
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <Reveal>
          <Link href="/opportunities" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80">
            ← All opportunities
          </Link>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wide text-primary">{opp.opportunity_types?.name || "Opportunity"}</span>
              <h1 className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">{opp.title}</h1>
              {opp.organisation_name && <p className="mt-2 text-muted-foreground">{opp.organisation_name}</p>}
            </div>
            <SaveButton itemType="opportunity" itemId={opp.id} className="flex-shrink-0" />
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-border bg-card p-5 text-sm">
            <span className="text-foreground"><b>Where:</b> {locationLabel(opp)}</span>
            {opp.deadline_at && <span className="text-foreground"><b>Deadline:</b> {new Date(opp.deadline_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>}
          </div>

          {skills.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s.slug} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">{s.name}</span>
              ))}
            </div>
          )}

          <a
            href={opp.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90"
          >
            Apply now →
          </a>
        </Reveal>

        {opp.eligibility && (
          <Reveal delay={80}>
            <section className="mt-10">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">WHO CAN APPLY</h2>
              <RichText html={opp.eligibility} className="mt-3" />
            </section>
          </Reveal>
        )}

        {opp.benefits && (
          <Reveal delay={120}>
            <section className="mt-8">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">BENEFITS</h2>
              <RichText html={opp.benefits} className="mt-3" />
            </section>
          </Reveal>
        )}

        {opp.description && (
          <Reveal delay={160}>
            <section className="mt-8">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">DESCRIPTION</h2>
              <RichText html={opp.description} className="mt-3" />
            </section>
          </Reveal>
        )}

        {related.length > 0 && (
          <Reveal delay={200}>
            <section className="mt-12">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">MORE LIKE THIS</h2>
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

        <Reveal delay={240}>
          <RelatedSection title="LEARN THESE SKILLS" items={graph.courses} render={() => graph.courses.map((c) => (
            <Link key={c.slug} href={`/learn/${c.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{c.access}</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{c.title}</p>
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={280}>
          <RelatedSection title="RECOMMENDED RESOURCES" items={graph.resources} render={() => graph.resources.map((r) => (
            <Link key={r.slug} href={`/resources/${r.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">{r.resource_type?.replace("_", " ") || "Resource"}</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{r.title}</p>
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={320}>
          <RelatedSection title="RELATED CAREER PATHS" items={graph.careerPaths} render={() => graph.careerPaths.map((p) => (
            <Link key={p.slug} href={`/career-paths/${p.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${p.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{p.access}</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{p.title}</p>
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={360}>
          <RelatedSection title="FIND RELEVANT JOBS" items={graph.jobs} render={() => graph.jobs.map((j) => (
            <Link key={j.slug} href={`/jobs/${j.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <p className="text-sm font-semibold text-foreground">{j.title}</p>
              {j.companies?.name && <p className="mt-0.5 text-xs text-muted-foreground">{j.companies.name}</p>}
            </Link>
          ))} />
        </Reveal>
      </div>
    </div>
  );
}
