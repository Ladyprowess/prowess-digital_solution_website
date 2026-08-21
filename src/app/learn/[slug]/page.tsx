import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { CourseContent } from "@/components/CourseContent";
import { RichText } from "@/components/RichText";
import { RelatedSection } from "@/components/RelatedSection";
import { Breadcrumb } from "@/components/Breadcrumb";
import { stripHtmlForMeta } from "@/lib/stripHtml";
import { getSkillGraph } from "@/lib/careerPathGraph";

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
  price: number | null;
  price_currency: string | null;
  thumbnail_url: string | null;
  duration_label: string | null;
  featured: boolean;
  course_skill_map: { skills: { id: string; name: string; slug: string } }[];
};

async function getCourse(slug: string) {
  const { data } = await supabase
    .from("courses")
    .select("id, slug, title, description, what_youll_learn, level, access, price, price_currency, thumbnail_url, duration_label, featured, course_skill_map(skills(id, name, slug))")
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

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <Reveal>
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Learn", href: "/learn" }, { label: course.title }]} />

          {course.thumbnail_url && (
            <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
            </div>
          )}

          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${course.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {course.access === "premium" ? `Premium${course.price ? ` - ${course.price_currency || "NGN"} ${course.price}` : ""}` : "Free"}
                </span>
                {course.featured && (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Featured</span>
                )}
              </div>
              <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{course.title}</h1>
              <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                {course.level && <span>{course.level[0].toUpperCase() + course.level.slice(1)}</span>}
                {course.duration_label && <span>{course.duration_label}</span>}
              </div>
            </div>
            <SaveButton itemType="course" itemId={course.id} className="flex-shrink-0" />
          </div>

          {course.description && <RichText html={course.description} className="mt-4" />}

          {skills.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {skills.map((s) => (
                <Link key={s.slug} href={`/skills/${s.slug}`} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
                  {s.name}
                </Link>
              ))}
            </div>
          )}
        </Reveal>

        {course.what_youll_learn && (
          <Reveal delay={80}>
            <section className="mt-10">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">WHAT YOU&apos;LL LEARN</h2>
              <RichText html={course.what_youll_learn} className="mt-3" />
            </section>
          </Reveal>
        )}

        <CourseContent courseId={course.id} price={course.price} currency={course.price_currency} />

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
          <RelatedSection title="RECOMMENDED RESOURCES" items={graph.resources} render={() => graph.resources.map((r) => (
            <Link key={r.slug} href={`/resources/${r.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">{r.resource_type?.replace("_", " ") || "Resource"}</span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{r.title}</p>
            </Link>
          ))} />
        </Reveal>

        {(graph.jobs.length > 0 || graph.opportunities.length > 0) && (
          <Reveal delay={320}>
            <section className="mt-10">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">WHERE CAN THIS SKILL TAKE YOU?</h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                {graph.jobs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Jobs</p>
                    <div className="mt-2 flex flex-col gap-2">
                      {graph.jobs.map((j) => (
                        <Link key={j.slug} href={`/jobs/${j.slug}`} className="rounded-xl border border-border bg-card p-3 text-sm font-semibold text-foreground transition hover:border-primary/30">
                          {j.title}
                          {j.companies?.name && <span className="block text-xs font-normal text-muted-foreground">{j.companies.name}</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {graph.opportunities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Opportunities</p>
                    <div className="mt-2 flex flex-col gap-2">
                      {graph.opportunities.map((o) => (
                        <Link key={o.slug} href={`/opportunities/${o.slug}`} className="rounded-xl border border-border bg-card p-3 text-sm font-semibold text-foreground transition hover:border-primary/30">
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
