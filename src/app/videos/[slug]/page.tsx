import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { VideoPlayer } from "@/components/videos/VideoPlayer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RichText } from "@/components/RichText";
import { RelatedSection } from "@/components/RelatedSection";
import { VideoCard, type VideoCardData } from "@/components/videos/VideoCard";
import { getSkillGraph } from "@/lib/careerPathGraph";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const AUDIENCE_LABELS: Record<string, string> = { consumer: "Individuals", business: "Businesses", both: "Everyone" };
const SOURCE_LABELS: Record<string, string> = { prowess: "Prowess Digital Solutions", youtube: "YouTube", external: "External" };

type VideoDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  audience: "consumer" | "business" | "both";
  source: string;
  external_url: string | null;
  access: "free" | "premium";
  price: number | null;
  price_currency: string | null;
  duration_minutes: number | null;
  why_recommended: string | null;
  published_at: string | null;
  resource_skill_map: { skills: { id: string; slug: string; name: string } }[];
};

async function getVideo(slug: string) {
  const { data } = await supabase
    .from("resources")
    .select(
      "id, slug, title, description, category, audience, source, external_url, access, price, price_currency, duration_minutes, why_recommended, published_at, resource_skill_map(skills(id, slug, name))"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .eq("resource_type", "video")
    .maybeSingle();
  return data as unknown as VideoDetail | null;
}

async function getMoreVideos(video: VideoDetail): Promise<VideoCardData[]> {
  const skillIds = video.resource_skill_map.map((m) => m.skills?.id).filter((id): id is string => Boolean(id));

  const [byCategory, bySkill] = await Promise.all([
    video.category
      ? supabase
          .from("resources")
          .select("id, slug, title, description, category, source, external_url, thumbnail_url, access")
          .eq("status", "published").eq("resource_type", "video").eq("show_in_library", true)
          .eq("category", video.category).neq("id", video.id).limit(6)
      : Promise.resolve({ data: [] }),
    skillIds.length > 0
      ? supabase.from("resource_skill_map").select("resource_id").in("skill_id", skillIds)
      : Promise.resolve({ data: [] }),
  ]);

  const skillMatchIds = Array.from(new Set((bySkill.data || []).map((r) => r.resource_id))).filter((id) => id !== video.id);
  const bySkillRows = skillMatchIds.length > 0
    ? await supabase
        .from("resources")
        .select("id, slug, title, description, category, source, external_url, thumbnail_url, access")
        .eq("status", "published").eq("resource_type", "video").eq("show_in_library", true)
        .in("id", skillMatchIds).limit(6)
    : { data: [] };

  const merged = [...((byCategory.data as VideoCardData[]) || []), ...((bySkillRows.data as VideoCardData[]) || [])];
  return Array.from(new Map(merged.map((v) => [v.id, v])).values()).slice(0, 6);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideo(slug);
  if (!video) return { title: "Video not found" };
  return {
    title: video.title,
    description: video.description?.slice(0, 155) || `${video.title} on Prowess Digital Solutions.`,
  };
}

export default async function VideoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const video = await getVideo(slug);
  if (!video) return notFound();

  const skills = video.resource_skill_map.map((m) => m.skills).filter(Boolean);
  const skillIds = skills.map((s) => s.id);

  const [graph, moreVideos] = await Promise.all([
    getSkillGraph(skillIds, { limit: 4 }),
    getMoreVideos(video),
  ]);

  const publishedLabel = video.published_at
    ? new Date(video.published_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <Reveal>
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Videos", href: "/videos" },
              ...(video.category ? [{ label: video.category, href: `/videos?category=${encodeURIComponent(video.category)}` }] : []),
              { label: video.title },
            ]}
          />

          <div className="mt-4 flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{video.title}</h1>
            <SaveButton itemType="resource" itemId={video.id} className="flex-shrink-0" />
          </div>
        </Reveal>

        <Reveal delay={40}>
          <VideoPlayer resourceId={video.id} price={video.price} currency={video.price_currency} />
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-4">
            {video.category && (
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p><p className="mt-1 text-sm font-semibold text-foreground">{video.category}</p></div>
            )}
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Audience</p><p className="mt-1 text-sm font-semibold text-foreground">{AUDIENCE_LABELS[video.audience]}</p></div>
            {video.duration_minutes && (
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Duration</p><p className="mt-1 text-sm font-semibold text-foreground">{video.duration_minutes} min</p></div>
            )}
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Source</p><p className="mt-1 text-sm font-semibold text-foreground">{SOURCE_LABELS[video.source] || video.source}</p></div>
            {publishedLabel && (
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Published</p><p className="mt-1 text-sm font-semibold text-foreground">{publishedLabel}</p></div>
            )}
          </div>
        </Reveal>

        {video.description && (
          <Reveal delay={100}>
            <p className="mt-6 leading-relaxed text-muted-foreground">{video.description}</p>
          </Reveal>
        )}

        {skills.length > 0 && (
          <Reveal delay={120}>
            <div className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Topics</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Link key={s.slug} href={`/skills/${s.slug}`} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        )}

        {video.why_recommended && (
          <Reveal delay={140}>
            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Why we recommend this</h2>
              <RichText html={video.why_recommended} className="mt-2" />
            </div>
          </Reveal>
        )}

        <Reveal delay={160}>
          <RelatedSection title="WANT TO GO DEEPER?" items={[...graph.courses, ...graph.resources]} render={() => (
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

        {moreVideos.length > 0 && (
          <Reveal delay={260}>
            <div className="mt-10">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">More videos</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {moreVideos.map((v) => <VideoCard key={v.id} video={v} />)}
              </div>
            </div>
          </Reveal>
        )}

        {video.source !== "prowess" && (
          <p className="mt-10 text-center text-xs text-muted-foreground">
            This video is hosted on {SOURCE_LABELS[video.source] || "a third-party site"} and shared here for its educational value - all rights belong to the original creator.
          </p>
        )}
      </div>
    </div>
  );
}
