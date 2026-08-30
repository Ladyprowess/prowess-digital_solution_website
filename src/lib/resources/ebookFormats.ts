// Zero side-effect imports (no supabase/resend clients) - safe to import
// from both server code (entitlement.ts, the purchases API route) and
// client components (EbookPurchasePicker, ResourceBody), unlike
// content.ts/entitlement.ts which pull in service-role clients.
export type EbookFormat = "read" | "download" | "hardcopy";

/**
 * Buying "download" or "hardcopy" also grants read-online access as a
 * bonus - only buying "read" alone stays exclusive to just that. Applied
 * everywhere purchased-format data is used (entitlement checks, the
 * resource page, the customer's library) so the rule can't drift between
 * call sites.
 */
export function withBonusReadAccess(formats: EbookFormat[]): EbookFormat[] {
  const set = new Set(formats);
  if (set.has("download") || set.has("hardcopy")) set.add("read");
  return Array.from(set);
}
