import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/slugify";
import type { NormalizedListing } from "./importers/types";

type JobSourceRow = {
  id: string;
  slug: string;
  default_category_slug: string | null;
  default_type_slug: string | null;
  auto_publish: boolean;
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  tech: ["dev", "developer", "engineer", "engineering", "programming", "backend", "frontend", "full stack", "fullstack", "sysadmin", "sys admin", "devops", "qa", "security", "cybersecurity", "data", "machine learning", "ai", "cloud", "infra", "software"],
  design: ["design", "ux", "ui", "graphic"],
  marketing: ["marketing", "seo", "growth", "social media"],
  writing: ["writer", "writing", "content", "copywriting", "editor"],
  "customer-support": ["support", "customer service", "customer success"],
  sales: ["sales", "business development", "account exec"],
  web3: ["web3", "blockchain", "crypto", "defi", "nft"],
};

const TYPE_KEYWORDS: Record<string, string[]> = {
  internship: ["internship", "intern"],
  freelance: ["freelance"],
  contract: ["contract", "contractor"],
  "part-time": ["part time", "parttime"],
};

// Word-boundary match, not a plain substring check - short keywords like
// "ai", "ui", "ux", "qa" would otherwise false-positive inside unrelated
// tags ("email" contains "ai", "guideline" contains "ui"), silently
// misfiling jobs into the wrong category.
function tagMatchesKeyword(tag: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(tag);
}

function matchSlugFromTags(tags: string[], keywordMap: Record<string, string[]>): string | null {
  for (const [slug, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((kw) => tags.some((tag) => tagMatchesKeyword(tag, kw)))) return slug;
  }
  return null;
}

export type ImportSummary = { fetched: number; imported: number; skippedExisting: number; errors: number };

export async function runImportForSource(
  db: SupabaseClient,
  source: JobSourceRow,
  listings: NormalizedListing[]
): Promise<ImportSummary> {
  const summary: ImportSummary = { fetched: listings.length, imported: 0, skippedExisting: 0, errors: 0 };
  if (listings.length === 0) return summary;

  const [{ data: categories }, { data: types }, { data: skills }, { data: existingJobs }] = await Promise.all([
    db.from("job_categories").select("id, slug"),
    db.from("job_types").select("id, slug"),
    db.from("skills").select("id, slug, name"),
    db.from("jobs").select("external_id").eq("source_id", source.id),
  ]);

  const categoryBySlug = new Map((categories || []).map((c) => [c.slug, c.id]));
  const typeBySlug = new Map((types || []).map((t) => [t.slug, t.id]));
  const skillList = skills || [];
  const existingExternalIds = new Set((existingJobs || []).map((j) => j.external_id).filter(Boolean));

  const fallbackCategoryId = source.default_category_slug ? categoryBySlug.get(source.default_category_slug) : undefined;
  const fallbackTypeId = source.default_type_slug ? typeBySlug.get(source.default_type_slug) : undefined;

  for (const listing of listings) {
    if (existingExternalIds.has(listing.externalId)) {
      summary.skippedExisting += 1;
      continue;
    }

    try {
      const categorySlug = matchSlugFromTags(listing.tags, CATEGORY_KEYWORDS);
      const categoryId = (categorySlug && categoryBySlug.get(categorySlug)) || fallbackCategoryId;
      const typeSlug = matchSlugFromTags(listing.tags, TYPE_KEYWORDS);
      const typeId = (typeSlug && typeBySlug.get(typeSlug)) || fallbackTypeId || typeBySlug.get("full-time");

      if (!categoryId || !typeId) {
        summary.errors += 1;
        continue;
      }

      const companySlug = slugify(listing.companyName);
      let companyId: string;
      const { data: existingCompany } = await db.from("companies").select("id").eq("slug", companySlug).maybeSingle();
      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const { data: createdCompany, error: companyError } = await db
          .from("companies")
          .insert({ slug: companySlug, name: listing.companyName, logo_url: listing.companyLogoUrl || null })
          .select("id")
          .single();
        if (companyError || !createdCompany) { summary.errors += 1; continue; }
        companyId = createdCompany.id;
      }

      const jobSlug = `${slugify(listing.title)}-${slugify(listing.companyName)}-${listing.externalId}`;

      const matchedSkillIds = skillList
        .filter((s) => listing.tags.some((tag) => tag.toLowerCase() === s.slug.toLowerCase() || tag.toLowerCase() === s.name.toLowerCase()))
        .map((s) => s.id);

      const now = new Date().toISOString();
      const { data: createdJob, error: jobError } = await db
        .from("jobs")
        .insert({
          slug: jobSlug,
          title: listing.title,
          company_id: companyId,
          category_id: categoryId,
          type_id: typeId,
          location_type: listing.locationType,
          country: listing.country || null,
          city: listing.city || null,
          description: listing.descriptionText || null,
          apply_url: listing.applyUrl,
          source_id: source.id,
          external_id: listing.externalId,
          status: source.auto_publish ? "published" : "draft",
          published_at: source.auto_publish ? now : null,
        })
        .select("id")
        .single();

      if (jobError || !createdJob) { summary.errors += 1; continue; }

      if (matchedSkillIds.length > 0) {
        await db.from("job_skill_map").insert(matchedSkillIds.map((skillId) => ({ job_id: createdJob.id, skill_id: skillId })));
      }

      summary.imported += 1;
    } catch {
      summary.errors += 1;
    }
  }

  return summary;
}
