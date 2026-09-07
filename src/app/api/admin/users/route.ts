import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminOrCron } from "@/lib/auth/verifyAdmin";

const PAGE_SIZE = 20;
// The Supabase admin API has no server-side "search by email" - it only
// pages through auth.users in order. A search that only looked at the
// current page would silently miss anyone not on it, so a search instead
// pulls this many users into memory and filters there. Fine at the sizes
// this platform is at; would need a real users table (synced via a trigger)
// to search properly past the tens-of-thousands mark.
const SEARCH_SCAN_LIMIT = 2000;

// Member accounts live in Supabase Auth (auth.users), which PostgREST never
// exposes - listing them at all requires the service role's
// auth.admin.listUsers(), so this can't be a plain client-side RLS query
// like the other admin pages. member_profiles/purchases are merged in here
// so the page doesn't need three separate round trips per row.
export async function GET(req: NextRequest) {
  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const search = (searchParams.get("q") || "").trim().toLowerCase();

  const db = supabaseAdmin();

  type AuthUser = Awaited<ReturnType<typeof db.auth.admin.listUsers>>["data"]["users"][number];
  let authUsers: AuthUser[];
  let total: number | null;

  if (search) {
    // Scan in the API's own max page size (1000) until the scan limit,
    // since listUsers doesn't take an arbitrary perPage.
    const scanned: AuthUser[] = [];
    for (let p = 1; scanned.length < SEARCH_SCAN_LIMIT; p++) {
      const { data, error } = await db.auth.admin.listUsers({ page: p, perPage: 1000 });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      scanned.push(...data.users);
      if (data.users.length < 1000) break;
    }

    // Name lives in member_profiles, not auth.users, so it has to be
    // fetched for the whole scanned set before search can match on it too.
    const { data: scannedProfiles } = await db
      .from("member_profiles")
      .select("id, full_name")
      .in("id", scanned.map((u) => u.id));
    const nameById = new Map((scannedProfiles || []).map((p) => [p.id, p.full_name || ""]));

    const matches = scanned.filter(
      (u) => u.email?.toLowerCase().includes(search) || nameById.get(u.id)?.toLowerCase().includes(search)
    );
    total = matches.length;
    authUsers = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  } else {
    const { data: authList, error: authError } = await db.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
    authUsers = authList.users;
    total = authList.total ?? null;
  }

  const userIds = authUsers.map((u) => u.id);

  const [{ data: profiles }, { data: purchases }] = await Promise.all([
    db.from("member_profiles").select("id, full_name, headline").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    db.from("purchases").select("user_id, amount, currency, payment_status").in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const profileById = new Map((profiles || []).map((p) => [p.id, p]));
  // Spend is tracked per currency. Adding a $10 sale to a N15,000 one gives
  // a number that means nothing, and it used to be printed with a naira
  // sign on top of that. Rows predating the dual-currency rollout carry no
  // currency; those were naira.
  const purchaseStatsById = new Map<string, { count: number; spent: Record<string, number> }>();
  for (const p of purchases || []) {
    if (!p.user_id || p.payment_status !== "paid") continue;
    const existing = purchaseStatsById.get(p.user_id) || { count: 0, spent: {} };
    existing.count += 1;
    const code = ((p.currency as string | null) || "NGN").toUpperCase();
    existing.spent[code] = (existing.spent[code] || 0) + Number(p.amount || 0);
    purchaseStatsById.set(p.user_id, existing);
  }

  const users = authUsers.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    banned: !!u.banned_until,
    full_name: profileById.get(u.id)?.full_name || null,
    headline: profileById.get(u.id)?.headline || null,
    purchase_count: purchaseStatsById.get(u.id)?.count || 0,
    spent_by_currency: purchaseStatsById.get(u.id)?.spent || {},
  }));

  return NextResponse.json({ users, page, perPage: PAGE_SIZE, total });
}
