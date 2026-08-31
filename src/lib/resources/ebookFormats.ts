// Zero side-effect imports (no supabase/resend clients) - safe to import
// from both server code (entitlement.ts, the purchases API route) and
// client components (EbookPurchasePicker, ResourceBody), unlike
// content.ts/entitlement.ts which pull in service-role clients.
export type EbookFormat = "read" | "download" | "hardcopy";

// Which resource_type values get the ebook treatment: mockup images, the
// Read Online/Download/Hard Copy pricing picker, and format-gated access.
// Kept as one shared list (not repeated `=== "ebook"` checks scattered
// across the admin form, ResourceBody, ChecklistBody, getItemPrice, and the
// access route) so a decision like "checklists get this too" only has to be
// made once, here, to take effect everywhere. Every other resource_type
// (article, video, external_course, business_guide, podcast) keeps today's
// single-price behavior untouched.
export const FORMAT_PRICEABLE_TYPES = ["ebook", "guide", "template", "checklist"] as const;
export type FormatPriceableType = (typeof FORMAT_PRICEABLE_TYPES)[number];

export function isFormatPriceableType(resourceType: string | null | undefined): boolean {
  return (FORMAT_PRICEABLE_TYPES as readonly string[]).includes(resourceType || "");
}

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
