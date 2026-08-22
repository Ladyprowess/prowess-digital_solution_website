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
  // "Learnership" is common South African terminology for a structured,
  // work-based training programme - functionally an internship, and a real
  // tag on real feeds (confirmed against a live source), just not a word
  // most sources outside the region would think to add.
  internships: ["internship", "intern", "learnership"],
  competitions: ["competition", "challenge", "hackathon", "award", "prize"],
  freelance: ["freelance"],
};

// Word-boundary match, not a plain substring check - see the same fix in
// jobs/runImport.ts for why (short/common words false-positive inside
// unrelated ones otherwise). The trailing "s?" matters just as much here:
// RSS category tags are almost always plural ("Grants", "Internships",
// "Scholarships"), and a strict \bgrant\b matches none of them - this
// silently dropped about half of every real opportunity import as
// "unclassifiable" until caught.
function textMatchesKeyword(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}s?\\b`, "i").test(text);
}

function matchTypeSlug(tags: string[], title: string): string | null {
  const haystacks = [...tags, title];
  for (const [slug, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (keywords.some((kw) => haystacks.some((h) => textMatchesKeyword(h, kw)))) return slug;
  }
  return null;
}

// listing.postedAt is raw, unvalidated text from a connector - see the
// identical helper in jobs/runImport.ts for why this is worth catching
// explicitly rather than trusting Date's behavior on garbage input.
function parsePostedAt(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
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
      // Same reasoning as the jobs importer: no real deadline comes through
      // these feeds, so this isn't shown as one - it's just a safety net so
      // an imported listing doesn't stay visible forever after the source
      // pulls it down.
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const sourcePublishedAt = parsePostedAt(listing.postedAt);

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
        // Stored regardless of publish status - see jobs/runImport.ts and
        // supabase/source_published_at.sql for why.
        source_published_at: sourcePublishedAt,
        published_at: source.auto_publish ? (sourcePublishedAt || now) : null,
        expires_at: expiresAt,
      });

      if (insertError) { summary.errors += 1; continue; }
      summary.imported += 1;
    } catch {
      summary.errors += 1;
    }
  }

  return summary;
}
