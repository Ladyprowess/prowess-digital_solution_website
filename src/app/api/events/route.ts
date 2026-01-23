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

    const scope = searchParams.get("scope") || "upcoming";
    const limit = Number(searchParams.get("limit") || 6);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const type = searchParams.get("type");
    const month = searchParams.get("month");
    const q = searchParams.get("q");

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("events")
      .select("*")
      .order("date", { ascending: scope === "upcoming" })
      .range(from, to);

    // Upcoming vs Past
    const today = new Date().toISOString().slice(0, 10);

    if (scope === "upcoming") {
      query = query.gte("date", today);
    } else {
      query = query.lt("date", today);
    }

    if (type) {
      query = query.eq("type", type);
    }

    if (month && month !== "All") {
      query = query.eq("month", month);
    }

    if (q) {
      query = query.ilike("title", `%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("EVENTS API ERROR:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, items: data ?? [] });
  } catch (err: any) {
    console.error("EVENTS API CRASH:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
