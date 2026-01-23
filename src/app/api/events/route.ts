import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || "").trim();
    const type = (searchParams.get("type") || "All").trim();
    const month = (searchParams.get("month") || "All").trim();
    const scope = (searchParams.get("scope") || "upcoming").trim(); // upcoming | past | all
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);

    const today = new Date();
    const todayISO = today.toISOString().slice(0, 10); // YYYY-MM-DD

    let query = supabase
      .from("events")
      .select("*")
      .eq("is_published", true);

    // Scope filter
    if (scope === "upcoming") query = query.gte("date", todayISO);
    if (scope === "past") query = query.lt("date", todayISO);

    // Ordering
    query = scope === "past"
      ? query.order("date", { ascending: false })
      : query.order("date", { ascending: true });

    if (type !== "All") query = query.eq("type", type);
    if (q) query = query.ilike("title", `%${q}%`);

    const { data, error } = await query.limit(limit);
    if (error) throw error;

    // Month filter (optional)
    let items = data || [];
    if (month !== "All") {
      const m = Number(month);
      items = items.filter((e: any) => {
        const d = new Date(e.date);
        return d.getUTCMonth() + 1 === m;
      });
    }

    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load events" },
      { status: 500 }
    );
  }
}
