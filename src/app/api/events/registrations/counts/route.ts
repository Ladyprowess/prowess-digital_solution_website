import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// The admin events list already reads from this endpoint (fetch wrapped in
// a .catch(() => null), so it silently showed 0 for every event until this
// route existed). Supabase JS has no server-side GROUP BY, so this pulls
// every event_id once and tallies in memory - fine at this table's size.
export async function GET() {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase.from("event_registrations").select("event_id");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.event_id] = (counts[row.event_id] || 0) + 1;
  }

  return NextResponse.json({ ok: true, counts });
}
