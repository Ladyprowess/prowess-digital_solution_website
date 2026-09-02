import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, BriefcaseBusiness, Clock, GraduationCap, Layers, Sparkles } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { CourseContent } from "@/components/CourseContent";
import { RichText } from "@/components/RichText";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CourseReviews } from "@/components/learn/CourseReviews";
import { CourseDiscussion } from "@/components/learn/CourseDiscussion";
import { stripHtmlForMeta } from "@/lib/stripHtml";
import { getSkillGraph } from "@/lib/careerPathGraph";
import { formatMoney } from "@/lib/formatMoney";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type CourseDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  what_youll_learn: string | null;
  level: string | null;
  access: "free" | "premium";
  price_usd: number | null;
  price_ngn: number | null;
  thumbnail_url: string | null;
  duration_label: string | null;
  featured: boolean;
  course_skill_map: { skills: { id: string; name: string; slug: string } }[];
};

async function getCourse(slug: string) {
  const { data } = await supabase
    .from("courses")
    .select("id, slug, title, description, what_youll_learn, level, access, price_usd, price_ngn, thumbnail_url, duration_label, featured, course_skill_map(skills(id, name, slug))")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data as unknown as CourseDetail | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: "Course not found" };
  return {
    title: course.title,
    description: (course.description ? stripHtmlForMeta(course.description) : "") || `Learn ${course.title} on Prowess Digital Solutions.`,
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return notFound();

  const skills = course.course_skill_map?.map((m) => m.skills).filter(Boolean) || [];
  const skillIds = skills.map((s) => s.id);
  const graph = await getSkillGraph(skillIds, { limit: 4 });
  const accessLabel =
    course.access === "premium"
      ? [
          "Premium",
          course.price_usd ? formatMoney(course.price_usd, "USD") : null,
          course.price_ngn ? formatMoney(course.price_ngn, "NGN") : null,
        ].filter(Boolean).join(" ")
      : "Free";

  return (
    <div className="min-h-screen bg-background pb-16">
      <section className="border-b border-border bg-brand-bg">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <Reveal>
            <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Learn", href: "/learn" }, { label: course.title }]} />
          </Reveal>

          <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <Reveal>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${course.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {accessLabel}
                  </span>
                  {course.featured && (
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground">Featured</span>
                  )}
                </div>
                <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl">{course.title}</h1>
                <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-muted-foreground">
                  {course.level && <span className="inline-flex items-center gap-2"><Layers size={15} aria-hidden="true" />{course.level[0].toUpperCase() + course.level.slice(1)}</span>}
                  {course.duration_label && <span className="inline-flex items-center gap-2"><Clock size={15} aria-hidden="true" />{course.duration_label}</span>}
                </div>
                {course.description && <RichText html={course.description} className="mt-5 max-w-3xl" />}
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link href="#course-content" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    Start course
                  </Link>
                  <SaveButton itemType="course" itemId={course.id} className="flex-shrink-0" />
                </div>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <aside className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <div className="aspect-video bg-muted">
                  {course.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-brand-bg text-primary">
                      <GraduationCap size={42} aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-sm font-bold text-foreground">Course overview</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      { label: "Skills", value: skills.length },
                      { label: "Jobs", value: graph.jobs.length },
                      { label: "Paths", value: graph.careerPaths.length },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg bg-muted p-3">
                        <p className="text-lg font-bold text-foreground">{stat.value}</p>
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 pt-10">
        {skills.length > 0 && (
          <Reveal>
            <section className="rounded-lg border border-border bg-card p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Skills covered</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Link key={s.slug} href={`/skills/${s.slug}`} className="inline-flex min-h-9 items-center rounded-full border border-primary/20 bg-primary/5 px-3 text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    {s.name}
                  </Link>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {course.what_youll_learn && (
          <Reveal delay={80}>
            <section className="mt-8 rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-primary" aria-hidden="true" />
                <h2 className="text-xl font-bold text-foreground">What you will learn</h2>
              </div>
              <RichText html={course.what_youll_learn} className="mt-4" />
            </section>
          </Reveal>
        )}

        <section id="course-content" className="scroll-mt-28">
          <CourseContent courseId={course.id} priceUsd={course.price_usd} priceNgn={course.price_ngn} />
        </section>

        <CourseReviews courseId={course.id} />
        <CourseDiscussion courseId={course.id} />

        {graph.careerPaths.length > 0 && (
          <Reveal delay={280}>
            <section className="mt-10 rounded-lg border border-primary/20 bg-primary/5 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Career direction</p>
              {graph.careerPaths.slice(0, 1).map((c) => (
                <div key={c.slug} className="mt-2">
                  <p className="text-lg font-bold text-foreground">Explore {c.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">See the wider career path this course can support.</p>
                  <Link href={`/career-paths/${c.slug}`} className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    Explore career path
                  </Link>
                </div>
              ))}
            </section>
          </Reveal>
        )}

        {(graph.jobs.length > 0 || graph.opportunities.length > 0) && (
          <Reveal delay={320}>
            <section className="mt-10">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">NEXT STEPS AFTER THIS COURSE</h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                {graph.jobs.length > 0 && (
                  <div>
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"><BriefcaseBusiness size={14} aria-hidden="true" />Jobs</p>
                    <div className="mt-2 flex flex-col gap-2">
                      {graph.jobs.map((j) => (
                        <Link key={j.slug} href={`/jobs/${j.slug}`} className="rounded-lg border border-border bg-card p-3 text-sm font-semibold text-foreground transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                          {j.title}
                          {j.companies?.name && <span className="block text-xs font-normal text-muted-foreground">{j.companies.name}</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {graph.opportunities.length > 0 && (
                  <div>
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"><Sparkles size={14} aria-hidden="true" />Opportunities</p>
                    <div className="mt-2 flex flex-col gap-2">
                      {graph.opportunities.map((o) => (
                        <Link key={o.slug} href={`/opportunities/${o.slug}`} className="rounded-lg border border-border bg-card p-3 text-sm font-semibold text-foreground transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                          {o.title}
                          {o.organisation_name && <span className="block text-xs font-normal text-muted-foreground">{o.organisation_name}</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </Reveal>
        )}
      </div>
    </div>
  );
}
