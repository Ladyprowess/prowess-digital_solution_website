import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { CareerInterestButton } from "@/components/CareerInterestButton";
import { getSkillGraph } from "@/lib/careerPathGraph";
import { RichText } from "@/components/RichText";
import { RelatedSection } from "@/components/RelatedSection";
import { stripHtmlForMeta } from "@/lib/stripHtml";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type CareerPathDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  access: "free" | "premium";
  price: number | null;
  price_currency: string | null;
  career_path_skill_map: { skills: { id: string; name: string; slug: string } }[];
};

async function getCareerPath(slug: string) {
  const { data } = await supabase
    .from("career_paths")
    .select("id, slug, title, description, access, price, price_currency, career_path_skill_map(skills(id, name, slug))")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data as unknown as CareerPathDetail | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const path = await getCareerPath(slug);
  if (!path) return { title: "Career path not found" };
  return {
    title: `${path.title} Career Path`,
    description: (path.description ? stripHtmlForMeta(path.description) : "") || `Skills, courses, resources, jobs and opportunities for a career in ${path.title}.`,
  };
}

export default async function CareerPathDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const path = await getCareerPath(slug);
  if (!path) return notFound();

  const skills = path.career_path_skill_map?.map((m) => m.skills).filter(Boolean) || [];
  const skillIds = skills.map((s) => s.id);
  const graph = await getSkillGraph(skillIds, { limit: 4 });

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <Reveal>
          <Link href="/career-paths" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80">
            ← All career paths
          </Link>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${path.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {path.access === "premium" ? `Premium${path.price ? ` - ${path.price_currency || "NGN"} ${path.price}` : ""}` : "Free"}
              </span>
              <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{path.title}</h1>
            </div>
            <div className="flex flex-shrink-0 flex-col gap-2">
              <CareerInterestButton careerPathId={path.id} />
              <SaveButton itemType="career_path" itemId={path.id} />
            </div>
          </div>

          {path.description && <RichText html={path.description} className="mt-4" />}

          {skills.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Skills needed</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s.slug} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">{s.name}</span>
                ))}
              </div>
            </div>
          )}
        </Reveal>

        <Reveal delay={80}>
          <RelatedSection title="COURSES TO LEARN" items={graph.courses} render={() => graph.courses.map((c) => (
            <Link key={c.slug} href={`/learn/${c.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{c.access}</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{c.title}</p>
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={120}>
          <RelatedSection title="RECOMMENDED RESOURCES" items={graph.resources} render={() => graph.resources.map((r) => (
            <Link key={r.slug} href={`/resources/${r.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">{r.resource_type?.replace("_", " ") || "Resource"}</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{r.title}</p>
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={160}>
          <RelatedSection title="RELATED OPPORTUNITIES" items={graph.opportunities} render={() => graph.opportunities.map((o) => (
            <Link key={o.slug} href={`/opportunities/${o.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <p className="text-sm font-semibold text-foreground">{o.title}</p>
              {o.organisation_name && <p className="mt-0.5 text-xs text-muted-foreground">{o.organisation_name}</p>}
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={200}>
          <RelatedSection title="FIND RELEVANT JOBS" items={graph.jobs} render={() => graph.jobs.map((j) => (
            <Link key={j.slug} href={`/jobs/${j.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <p className="text-sm font-semibold text-foreground">{j.title}</p>
              {j.companies?.name && <p className="mt-0.5 text-xs text-muted-foreground">{j.companies.name}</p>}
            </Link>
          ))} />
        </Reveal>

        {skillIds.length === 0 && (
          <p className="mt-10 rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center text-sm text-muted-foreground">
            This career path hasn&rsquo;t been tagged with skills yet, so there&rsquo;s nothing to connect it to yet - once it is, related courses, resources, opportunities and jobs will show up here automatically.
          </p>
        )}
      </div>
    </div>
  );
}
