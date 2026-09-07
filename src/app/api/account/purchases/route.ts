import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { signDownloadUrl } from "@/lib/resourceDownload";
import { withBonusReadAccess, type EbookFormat } from "@/lib/resources/ebookFormats";

export const runtime = "nodejs";

const ITEM_TABLE: Record<string, string> = {
  resource: "resources",
  course: "courses",
  career_path: "career_paths",
};

// Returns the signed-in member's own purchase history with item titles/
// slugs joined in, grouped one row per item (not per purchase) - someone
// can buy more than one format of the same ebook over time, and the
// "My Purchases" list should show that as one item with the combined set
// of formats, not duplicate rows. purchases has no client-readable RLS
// policy, so this has to go through a server route that verifies who's
// asking first.
export async function GET(req: Request) {
  const member = await verifyMember(req);
  if (!member) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const { data: purchases, error } = await supabase
    .from("purchases")
    .select("id, item_type, item_id, amount, currency, format, payment_status, created_at")
    .or(`user_id.eq.${member.id},email.eq.${member.email}`)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  type Grouped = {
    id: string; item_type: string; item_id: string; amount: number; currency: string;
    created_at: string; formats: EbookFormat[]; title: string; slug: string | null; download_url: string | null;
  };
  const byKey = new Map<string, Grouped>();

  for (const p of purchases || []) {
    const key = `${p.item_type}:${p.item_id}`;
    const existing = byKey.get(key);
    if (existing) {
      if (p.format === "read" || p.format === "download" || p.format === "hardcopy") existing.formats.push(p.format);
      // Keep the most recent row's id/amount/currency/created_at as the
      // representative one for this grouped item - the format list is what
      // actually matters once grouped, not which specific purchase "wins".
      continue;
    }
    byKey.set(key, {
      id: p.id, item_type: p.item_type, item_id: p.item_id, amount: p.amount, currency: p.currency,
      created_at: p.created_at, formats: p.format ? [p.format as EbookFormat] : [], title: "Unknown item", slug: null, download_url: null,
    });
  }

  const items = await Promise.all(
    Array.from(byKey.values()).map(async (grouped) => {
      const table = ITEM_TABLE[grouped.item_type];
      const { data: item } = table
        ? await supabase.from(table).select("title, slug").eq("id", grouped.item_id).maybeSingle()
        : { data: null };

      const formats = withBonusReadAccess(grouped.formats);
      const download_url = formats.includes("download") ? signDownloadUrl(grouped.item_id, member.email) : null;

      return { ...grouped, title: item?.title || "Unknown item", slug: item?.slug || null, formats, download_url };
    })
  );

  // Totalled from the raw paid rows, not from `items`. Grouping keeps only
  // the most recent row's amount per item, so somebody who bought the read
  // format and later the download would have had the first payment dropped
  // from any total computed off the grouped list.
  //
  // Per currency, never added together - a $10 purchase and a N15,000 one
  // are two separate figures, and no exchange rate exists anywhere here to
  // honestly turn them into one.
  const spent: Record<string, number> = {};
  for (const p of purchases || []) {
    const code = ((p.currency as string | null) || "NGN").toUpperCase();
    spent[code] = (spent[code] || 0) + Number(p.amount || 0);
  }

  return NextResponse.json({ ok: true, items, spent, purchaseCount: (purchases || []).length });
}
