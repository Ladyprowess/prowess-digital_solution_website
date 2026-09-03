import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Calendar, Clock, Layers, Lightbulb, PlayCircle, Users, Video } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { VideoPlayer } from "@/components/videos/VideoPlayer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RichText } from "@/components/RichText";
import { RelatedSection } from "@/components/RelatedSection";
import { VideoCard, type VideoCardData } from "@/components/videos/VideoCard";
import { getSkillGraph } from "@/lib/careerPathGraph";
import { formatMoney } from "@/lib/formatMoney";

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
  price_usd: number | null;
  price_ngn: number | null;
  duration_minutes: number | null;
  why_recommended: string | null;
  published_at: string | null;
  show_in_learn: boolean;
  resource_skill_map: { skills: { id: string; slug: string; name: string } }[];
};

function resourceHref(resource: { slug: string; resource_type: string | null }) {
  return resource.resource_type === "video" ? `/videos/${resource.slug}` : `/resources/${resource.slug}`;
}

async function getVideo(slug: string) {
  const { data } = await supabase
    .from("resources")
    .select(
      "id, slug, title, description, category, audience, source, external_url, access, price_usd, price_ngn, duration_minutes, why_recommended, published_at, show_in_learn, resource_skill_map(skills(id, slug, name))"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .eq("resource_type", "video")
    .maybeSingle();
  return data as unknown as VideoDetail | null;
}

async function getMoreVideos(video: VideoDetail): Promise<VideoCardData[]> {
  const skillIds = video.resource_skill_map.map((m) => m.skills?.id).filter((id): id is string => Boolean(id));

  // A video reached through Learn (show_in_learn) should only recommend
  // other videos that were themselves deliberately curated into Learn -
  // otherwise "more videos" leaks in general-library content an admin
  // never added to the Learn catalog, even though it happens to share a
  // category/skill tag. A general-library video (show_in_learn = false)
  // keeps recommending from the whole library, as before.
  const learnScope = video.show_in_learn ? { show_in_learn: true } : {};

  const [byCategory, bySkill] = await Promise.all([
    video.category
      ? supabase
          .from("resources")
          .select("id, slug, title, description, category, source, external_url, thumbnail_url, access")
          .eq("status", "published").eq("resource_type", "video").eq("show_in_library", true).match(learnScope)
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
        .eq("status", "published").eq("resource_type", "video").eq("show_in_library", true).match(learnScope)
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
  const accessLabel =
    video.access === "premium"
      ? [
          "Premium",
          video.price_usd ? formatMoney(video.price_usd, "USD") : null,
          video.price_ngn ? formatMoney(video.price_ngn, "NGN") : null,
        ].filter(Boolean).join(" ")
      : "Free";

  return (
    <div className="min-h-screen bg-background pb-16">
      <section className="border-b border-border bg-brand-bg">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <Reveal>
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "Videos", href: "/videos" },
                ...(video.category ? [{ label: video.category, href: `/videos?category=${encodeURIComponent(video.category)}` }] : []),
                { label: video.title },
              ]}
            />
          </Reveal>

          <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <Reveal>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${video.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {accessLabel}
                  </span>
                  {video.category && (
                    <Link href={`/videos?category=${encodeURIComponent(video.category)}`} className="rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      {video.category}
                    </Link>
                  )}
                </div>
                <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl">{video.title}</h1>
                {video.description && <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">{video.description}</p>}
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a href="#watch" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <PlayCircle size={18} aria-hidden="true" />
                    Watch video
                  </a>
                  <SaveButton itemType="resource" itemId={video.id} className="flex-shrink-0" />
                </div>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <aside className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Video size={22} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Video overview</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">Watch the video, then open only the most useful follow up material.</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    video.duration_minutes ? { icon: Clock, label: "Duration", value: `${video.duration_minutes} min` } : null,
                    { icon: Users, label: "Audience", value: AUDIENCE_LABELS[video.audience] },
                    { icon: Layers, label: "Source", value: SOURCE_LABELS[video.source] || video.source },
                    publishedLabel ? { icon: Calendar, label: "Published", value: publishedLabel } : null,
                  ].filter(Boolean).map((item) => {
                    const Icon = item!.icon;
                    return (
                      <div key={item!.label} className="flex items-center gap-3 rounded-lg bg-muted p-3">
                        <Icon size={16} className="text-primary" aria-hidden="true" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item!.label}</p>
                          <p className="text-sm font-semibold text-foreground">{item!.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </aside>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 pt-10">
        <Reveal>
          <section id="watch" className="scroll-mt-28">
            <VideoPlayer resourceId={video.id} priceUsd={video.price_usd} priceNgn={video.price_ngn} />
          </section>
        </Reveal>

        {skills.length > 0 && (
          <Reveal delay={120}>
            <div className="mt-8 rounded-lg border border-border bg-card p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Topics</h2>
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

        {video.why_recommended && (
          <Reveal delay={140}>
            <div className="mt-8 rounded-lg border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary"><Lightbulb size={15} aria-hidden="true" />Why we recommend this</h2>
              <RichText html={video.why_recommended} className="mt-2" />
            </div>
          </Reveal>
        )}

        <Reveal delay={160}>
          <RelatedSection title="Related courses" items={graph.courses} render={() => graph.courses.map((c) => (
            <Link key={c.slug} href={`/learn/${c.slug}`} className="rounded-lg border border-border bg-card p-4 transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>Course</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{c.title}</p>
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={180}>
          <RelatedSection title="Supporting resources" items={graph.resources} render={() => graph.resources.map((r) => (
            <Link key={r.slug} href={resourceHref(r)} className="rounded-lg border border-border bg-card p-4 transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">{r.resource_type?.replace("_", " ") || "Resource"}</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{r.title}</p>
            </Link>
          ))} />
        </Reveal>

        {moreVideos.length > 0 && (
          <Reveal delay={200}>
            <div className="mt-10">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary">More videos</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {moreVideos.map((v) => <VideoCard key={v.id} video={v} />)}
              </div>
            </div>
          </Reveal>
        )}

        {video.source !== "prowess" && (
          <p className="mt-10 text-center text-xs text-muted-foreground">
            This video is hosted on {SOURCE_LABELS[video.source] || "a third-party site"}. Rights belong to the original creator.
          </p>
        )}
      </div>
    </div>
  );
}
