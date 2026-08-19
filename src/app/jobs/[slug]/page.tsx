import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { RichText } from "@/components/RichText";
import { stripHtmlForMeta } from "@/lib/stripHtml";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type JobDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  apply_url: string;
  location_type: "remote" | "hybrid" | "on_site";
  country: string | null;
  city: string | null;
  remote_regions: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  experience_level: string | null;
  deadline_at: string | null;
  companies: { name: string; website: string | null; description: string | null } | null;
  job_categories: { name: string } | null;
  job_types: { name: string } | null;
  job_skill_map: { skills: { name: string; slug: string } }[];
};

async function getJob(slug: string) {
  const { data } = await supabase
    .from("jobs")
    .select("id, slug, title, description, requirements, responsibilities, apply_url, location_type, country, city, remote_regions, salary_min, salary_max, salary_currency, experience_level, deadline_at, companies(name, website, description), job_categories(name), job_types(name), job_skill_map(skills(name, slug))")
    .eq("slug", slug)
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
    .maybeSingle();
  return data as unknown as JobDetail | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return { title: "Job not found" };
  const company = job.companies?.name || "Prowess Digital Solutions";
  return {
    title: `${job.title} at ${company}`,
    description: (job.description ? stripHtmlForMeta(job.description) : "") || `${job.title} - apply on Prowess Digital Solutions.`,
  };
}

function locationLabel(j: JobDetail) {
  if (j.location_type === "remote") {
    return j.remote_regions?.length ? `Remote - ${j.remote_regions.join(", ")}` : "Remote";
  }
  return [j.location_type === "hybrid" ? "Hybrid" : "On-site", j.city, j.country].filter(Boolean).join(" · ");
}

function salaryLabel(j: JobDetail) {
  if (!j.salary_min && !j.salary_max) return null;
  const cur = j.salary_currency || "";
  if (j.salary_min && j.salary_max) return `${cur} ${j.salary_min.toLocaleString()}–${j.salary_max.toLocaleString()}`;
  return `${cur} ${(j.salary_min || j.salary_max)?.toLocaleString()}`;
}

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return notFound();

  const skills = job.job_skill_map?.map((m) => m.skills).filter(Boolean) || [];

  let relatedJobs: { slug: string; title: string; companies: { name: string } | null }[] = [];
  if (job.job_categories) {
    const { data: catRow } = await supabase.from("jobs").select("category_id").eq("id", job.id).single();
    if (catRow?.category_id) {
      const { data } = await supabase
        .from("jobs")
        .select("slug, title, companies(name)")
        .eq("category_id", catRow.category_id)
        .eq("status", "published")
        .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
        .neq("id", job.id)
        .limit(3);
      relatedJobs = (data as unknown as typeof relatedJobs) || [];
    }
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <Reveal>
          <Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80">
            ← All jobs
          </Link>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wide text-primary">{job.job_categories?.name || "Job"}</span>
              <h1 className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">{job.title}</h1>
              <p className="mt-2 text-muted-foreground">{job.companies?.name || "Prowess Digital Solutions"}</p>
            </div>
            <SaveButton itemType="job" itemId={job.id} className="flex-shrink-0" />
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-border bg-card p-5 text-sm">
            <span className="text-foreground"><b>Location:</b> {locationLabel(job)}</span>
            {job.job_types?.name && <span className="text-foreground"><b>Type:</b> {job.job_types.name}</span>}
            {job.experience_level && <span className="text-foreground"><b>Level:</b> {job.experience_level}</span>}
            {salaryLabel(job) && <span className="text-foreground"><b>Salary:</b> {salaryLabel(job)}</span>}
            {job.deadline_at && <span className="text-foreground"><b>Deadline:</b> {new Date(job.deadline_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>}
          </div>

          {skills.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s.slug} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">{s.name}</span>
              ))}
            </div>
          )}

          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90"
          >
            Apply now →
          </a>
        </Reveal>

        {job.description && (
          <Reveal delay={80}>
            <section className="mt-10">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">DESCRIPTION</h2>
              <RichText html={job.description} className="mt-3" />
            </section>
          </Reveal>
        )}

        {job.responsibilities && (
          <Reveal delay={120}>
            <section className="mt-8">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">RESPONSIBILITIES</h2>
              <RichText html={job.responsibilities} className="mt-3" />
            </section>
          </Reveal>
        )}

        {job.requirements && (
          <Reveal delay={160}>
            <section className="mt-8">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">REQUIREMENTS</h2>
              <RichText html={job.requirements} className="mt-3" />
            </section>
          </Reveal>
        )}

        {job.companies?.description && (
          <Reveal delay={200}>
            <section className="mt-8 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">ABOUT {job.companies.name?.toUpperCase()}</h2>
              <p className="mt-3 leading-relaxed text-foreground">{job.companies.description}</p>
              {job.companies.website && (
                <a href={job.companies.website} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
                  Visit website →
                </a>
              )}
            </section>
          </Reveal>
        )}

        {relatedJobs.length > 0 && (
          <Reveal delay={240}>
            <section className="mt-12">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">MORE JOBS LIKE THIS</h2>
              <div className="mt-4 grid gap-3">
                {relatedJobs.map((r) => (
                  <Link key={r.slug} href={`/jobs/${r.slug}`} className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition hover:border-primary/30">
                    <span>
                      <span className="block text-sm font-semibold text-foreground">{r.title}</span>
                      <span className="block text-xs text-muted-foreground">{r.companies?.name}</span>
                    </span>
                    <span className="text-sm font-semibold text-primary">View →</span>
                  </Link>
                ))}
              </div>
            </section>
          </Reveal>
        )}
      </div>
    </div>
  );
}
