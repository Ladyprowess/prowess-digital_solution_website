"use client";

import Link from "next/link";
import { SaveButton } from "@/components/SaveButton";
import { colorForSeed } from "@/lib/listingColors";
import { isClosingSoon } from "@/lib/jobs/constants";

export type JobCardData = {
  id: string;
  slug: string;
  title: string;
  company: { name: string; logo_url: string | null; verified: boolean } | null;
  category: string | null;
  location_type: "remote" | "hybrid" | "on_site";
  country: string | null;
  city: string | null;
  job_type: string | null;
  experience_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  skills: { slug: string; name: string }[];
  published_at: string | null;
  deadline_at: string | null;
  featured: boolean;
};

const MAX_SKILLS = 5;

function locationLabel(job: JobCardData) {
  if (job.location_type === "remote") return "Remote";
  return [job.location_type === "hybrid" ? "Hybrid" : "On-site", job.city, job.country].filter(Boolean).join(" · ");
}

// Never invent a salary - omit the row entirely rather than show a
// "Competitive salary" placeholder when the source didn't provide one.
function salaryLabel(job: JobCardData): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const cur = job.salary_currency || "";
  const per = job.salary_period ? `/${job.salary_period}` : "";
  if (job.salary_min && job.salary_max) return `${cur} ${job.salary_min.toLocaleString()}–${job.salary_max.toLocaleString()}${per}`;
  return `${cur} ${(job.salary_min || job.salary_max)?.toLocaleString()}${per}`;
}

function postedLabel(publishedAt: string | null) {
  if (!publishedAt) return null;
  const days = Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86_400_000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  return `Posted ${days} days ago`;
}

export function JobCard({ job }: { job: JobCardData }) {
  const color = colorForSeed(job.category || "Job");
  const shownSkills = job.skills.slice(0, MAX_SKILLS);
  const extraSkills = job.skills.length > MAX_SKILLS ? job.skills.length - MAX_SKILLS : 0;
  const salary = salaryLabel(job);
  const posted = postedLabel(job.published_at);
  const closingSoon = isClosingSoon(job.deadline_at);

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${color.ring}`}>
      <span className={`absolute inset-x-0 top-0 h-1 ${color.bar} opacity-70 transition group-hover:opacity-100`} />

      <Link href={`/jobs/${job.slug}`} className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2 pr-10">
          {job.company?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.company.logo_url} alt="" className="h-11 w-11 flex-shrink-0 rounded-xl border border-border object-cover" />
          ) : (
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${color.chip}`}>
              {(job.company?.name || job.title).slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-1.5">
            {job.featured && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">Featured</span>
            )}
            {job.location_type === "remote" && (
              <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Remote</span>
            )}
          </div>
        </div>

        {job.category && (
          <span className={`mt-4 w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${color.chip}`}>
            {job.category}
          </span>
        )}

        <h3 className="mt-3 text-lg font-bold leading-snug text-foreground">{job.title}</h3>
        {job.company?.name && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            {job.company.name}
            {job.company.verified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.39 2.39 3.3-.44.44 3.3L20.5 9l-2.39 2.39.44 3.3-3.3.44L12 17.5l-2.39-2.39-3.3.44-.44-3.3L3.5 9l2.39-2.39-.44-3.3 3.3-.44z" /></svg>
                Verified
              </span>
            )}
          </p>
        )}

        {shownSkills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {shownSkills.map((s) => (
              <span key={s.slug} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${color.tag}`}>{s.name}</span>
            ))}
            {extraSkills > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">+{extraSkills} more</span>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span>{locationLabel(job)}</span>
          {job.job_type && <span>{job.job_type}</span>}
          {job.experience_level && <span className="capitalize">{job.experience_level}</span>}
        </div>

        {salary && <p className="mt-3 text-sm font-semibold text-foreground">{salary}</p>}

        {(posted || job.deadline_at) && (
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <span>{posted}</span>
            {job.deadline_at && (
              <span className={closingSoon ? "flex items-center gap-1 font-semibold text-amber-600" : ""}>
                {closingSoon && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                Closes {new Date(job.deadline_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              </span>
            )}
          </div>
        )}
      </Link>

      <div className="absolute right-4 top-4" onClick={(e) => e.stopPropagation()}>
        <SaveButton itemType="job" itemId={job.id} iconOnly className="bg-card/95 shadow-sm backdrop-blur" />
      </div>
    </div>
  );
}
