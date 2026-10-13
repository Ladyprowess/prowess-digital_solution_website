import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { ApplyButton } from "@/components/jobs/ApplyButton";
import { RichText } from "@/components/RichText";
import { RelatedSection } from "@/components/RelatedSection";
import { Breadcrumb } from "@/components/Breadcrumb";
import { stripHtmlForMeta } from "@/lib/stripHtml";
import { getSkillGraph } from "@/lib/careerPathGraph";

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
  benefits: string | null;
  nice_to_have: string | null;
  apply_url: string;
  location_type: "remote" | "hybrid" | "on_site";
  country: string | null;
  city: string | null;
  remote_regions: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  experience_level: string | null;
  deadline_at: string | null;
  status: "draft" | "published" | "closed" | "expired";
  expires_at: string | null;
  company_id: string;
  companies: {
    name: string; website: string | null; description: string | null;
    logo_url: string | null; verified: boolean; industry: string | null; company_size: string | null;
  } | null;
  job_categories: { slug: string; name: string } | null;
  job_types: { name: string } | null;
  job_skill_map: { skills: { id: string; name: string; slug: string } }[];
  job_sources: { name: string; source_type: string } | null;
};

// No status/expires_at filter here - RLS already restricts anon reads to
// published/closed/expired (never draft), and the component below needs to
// tell the difference between those states to render the right thing
// (rather than a 404 for a job that was public until recently).
async function getJob(slug: string) {
  const { data } = await supabase
    .from("jobs")
    .select(
      "id, slug, title, description, requirements, responsibilities, benefits, nice_to_have, apply_url, location_type, country, city, remote_regions, salary_min, salary_max, salary_currency, salary_period, experience_level, deadline_at, status, expires_at, company_id, companies(name, website, description, logo_url, verified, industry, company_size), job_categories(slug, name), job_types(name), job_skill_map(skills(id, name, slug)), job_sources(name, source_type)"
    )
    .eq("slug", slug)
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
  const per = j.salary_period ? `/${j.salary_period}` : "";
  if (j.salary_min && j.salary_max) return `${cur} ${j.salary_min.toLocaleString()}–${j.salary_max.toLocaleString()}${per}`;
  return `${cur} ${(j.salary_min || j.salary_max)?.toLocaleString()}${per}`;
}

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return notFound();

  const nowIso = new Date().toISOString();
  const isClosed = job.status === "closed" || job.status === "expired" || (job.status === "published" && Boolean(job.expires_at) && job.expires_at! < nowIso);

  if (isClosed) {
    return (
      <div className="min-h-screen bg-background py-24">
        <div className="mx-auto max-w-xl px-4 text-center">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Jobs", href: "/jobs" }, { label: job.title }]} />
          <h1 className="mt-6 text-2xl font-bold text-foreground">{job.title}</h1>
          <p className="mt-1 text-muted-foreground">{job.companies?.name || "Prowess Digital Solutions"}</p>
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-border bg-card p-6">
            <p className="font-semibold text-foreground">This job is no longer accepting applications.</p>
            <p className="mt-2 text-sm text-muted-foreground">It may have been filled, or the listing has closed.</p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {job.job_categories && (
              <Link href={`/jobs?category=${job.job_categories.slug}`} className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
                View Similar Jobs
              </Link>
            )}
            <Link href="/opportunities" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Explore Opportunities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const skills = job.job_skill_map?.map((m) => m.skills).filter(Boolean) || [];
  const skillIds = skills.map((s) => s.id);
  const graph = await getSkillGraph(skillIds, { limit: 4 });

  // Similar Jobs: prefer skill-overlap matches (already computed by
  // getSkillGraph, no extra query) - only fall back to a same-category
  // query to top up to 3 when skill overlap alone isn't enough.
  const skillMatches = graph.jobs.filter((j) => j.slug !== job.slug);
  let similarJobs = skillMatches.slice(0, 3);
  if (similarJobs.length < 3 && job.job_categories) {
    const excludeSlugs = new Set([job.slug, ...similarJobs.map((j) => j.slug)]);
    const { data: catRow } = await supabase.from("jobs").select("category_id").eq("id", job.id).single();
    if (catRow?.category_id) {
      const { data } = await supabase
        .from("jobs")
        .select("slug, title, companies(name)")
        .eq("category_id", catRow.category_id)
        .eq("status", "published")
        .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
        .neq("id", job.id)
        .limit(3 - similarJobs.length + excludeSlugs.size);
      const extra = ((data as unknown as typeof similarJobs) || []).filter((j) => !excludeSlugs.has(j.slug));
      similarJobs = [...similarJobs, ...extra].slice(0, 3);
    }
  }

  let moreFromCompany: { slug: string; title: string }[] = [];
  if (job.company_id) {
    const { data } = await supabase
      .from("jobs")
      .select("slug, title")
      .eq("company_id", job.company_id)
      .eq("status", "published")
      .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
      .neq("id", job.id)
      .limit(5);
    moreFromCompany = data || [];
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <Reveal>
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Jobs", href: "/jobs" },
              ...(job.job_categories ? [{ label: job.job_categories.name, href: `/jobs?category=${job.job_categories.slug}` }] : []),
              { label: job.title },
            ]}
          />

          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wide text-primary">{job.job_categories?.name || "Job"}</span>
              <h1 className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">{job.title}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                {job.companies?.name || "Prowess Digital Solutions"}
                {job.companies?.verified && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.39 2.39 3.3-.44.44 3.3L20.5 9l-2.39 2.39.44 3.3-3.3.44L12 17.5l-2.39-2.39-3.3.44-.44-3.3L3.5 9l2.39-2.39-.44-3.3 3.3-.44z" /></svg>
                    Verified
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-border bg-card p-5 text-sm">
            <span className="text-foreground"><b>Location:</b> {locationLabel(job)}</span>
            {job.job_types?.name && <span className="text-foreground"><b>Type:</b> {job.job_types.name}</span>}
            {job.experience_level && <span className="text-foreground"><b>Level:</b> {job.experience_level}</span>}
            {salaryLabel(job) && <span className="text-foreground"><b>Salary:</b> {salaryLabel(job)}</span>}
            {job.deadline_at && <span className="text-foreground"><b>Deadline:</b> {new Date(job.deadline_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ApplyButton jobTitle={job.title} companyName={job.companies?.name || null} applyUrl={job.apply_url} />
            <SaveButton itemType="job" itemId={job.id} />
          </div>
        </Reveal>

        {job.description && (
          <Reveal delay={80}>
            <section className="mt-10">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">OVERVIEW</h2>
              <RichText html={job.description} className="mt-3" />
            </section>
          </Reveal>
        )}

        {job.companies?.description && (
          <Reveal delay={120}>
            <section className="mt-8 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">ABOUT {job.companies.name?.toUpperCase()}</h2>
              <RichText html={job.companies.description} className="mt-3" />
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                {job.companies.industry && <span>{job.companies.industry}</span>}
                {job.companies.company_size && <span>{job.companies.company_size}</span>}
              </div>
              {job.companies.website && (
                <a href={job.companies.website} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
                  Visit website →
                </a>
              )}
              {moreFromCompany.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">More jobs from this company</p>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {moreFromCompany.map((j) => (
                      <Link key={j.slug} href={`/jobs/${j.slug}`} className="text-sm font-semibold text-primary hover:underline">{j.title} →</Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </Reveal>
        )}

        {job.responsibilities && (
          <Reveal delay={160}>
            <section className="mt-8">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">RESPONSIBILITIES</h2>
              <RichText html={job.responsibilities} className="mt-3" />
            </section>
          </Reveal>
        )}

        {job.requirements && (
          <Reveal delay={200}>
            <section className="mt-8">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">REQUIREMENTS</h2>
              <RichText html={job.requirements} className="mt-3" />
            </section>
          </Reveal>
        )}

        {skills.length > 0 && (
          <Reveal delay={220}>
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

        {job.benefits && (
          <Reveal delay={240}>
            <section className="mt-8">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">BENEFITS</h2>
              <RichText html={job.benefits} className="mt-3" />
            </section>
          </Reveal>
        )}

        {job.nice_to_have && (
          <Reveal delay={260}>
            <section className="mt-8">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">NICE TO HAVE</h2>
              <RichText html={job.nice_to_have} className="mt-3" />
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

        <Reveal delay={340}>
          <RelatedSection title="NOT READY YET? RELATED INTERNSHIPS" items={graph.internships} render={() => graph.internships.map((o) => (
            <Link key={o.slug} href={`/opportunities/${o.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <p className="text-sm font-semibold text-foreground">{o.title}</p>
              {o.organisation_name && <p className="mt-0.5 text-xs text-muted-foreground">{o.organisation_name}</p>}
            </Link>
          ))} />
        </Reveal>

        <Reveal delay={360}>
          <RelatedSection title="RELATED OPPORTUNITIES" items={graph.opportunities} render={() => graph.opportunities.map((o) => (
            <Link key={o.slug} href={`/opportunities/${o.slug}`} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30">
              <p className="text-sm font-semibold text-foreground">{o.title}</p>
              {o.organisation_name && <p className="mt-0.5 text-xs text-muted-foreground">{o.organisation_name}</p>}
            </Link>
          ))} />
        </Reveal>

        {similarJobs.length > 0 && (
          <Reveal delay={380}>
            <section className="mt-10">
              <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">SIMILAR JOBS</h2>
              <div className="mt-4 grid gap-3">
                {similarJobs.map((r) => (
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

        {job.job_sources && job.job_sources.source_type !== "manual" && (
          <p className="mt-10 text-xs text-muted-foreground">
            Job source: {job.job_sources.name} ·{" "}
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              Apply on original website
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
