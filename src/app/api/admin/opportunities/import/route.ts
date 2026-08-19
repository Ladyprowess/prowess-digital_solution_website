import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminOrCron } from "@/lib/auth/verifyAdmin";
import { fetchGenericOpportunityRss } from "@/lib/opportunities/importers/genericOpportunityRss";
import { runOpportunityImportForSource } from "@/lib/opportunities/runImport";
import type { NormalizedOpportunity } from "@/lib/opportunities/importers/types";

const CONNECTORS: Record<string, (feedUrl: string) => Promise<NormalizedOpportunity[]>> = {
  generic_rss_opportunity: fetchGenericOpportunityRss,
};

export async function POST(req: NextRequest) {
  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const requestedSlug = typeof body?.sourceSlug === "string" ? body.sourceSlug : null;

  const db = supabaseAdmin();

  let query = db.from("job_sources").select("id, slug, name, connector, feed_url, default_type_slug, active, auto_publish, import_frequency_minutes, last_imported_at").eq("source_type", "external");
  query = requestedSlug ? query.eq("slug", requestedSlug) : query.eq("active", true);
  const { data: sources, error: sourcesError } = await query;
  if (sourcesError) return NextResponse.json({ error: sourcesError.message }, { status: 500 });

  const results: Record<string, unknown>[] = [];

  for (const source of sources || []) {
    const connector = source.connector ? CONNECTORS[source.connector] : null;
    // Sources whose connector isn't in this route's map belong to the jobs
    // importer instead (job_sources is shared between both) - silently
    // skipped here rather than reported as an error.
    if (!connector) continue;

    if (!requestedSlug && source.last_imported_at) {
      const dueAt = new Date(source.last_imported_at).getTime() + source.import_frequency_minutes * 60_000;
      if (Date.now() < dueAt) continue;
    }

    if (!source.feed_url) {
      results.push({ source: source.slug, error: "Source is missing a feed URL." });
      continue;
    }

    try {
      const listings = await connector(source.feed_url);
      const summary = await runOpportunityImportForSource(db, source, listings);
      await db.from("job_sources").update({
        last_imported_at: new Date().toISOString(),
        last_import_error: null,
        last_import_count: summary.imported,
      }).eq("id", source.id);
      results.push({ source: source.slug, ...summary });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Import failed.";
      await db.from("job_sources").update({ last_imported_at: new Date().toISOString(), last_import_error: message }).eq("id", source.id);
      results.push({ source: source.slug, error: message });
    }
  }

  return NextResponse.json({ results });
}
