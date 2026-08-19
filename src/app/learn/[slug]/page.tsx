import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { CourseContent } from "@/components/CourseContent";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type CourseDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: string | null;
  access: "free" | "premium";
  price: number | null;
  price_currency: string | null;
  course_skill_map: { skills: { name: string; slug: string } }[];
};

async function getCourse(slug: string) {
  const { data } = await supabase
    .from("courses")
    .select("id, slug, title, description, level, access, price, price_currency, course_skill_map(skills(name, slug))")
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
    description: course.description?.slice(0, 155) || `Learn ${course.title} on Prowess Digital Solutions.`,
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return notFound();

  const skills = course.course_skill_map?.map((m) => m.skills).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <Reveal>
          <Link href="/learn" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80">
            ← All courses
          </Link>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${course.access === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {course.access === "premium" ? `Premium${course.price ? ` — ${course.price_currency || "NGN"} ${course.price}` : ""}` : "Free"}
              </span>
              <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{course.title}</h1>
              {course.level && <p className="mt-1 text-sm text-muted-foreground">{course.level[0].toUpperCase() + course.level.slice(1)}</p>}
            </div>
            <SaveButton itemType="course" itemId={course.id} className="flex-shrink-0" />
          </div>

          {course.description && <p className="mt-4 leading-relaxed text-muted-foreground">{course.description}</p>}

          {skills.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s.slug} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">{s.name}</span>
              ))}
            </div>
          )}
        </Reveal>

        <CourseContent courseId={course.id} price={course.price} currency={course.price_currency} />
      </div>
    </div>
  );
}
