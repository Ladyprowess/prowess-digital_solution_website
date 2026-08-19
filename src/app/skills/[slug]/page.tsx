import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { getSkillGraph } from "@/lib/careerPathGraph";
import { getYoutubeThumbnail } from "@/lib/youtube";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SkillDetail = { id: string; slug: string; name: string };

async function getSkill(slug: string) {
  const { data } = await supabase.from("skills").select("id, slug, name").eq("slug", slug).maybeSingle();
  return data as SkillDetail | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const skill = await getSkill(slug);
  if (!skill) return { title: "Skill not found" };
  return {
    title: `${skill.name} | Prowess Digital Solutions`,
    description: `Career paths, jobs, internships, courses, videos, resources, events and opportunities connected to ${skill.name}.`,
  };
}

function RelatedSection({
  title,
  items,
  render,
}: {
  title: string;
  items: unknown[];
  render: () => React.ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{render()}</div>
    </section>
  );
}

export default async function SkillDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await getSkill(slug);
  if (!skill) return notFound();

  const graph = await getSkillGraph([skill.id], { limit: 12 });
  const totalConnections =
    graph.careerPaths.length + graph.jobs.length + graph.internships.length + graph.courses.length +
    graph.videos.length + graph.resources.length + graph.events.length + graph.opportunities.length;

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <Reveal>
          <Link href="/skills" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80">
            ← All skills
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">{skill.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Everything on Prowess Digital Solutions connected to {skill.name}.</p>
        </Reveal>

        <Reveal delay={80}>
          <RelatedSection title="CAREER PATHS" items={graph.careerPaths} render={() => graph.careerPaths.map((c) => (
            <Link key={c.slug} href={`/career-paths/${c.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{c.access}</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{c.title}</p>
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={110}>
          <RelatedSection title="JOBS" items={graph.jobs} render={() => graph.jobs.map((j) => (
            <Link key={j.slug} href={`/jobs/${j.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <p className="text-sm font-semibold text-foreground">{j.title}</p>
              {j.companies?.name && <p className="mt-0.5 text-xs text-muted-foreground">{j.companies.name}</p>}
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={140}>
          <RelatedSection title="INTERNSHIPS" items={graph.internships} render={() => graph.internships.map((o) => (
            <Link key={o.slug} href={`/opportunities/${o.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <p className="text-sm font-semibold text-foreground">{o.title}</p>
              {o.organisation_name && <p className="mt-0.5 text-xs text-muted-foreground">{o.organisation_name}</p>}
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={170}>
          <RelatedSection title="COURSES" items={graph.courses} render={() => graph.courses.map((c) => (
            <Link key={c.slug} href={`/learn/${c.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{c.access}</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{c.title}</p>
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={200}>
          <RelatedSection title="VIDEOS" items={graph.videos} render={() => graph.videos.map((v) => {
            const thumb = v.thumbnail_url || (v.source === "youtube" && v.external_url ? getYoutubeThumbnail(v.external_url) : null);
            return (
              <Link key={v.slug} href={`/resources/${v.slug}`} className="overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/30">
                <div className="relative aspect-video w-full bg-muted">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external video-host thumbnail, not a local/optimizable asset
                    <img src={thumb} alt={v.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No thumbnail</div>
                  )}
                </div>
                <p className="p-3 text-sm font-semibold text-foreground">{v.title}</p>
              </Link>
            );
          })} />
        </Reveal>

        <Reveal delay={230}>
          <RelatedSection title="RESOURCES" items={graph.resources} render={() => graph.resources.map((r) => (
            <Link key={r.slug} href={`/resources/${r.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">{r.resource_type?.replace("_", " ") || "Resource"}</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{r.title}</p>
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={260}>
          <RelatedSection title="EVENTS" items={graph.events} render={() => graph.events.map((e) => (
            <Link key={e.slug} href={`/events/${e.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <p className="text-sm font-semibold text-foreground">{e.title}</p>
              {e.date && <p className="mt-0.5 text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>}
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={290}>
          <RelatedSection title="OPPORTUNITIES" items={graph.opportunities} render={() => graph.opportunities.map((o) => (
            <Link key={o.slug} href={`/opportunities/${o.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <p className="text-sm font-semibold text-foreground">{o.title}</p>
              {o.organisation_name && <p className="mt-0.5 text-xs text-muted-foreground">{o.organisation_name}</p>}
            </Link>
          ))} />
        </Reveal>

        {totalConnections === 0 && (
          <p className="mt-10 rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center text-sm text-muted-foreground">
            Nothing is tagged with {skill.name} yet - once a job, course, resource, career path, event or opportunity is tagged with it, it&rsquo;ll show up here automatically.
          </p>
        )}
      </div>
    </div>
  );
}
