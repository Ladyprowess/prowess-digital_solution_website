import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  // date/time (not start_datetime) is what the admin form actually writes
  // (confirmed in /api/events/create) - start_datetime is never populated,
  // reading it alone produced new Date(null) -> Jan 1 1970 on this page.
  const { data, error } = await supabase
    .from("events")
    .select("id,title,slug,description,type,date,time,duration,location,cover_url,registration_type,price_usd,price_ngn,status")
    .eq("slug", slug)
    .eq("status", "published")
    .limit(1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Always the real, live count of actual event_registrations rows - no
  // manual override anywhere, this is meant to grow automatically as real
  // people register.
  const { count } = await supabase
    .from("event_registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", data.id);

  return NextResponse.json({ event: { ...data, registration_count: count || 0 } });
}
