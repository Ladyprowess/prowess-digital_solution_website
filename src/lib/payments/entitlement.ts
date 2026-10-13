import { supabaseAdmin } from "@/lib/supabase/admin";
import { withBonusReadAccess, type EbookFormat } from "@/lib/resources/ebookFormats";

const ITEM_TABLE: Record<string, string> = {
  resource: "resources",
  course: "courses",
  career_path: "career_paths",
};

/**
 * The one place "does this person get to see this?" gets decided for
 * premium content. Free items are always entitled. Premium items require a
 * paid purchase matching the caller's user_id or verified email - never a
 * client-supplied claim. Used by every route that serves a protected
 * content body (course lesson content, resource content/file/external
 * links), so entitlement logic can't drift between call sites.
 */
export async function hasEntitlement(
  itemType: "resource" | "course" | "career_path",
  itemId: string,
  caller: { userId?: string | null; email?: string | null }
): Promise<{ entitled: boolean; reason: "free" | "purchased" | "premium_no_access" | "not_found" }> {
  const table = ITEM_TABLE[itemType];
  const supabase = supabaseAdmin();

  const { data: item } = await supabase.from(table).select("access").eq("id", itemId).maybeSingle();
  if (!item) return { entitled: false, reason: "not_found" };
  if (item.access !== "premium") return { entitled: true, reason: "free" };

  if (!caller.userId && !caller.email) return { entitled: false, reason: "premium_no_access" };

  let query = supabase
    .from("purchases")
    .select("id")
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .eq("payment_status", "paid")
    .limit(1);

  if (caller.userId && caller.email) {
    query = query.or(`user_id.eq.${caller.userId},email.eq.${JSON.stringify(caller.email)}`);
  } else if (caller.userId) {
    query = query.eq("user_id", caller.userId);
  } else if (caller.email) {
    query = query.eq("email", caller.email);
  }

  const { data: purchase } = await query.maybeSingle();
  return purchase ? { entitled: true, reason: "purchased" } : { entitled: false, reason: "premium_no_access" };
}

/**
 * Which ebook formats (read/download/hardcopy) a caller has actually paid
 * for on a given resource - separate from hasEntitlement's plain boolean,
 * since a format-priced ebook grants access per-format, not all-or-nothing.
 * Same user_id/email matching as hasEntitlement, just grouped by the
 * `format` column instead of collapsed into one yes/no. Buying more than
 * one format over time returns the union of all of them, and buying
 * "download" or "hardcopy" also bundles in "read" (withBonusReadAccess) -
 * confirmed directly: only buying "read" alone stays exclusive to just that.
 */
export async function getPurchasedFormats(
  resourceId: string,
  caller: { userId?: string | null; email?: string | null }
): Promise<Set<EbookFormat>> {
  if (!caller.userId && !caller.email) return new Set();

  const supabase = supabaseAdmin();
  let query = supabase
    .from("purchases")
    .select("format")
    .eq("item_type", "resource")
    .eq("item_id", resourceId)
    .eq("payment_status", "paid")
    .not("format", "is", null);

  if (caller.userId && caller.email) {
    query = query.or(`user_id.eq.${caller.userId},email.eq.${JSON.stringify(caller.email)}`);
  } else if (caller.userId) {
    query = query.eq("user_id", caller.userId);
  } else if (caller.email) {
    query = query.eq("email", caller.email);
  }

  const { data } = await query;
  const purchasedFormats: EbookFormat[] = [];
  for (const row of data || []) {
    if (row.format === "read" || row.format === "download" || row.format === "hardcopy") purchasedFormats.push(row.format);
  }
  return new Set(withBonusReadAccess(purchasedFormats));
}
