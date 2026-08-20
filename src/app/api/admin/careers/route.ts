import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminOrCron } from "@/lib/auth/verifyAdmin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAGE_SIZE = 20;

// GET - list all roles (published + draft), for the admin list view.
// The existing GET on /api/careers/roles stays public/published-only for
// the consumer careers page - this is a separate, admin-gated endpoint so
// that contract never changes.
export async function GET(req: NextRequest) {
  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const status = searchParams.get("status"); // "published" | "draft" | null (all)
  const search = (searchParams.get("q") || "").trim();

  let query = supabase.from("careers_roles").select("*", { count: "exact" });
  if (status === "published") query = query.eq("is_published", true);
  if (status === "draft") query = query.eq("is_published", false);
  if (search) query = query.ilike("title", `%${search}%`);

  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [], total: count ?? 0 });
}

// PATCH - update a role (full edit, or just the is_published toggle)
export async function PATCH(req: NextRequest) {
  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = body?.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  for (const key of ["title", "location", "job_type", "level", "summary", "responsibilities", "requirements", "apply_url", "is_published"]) {
    if (key in (body || {})) updates[key] = body[key];
  }

  const { data, error } = await supabase.from("careers_roles").update(updates).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

// DELETE - remove a role
export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("careers_roles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
