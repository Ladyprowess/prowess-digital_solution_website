import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/slugify";
import type { NormalizedOpportunity } from "./importers/types";

type JobSourceRow = {
  id: string;
  slug: string;
  default_type_slug: string | null;
  auto_publish: boolean;
};

const TYPE_KEYWORDS: Record<string, string[]> = {
  scholarships: ["scholarship"],
  grants: ["grant"],
  fellowships: ["fellowship"],
  internships: ["internship", "intern"],
  competitions: ["competition", "challenge", "hackathon", "award", "prize"],
  freelance: ["freelance"],
};

// Word-boundary match, not a plain substring check - see the same fix in
// jobs/runImport.ts for why (short/common words false-positive inside
// unrelated ones otherwise).
function textMatchesKeyword(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

function matchTypeSlug(tags: string[], title: string): string | null {
  const haystacks = [...tags, title];
  for (const [slug, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (keywords.some((kw) => haystacks.some((h) => textMatchesKeyword(h, kw)))) return slug;
  }
  return null;
}

export type ImportSummary = { fetched: number; imported: number; skippedExisting: number; errors: number };

export async function runOpportunityImportForSource(
  db: SupabaseClient,
  source: JobSourceRow,
  listings: NormalizedOpportunity[]
): Promise<ImportSummary> {
  const summary: ImportSummary = { fetched: listings.length, imported: 0, skippedExisting: 0, errors: 0 };
  if (listings.length === 0) return summary;

  const [{ data: types }, { data: existingOpportunities }] = await Promise.all([
    db.from("opportunity_types").select("id, slug"),
    db.from("opportunities").select("external_id").eq("source_id", source.id),
  ]);

  const typeBySlug = new Map((types || []).map((t) => [t.slug, t.id]));
  const existingExternalIds = new Set((existingOpportunities || []).map((o) => o.external_id).filter(Boolean));
  const fallbackTypeId = source.default_type_slug ? typeBySlug.get(source.default_type_slug) : undefined;

  for (const listing of listings) {
    if (existingExternalIds.has(listing.externalId)) {
      summary.skippedExisting += 1;
      continue;
    }

    try {
      const typeSlug = matchTypeSlug(listing.tags, listing.title);
      const typeId = (typeSlug && typeBySlug.get(typeSlug)) || fallbackTypeId;

      if (!typeId) {
        summary.errors += 1;
        continue;
      }

      const opportunitySlug = `${slugify(listing.title)}-${listing.externalId.slice(-12).replace(/[^a-z0-9]/gi, "")}`;
      const now = new Date().toISOString();

      const { error: insertError } = await db.from("opportunities").insert({
        slug: opportunitySlug,
        title: listing.title,
        type_id: typeId,
        organisation_name: listing.organisationName,
        description: listing.descriptionText || null,
        location_type: listing.locationType,
        country: listing.country || null,
        city: listing.city || null,
        apply_url: listing.applyUrl,
        source_id: source.id,
        external_id: listing.externalId,
        status: source.auto_publish ? "published" : "draft",
        published_at: source.auto_publish ? now : null,
      });

      if (insertError) { summary.errors += 1; continue; }
      summary.imported += 1;
    } catch {
      summary.errors += 1;
    }
  }

  return summary;
}
