import { NextResponse } from "next/server";
import { verifyMember } from "@/lib/auth/verifyMember";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const statuses = ["saved", "applied", "interviewing", "rejected", "offer", "withdrawn"];

export async function GET(req: Request) {
  const member = await verifyMember(req);
  if (!member) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const { data, error } = await supabaseAdmin().from("applications")
    .select("id,item_type,job_id,opportunity_id,title,organisation_name,apply_url,status,applied_at,notes,created_at,updated_at,jobs(slug,title,companies(name)),opportunities(slug,title,organisation_name)")
    .eq("user_id", member.id).order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  const items = (data || []).map((row) => {
    const jobRel = row.jobs as unknown as { slug?: string; title?: string; companies?: { name?: string } | { name?: string }[] } | null;
    const oppRel = row.opportunities as unknown as { slug?: string; title?: string; organisation_name?: string } | null;
    const company = jobRel?.companies ? (Array.isArray(jobRel.companies) ? jobRel.companies[0]?.name : jobRel.companies.name) : null;
    const isOpportunity = row.item_type === "opportunity";
    return { ...row, title: row.title || (isOpportunity ? oppRel?.title : jobRel?.title) || "Closed listing", organisation_name: row.organisation_name || (isOpportunity ? oppRel?.organisation_name : company) || null, href: isOpportunity ? (oppRel?.slug ? `/opportunities/${oppRel.slug}` : null) : (jobRel?.slug ? `/jobs/${jobRel.slug}` : null), jobs: undefined, opportunities: undefined };
  });
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const member = await verifyMember(req);
  if (!member) return NextResponse.json({ ok: false, error: "Sign in to save this application in My Account." }, { status: 401 });
  const body = await req.json(); const itemType = body.itemType === "opportunity" ? "opportunity" : "job"; const itemId = String(body.itemId || "");
  if (!itemId) return NextResponse.json({ ok: false, error: "Missing listing" }, { status: 400 });
  const row = { user_id: member.id, item_type: itemType, job_id: itemType === "job" ? itemId : null, opportunity_id: itemType === "opportunity" ? itemId : null, title: String(body.title || "").trim() || null, organisation_name: String(body.organisationName || "").trim() || null, apply_url: String(body.applyUrl || "").trim() || null, status: "applied", applied_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const db = supabaseAdmin(); const key = itemType === "job" ? "job_id" : "opportunity_id";
  const { data: existing, error: lookupError } = await db.from("applications").select("id").eq("user_id", member.id).eq(key, itemId).maybeSingle();
  if (lookupError) return NextResponse.json({ ok: false, error: lookupError.message }, { status: 500 });
  const result = existing ? await db.from("applications").update(row).eq("id", existing.id).select("id").single() : await db.from("applications").insert(row).select("id").single();
  const { data, error } = result;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(req: Request) {
  const member = await verifyMember(req); if (!member) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const body = await req.json(); if (!statuses.includes(body.status)) return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
  const { error } = await supabaseAdmin().from("applications").update({ status: body.status, notes: typeof body.notes === "string" ? body.notes : undefined, updated_at: new Date().toISOString() }).eq("id", body.id).eq("user_id", member.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 }); return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const member = await verifyMember(req); if (!member) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id"); if (!id) return NextResponse.json({ ok: false, error: "Missing application" }, { status: 400 });
  const { error } = await supabaseAdmin().from("applications").delete().eq("id", id).eq("user_id", member.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 }); return NextResponse.json({ ok: true });
}
