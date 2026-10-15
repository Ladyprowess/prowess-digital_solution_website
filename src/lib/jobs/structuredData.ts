// Builds the schema.org JobPosting data Google reads to list a job in its
// job search results. Kept free of imports so it can be unit tested.

export type JobPostingSource = {
  slug: string;
  title: string;
  description: string | null;
  responsibilities: string | null;
  requirements: string | null;
  benefits: string | null;
  location_type: "remote" | "hybrid" | "on_site";
  country: string | null;
  city: string | null;
  remote_regions: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  deadline_at: string | null;
  expires_at: string | null;
  published_at: string | null;
  companies: { name: string; website: string | null; logo_url: string | null } | null;
  job_types: { name: string } | null;
};

const EMPLOYMENT_TYPES: Record<string, string> = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  contract: "CONTRACTOR",
  freelance: "CONTRACTOR",
  internship: "INTERN",
  temporary: "TEMPORARY",
  volunteer: "VOLUNTEER",
};

const SALARY_UNITS: Record<string, string> = { hour: "HOUR", day: "DAY", week: "WEEK", month: "MONTH", year: "YEAR" };

function sectionHtml(heading: string, html: string | null) {
  return html ? `<h3>${heading}</h3>${html}` : "";
}

export function jobPostingJsonLd(job: JobPostingSource, siteUrl: string) {
  const description = [
    job.description || "",
    sectionHtml("Responsibilities", job.responsibilities),
    sectionHtml("Requirements", job.requirements),
    sectionHtml("Benefits", job.benefits),
  ].join("") || job.title;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description,
    url: `${siteUrl}/jobs/${job.slug}`,
    identifier: { "@type": "PropertyValue", name: job.companies?.name || "Prowess Digital Solutions", value: job.slug },
    hiringOrganization: {
      "@type": "Organization",
      name: job.companies?.name || "Prowess Digital Solutions",
      ...(job.companies?.website ? { sameAs: job.companies.website } : {}),
      ...(job.companies?.logo_url ? { logo: job.companies.logo_url } : {}),
    },
    directApply: false,
  };

  if (job.published_at) data.datePosted = job.published_at;
  const validThrough = job.deadline_at || job.expires_at;
  if (validThrough) data.validThrough = validThrough;

  const employmentType = EMPLOYMENT_TYPES[(job.job_types?.name || "").trim().toLowerCase()];
  if (employmentType) data.employmentType = employmentType;

  if (job.location_type === "remote") {
    data.jobLocationType = "TELECOMMUTE";
    const regions = (job.remote_regions || []).filter(Boolean);
    if (regions.length) data.applicantLocationRequirements = regions.map((name) => ({ "@type": "Country", name }));
  }
  if (job.location_type !== "remote" && (job.city || job.country)) {
    data.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(job.city ? { addressLocality: job.city } : {}),
        ...(job.country ? { addressCountry: job.country } : {}),
      },
    };
  }

  const unitText = SALARY_UNITS[job.salary_period || ""] || "YEAR";
  if (job.salary_currency && (job.salary_min || job.salary_max)) {
    const value: Record<string, unknown> = { "@type": "QuantitativeValue", unitText };
    if (job.salary_min && job.salary_max) {
      value.minValue = job.salary_min;
      value.maxValue = job.salary_max;
    } else {
      value.value = job.salary_min || job.salary_max;
    }
    data.baseSalary = { "@type": "MonetaryAmount", currency: job.salary_currency.toUpperCase(), value };
  }

  return data;
}

// JSON-LD sits inside a <script> tag, so "<" must be escaped to stop job
// text containing "</script>" from breaking out of it.
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
