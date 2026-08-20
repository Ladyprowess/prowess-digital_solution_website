import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const supabase = supabaseAdmin();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const status = searchParams.get("status");
    const search = (searchParams.get("q") || "").trim();

    let query = supabase
      .from("consultation_bookings")
      .select("id,full_name,email,phone,scheduled_date,scheduled_time,timezone,payment_status,paystack_reference,flutterwave_reference,created_at,service_id", { count: "exact" });
    if (status) query = query.eq("payment_status", status);
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

    const from = (page - 1) * PAGE_SIZE;
    const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    // Stats respect the current search term (not just the current page),
    // same reasoning as the purchases admin page's revenue total - but
    // always count every status regardless of the status filter, since
    // "how many are paid" wouldn't mean anything if paid were the active
    // filter.
    function statsQuery(status_: string | null) {
      let q = supabase.from("consultation_bookings").select("id", { count: "exact", head: true });
      if (status_) q = q.eq("payment_status", status_);
      if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      return q;
    }
    const [totalRes, paidRes, pendingRes] = await Promise.all([
      statsQuery(null),
      statsQuery("paid"),
      statsQuery("pending"),
    ]);

    return NextResponse.json({
      ok: true,
      items: data || [],
      total: count || 0,
      stats: { total: totalRes.count || 0, paid: paidRes.count || 0, pending: pendingRes.count || 0 },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}