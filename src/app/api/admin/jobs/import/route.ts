import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminOrCron } from "@/lib/auth/verifyAdmin";
import { fetchRemoteOkListings } from "@/lib/jobs/importers/remoteok";
import { fetchRemoteFirstJobsListings } from "@/lib/jobs/importers/remoteFirstJobs";
import { fetchHimalayasListings } from "@/lib/jobs/importers/himalayas";
import { fetchWeWorkRemotelyListings } from "@/lib/jobs/importers/weWorkRemotely";
import { fetchArbeitnowListings } from "@/lib/jobs/importers/arbeitnow";
import { fetchRemotiveListings } from "@/lib/jobs/importers/remotive";
import { fetchJobicyListings } from "@/lib/jobs/importers/jobicy";
import { fetchGreenhouseListings } from "@/lib/jobs/importers/greenhouse";
import { fetchLeverListings } from "@/lib/jobs/importers/lever";
import { runImportForSource } from "@/lib/jobs/runImport";
import type { NormalizedListing } from "@/lib/jobs/importers/types";

// Connectors keyed by job_sources.connector. Each source's raw shape (JSON
// API, RSS, whatever) is different enough that "just point it at a URL"
// isn't real - adding a new source means adding one function here that
// returns NormalizedListing[], same as fetchRemoteOkListings.
const CONNECTORS: Record<string, (feedUrl: string) => Promise<NormalizedListing[]>> = {
  remoteok: fetchRemoteOkListings,
  remotefirstjobs: fetchRemoteFirstJobsListings,
  himalayas: fetchHimalayasListings,
  weworkremotely: fetchWeWorkRemotelyListings,
  arbeitnow: fetchArbeitnowListings,
  remotive: fetchRemotiveListings,
  jobicy: fetchJobicyListings,
  greenhouse: fetchGreenhouseListings,
  lever: fetchLeverListings,
};

export async function POST(req: NextRequest) {
  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const requestedSlug = typeof body?.sourceSlug === "string" ? body.sourceSlug : null;

  const db = supabaseAdmin();

  let query = db.from("job_sources").select("id, slug, name, connector, feed_url, default_category_slug, default_type_slug, active, auto_publish, import_frequency_minutes, last_imported_at").eq("source_type", "external");
  query = requestedSlug ? query.eq("slug", requestedSlug) : query.eq("active", true);
  const { data: sources, error: sourcesError } = await query;
  if (sourcesError) return NextResponse.json({ error: sourcesError.message }, { status: 500 });

  const results: Record<string, unknown>[] = [];

  for (const source of sources || []) {
    // Manual "Import now" (requestedSlug set) always runs. The unattended
    // cron sweep (requestedSlug null) only runs a source if its
    // import_frequency_minutes has actually elapsed, so a 1-hour source
    // hit by a 5-minute cron doesn't refetch every 5 minutes.
    if (!requestedSlug && source.last_imported_at) {
      const dueAt = new Date(source.last_imported_at).getTime() + source.import_frequency_minutes * 60_000;
      if (Date.now() < dueAt) continue;
    }

    const connector = source.connector ? CONNECTORS[source.connector] : null;
    // Sources whose connector isn't in this route's map belong to the
    // opportunities importer instead (job_sources is shared between both) -
    // silently skipped here rather than reported as an error.
    if (!connector) continue;

    if (!source.feed_url) {
      results.push({ source: source.slug, error: "Source is missing a feed URL." });
      continue;
    }

    try {
      const listings = await connector(source.feed_url);
      const summary = await runImportForSource(db, source, listings);
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
