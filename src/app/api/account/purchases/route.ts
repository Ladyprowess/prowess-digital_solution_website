import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";

export const runtime = "nodejs";

const ITEM_TABLE: Record<string, string> = {
  resource: "resources",
  course: "courses",
  career_path: "career_paths",
};

// Returns the signed-in member's own purchase history with item titles/
// slugs joined in. purchases has no client-readable RLS policy, so this has
// to go through a server route that verifies who's asking first.
export async function GET(req: Request) {
  const member = await verifyMember(req);
  if (!member) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const { data: purchases, error } = await supabase
    .from("purchases")
    .select("id, item_type, item_id, amount, currency, payment_status, created_at")
    .or(`user_id.eq.${member.id},email.eq.${member.email}`)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const items = await Promise.all(
    (purchases || []).map(async (p) => {
      const table = ITEM_TABLE[p.item_type];
      const { data: item } = table
        ? await supabase.from(table).select("title, slug").eq("id", p.item_id).maybeSingle()
        : { data: null };
      return { ...p, title: item?.title || "Unknown item", slug: item?.slug || null };
    })
  );

  return NextResponse.json({ ok: true, items });
}
