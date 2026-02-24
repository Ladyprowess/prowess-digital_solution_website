import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function toISODateOnly(input: string) {
  return input ? input.slice(0, 10) : "";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const scope = searchParams.get("scope") || "upcoming";
    const limit = Number(searchParams.get("limit") || 6);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const type = searchParams.get("type"); // "Webinar" | "Workshop" | etc
    const month = searchParams.get("month"); // "1".."12" or "All"
    const q = searchParams.get("q");

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const todayISO = new Date().toISOString().slice(0, 10);

    // ✅ IMPORTANT: select ONLY columns that exist in your table
    let query = supabase
      .from("events")
      .select(
        "id,title,type,description,date,time,duration,location,price,spots_left,cover_url,registration_url,slug,start_datetime,registration_type,price_ngn,status,created_at"
      )
      .eq("status", "published")
      .range(from, to);

    // Sorting
    if (scope === "upcoming") {
      query = query.order("start_datetime", { ascending: true, nullsFirst: false });
      query = query.order("date", { ascending: true });
    } else {
      query = query.order("start_datetime", { ascending: false, nullsFirst: false });
      query = query.order("date", { ascending: false });
    }

    // Upcoming vs Past (use date column because you have it)
    if (scope === "upcoming") {
      query = query.gte("date", todayISO);
    } else {
      query = query.lt("date", todayISO);
    }

    // Type filter
    if (type && type !== "All") {
      query = query.eq("type", type);
    }

    // Search
    if (q && q.trim()) {
      query = query.ilike("title", `%${q.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("EVENTS API ERROR:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Normalise + Month filter (done in code so you don't need a "month" DB column)
    let items =
      (data || []).map((e: any) => {
        const start = e.start_datetime || null;

        const date = e.date
          ? String(e.date)
          : start
            ? toISODateOnly(String(start))
            : "";

        const price =
          typeof e.price === "number"
            ? e.price
            : typeof e.price_ngn === "number"
              ? e.price_ngn
              : null;

        // ✅ ONLY use registration_url (no external_registration_link)
        const registration_url = e.registration_url || null;

        return {
          ...e,
          date,
          price,
          registration_url,
          slug: e.slug || null,
          start_datetime: start,
          registration_type: e.registration_type || null,
          price_ngn: typeof e.price_ngn === "number" ? e.price_ngn : null,
        };
      }) ?? [];

    // ✅ Month filter here (if user selected a month)
    if (month && month !== "All") {
      const monthNum = Number(month);
      items = items.filter((ev: any) => {
        if (!ev.date) return false;
        const d = new Date(ev.date);
        return d.getMonth() + 1 === monthNum;
      });
    }

    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error("EVENTS API CRASH:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}