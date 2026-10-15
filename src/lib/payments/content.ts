import { escapeEmail } from "@/lib/payments/emailEscape";
import { matchesPayment } from "@/lib/payments/validation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resendClient";
import { verifyTransaction } from "@/lib/payments/flutterwave";
import { isFormatPriceableType } from "@/lib/resources/ebookFormats";

const ITEM_TABLE: Record<string, string> = {
  resource: "resources",
  course: "courses",
  career_path: "career_paths",
};

const ITEM_TYPE_LABELS: Record<string, string> = {
  resource: "Resource",
  course: "Course",
  career_path: "Career Path",
};

const ITEM_URL_PATHS: Record<string, string> = {
  resource: "resources",
  course: "learn",
  career_path: "career-paths",
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.prowessdigitalsolutions.com";

// Every email client that matters here (Gmail, Outlook, Apple Mail) has
// wildly inconsistent CSS support - no flexbox/grid, no CSS custom
// properties, iffy border-radius in Outlook. Tables + inline styles are the
// only layout that reliably renders the same everywhere, unlike the modern
// CSS the design mockup used for previewing this on the web.
const FORMAT_TITLE_SUFFIXES: Record<string, string> = {
  read: " (Read Online)",
  download: " (Download)",
  hardcopy: " (Hard Copy)",
};

// Plain labels (no parentheses) for the customer email's type line - the
// format used to be appended straight onto the item title there, which
// read as clutter next to the product name. Kept as a small separate line
// under the title instead. adminSaleNotificationHtml and the email subject
// still use the parenthetical form - the request was specifically about
// what appears "by the side of the name" in the customer's copy.
const FORMAT_LABELS: Record<string, string> = {
  read: "Read Online",
  download: "Download",
  hardcopy: "Hard Copy",
};

function orderConfirmationEmailHtml(params: {
  itemTitle: string;
  itemTypeLabel: string;
  itemUrl: string;
  amount: number;
  currency: string;
  reference: string;
  dateLabel: string;
  // Ebook-only: one mockup image (a genuinely public URL - see
  // resource-mockups bucket, chosen specifically so it still loads
  // whenever the recipient opens this email, not just right after
  // purchase), shown as the product photo on the order line itself -
  // like a normal online order summary (photo, name, price together),
  // not a strip tacked on separately. format/shippingAddress adjust the
  // copy for which specific purchase this was.
  mockupUrls?: string[];
  format?: string | null;
  shippingAddress?: string | null;
}): string {
  const { itemTitle, itemTypeLabel, itemUrl, amount, currency, reference, dateLabel, mockupUrls, format, shippingAddress } = params;
  const typeLine = format ? `${itemTypeLabel} · ${FORMAT_LABELS[format] || format}` : itemTypeLabel;
  const ctaLabel = format === "hardcopy" ? "View order" : `Read your ${itemTypeLabel.toLowerCase()}`;
  const mockupUrl = mockupUrls && mockupUrls[0];

  const itemImageCell = mockupUrl
    ? `<td style="width:64px;padding-right:14px;vertical-align:top;">
        <img src="${escapeEmail(mockupUrl)}" width="64" height="85" style="width:64px;height:85px;object-fit:cover;border-radius:8px;border:1px solid #dde6e6;display:block;" alt="" />
      </td>`
    : "";

  const shippingRow = format === "hardcopy" && shippingAddress
    ? `<tr><td style="padding:0 28px 20px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#0b1b1d;">Shipping to</p>
        <p style="margin:0;font-size:13px;line-height:1.5;color:#4b6062;">${escapeEmail(shippingAddress)}</p>
      </td></tr>`
    : "";

  return `
  <div style="background:#fafcfc;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dde6e6;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="background:#507c80;padding:26px 28px;">
          <span style="color:#ffffff;font-size:15px;font-weight:700;">Prowess Digital Solutions</span>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 28px 8px;">
          <span style="display:inline-block;background:#e7eeee;color:#3d5f62;font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;margin-bottom:18px;">&#10003; Payment confirmed</span>
          <h2 style="margin:0 0 14px;font-size:19px;font-weight:700;color:#0b1b1d;">Hi there,</h2>
          <p style="margin:0 0 20px;font-size:14.5px;line-height:1.65;color:#4b6062;">Your payment has gone through. Here is a summary of your order.</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dde6e6;border-radius:10px;overflow:hidden;margin-bottom:8px;">
            <tr>
              <td style="padding:16px 18px;border-bottom:1px solid #dde6e6;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    ${itemImageCell}
                    <td style="vertical-align:top;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align:top;">
                            <p style="margin:0 0 2px;font-size:14.5px;font-weight:700;color:#0b1b1d;">${escapeEmail(itemTitle)}</p>
                            <p style="margin:0;font-size:12px;color:#4b6062;">${escapeEmail(typeLine)}</p>
                          </td>
                          <td style="vertical-align:top;text-align:right;white-space:nowrap;">
                            <p style="margin:0;font-size:14px;font-weight:700;color:#3d5f62;">${currency} ${amount.toLocaleString()}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#f2f6f6;padding:14px 18px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="font-size:12px;color:#4b6062;padding:5px 0;">Order number</td><td style="font-size:13px;font-weight:600;color:#0b1b1d;text-align:right;font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeEmail(reference)}</td></tr>
                  <tr><td style="font-size:12px;color:#4b6062;padding:5px 0;">Date</td><td style="font-size:13px;font-weight:600;color:#0b1b1d;text-align:right;">${escapeEmail(dateLabel)}</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${shippingRow}
      <tr>
        <td align="center" style="padding:12px 28px 8px;">
          ${format === "hardcopy"
            ? `<p style="margin:0;font-size:13.5px;line-height:1.6;color:#4b6062;">Your physical copy is being prepared. We&rsquo;ll contact you regarding delivery.</p>`
            : `<a href="${escapeEmail(itemUrl)}" style="display:inline-block;background:#507c80;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 30px;border-radius:8px;">${ctaLabel}</a>`}
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px 26px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#4b6062;">Need help with this order? Reply to this email and mention the order number above.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 28px;border-top:1px solid #dde6e6;text-align:center;">
          <p style="margin:0;font-size:11.5px;color:#4b6062;">Prowess Digital Solutions &middot; prowessdigitalsolutions.com</p>
        </td>
      </tr>
    </table>
  </div>`;
}

function adminSaleNotificationHtml(params: {
  itemTitle: string;
  buyerEmail: string;
  amount: number;
  currency: string;
  reference: string;
  format?: string | null;
  shippingFullName?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: string | null;
}): string {
  const { itemTitle, buyerEmail, amount, currency, reference, format, shippingFullName, shippingPhone, shippingAddress } = params;
  const displayTitle = format ? `${itemTitle}${FORMAT_TITLE_SUFFIXES[format] || ""}` : itemTitle;

  const shippingBlock = format === "hardcopy"
    ? `<h3 style="margin:16px 0 8px;font-size:14px;color:#0b1b1d;">Ship to</h3>
       <table role="presentation" cellpadding="0" cellspacing="0" style="border:1px solid #dde6e6;border-radius:10px;background:#f2f6f6;padding:4px 18px;width:100%;max-width:460px;">
         <tr><td style="font-size:13px;color:#4b6062;padding:9px 0;">Name</td><td style="font-size:13px;font-weight:700;text-align:right;">${escapeEmail(shippingFullName || "-")}</td></tr>
         <tr><td style="font-size:13px;color:#4b6062;padding:9px 0;border-top:1px solid #dde6e6;">Phone</td><td style="font-size:13px;font-weight:700;text-align:right;border-top:1px solid #dde6e6;">${escapeEmail(shippingPhone || "-")}</td></tr>
         <tr><td style="font-size:13px;color:#4b6062;padding:9px 0;border-top:1px solid #dde6e6;">Address</td><td style="font-size:13px;font-weight:700;text-align:right;border-top:1px solid #dde6e6;">${escapeEmail(shippingAddress || "-")}</td></tr>
       </table>`
    : "";

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;padding:8px;">
    <h2 style="margin:0 0 12px;font-size:16px;color:#0b1b1d;">New sale</h2>
    <p style="margin:0 0 14px;font-size:14px;color:#4b6062;">Someone just bought a resource.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="border:1px solid #dde6e6;border-radius:10px;background:#f2f6f6;padding:4px 18px;width:100%;max-width:460px;">
      <tr><td style="font-size:13px;color:#4b6062;padding:9px 0;">Item</td><td style="font-size:13px;font-weight:700;text-align:right;">${escapeEmail(displayTitle)}</td></tr>
      <tr><td style="font-size:13px;color:#4b6062;padding:9px 0;border-top:1px solid #dde6e6;">Buyer email</td><td style="font-size:13px;font-weight:700;text-align:right;border-top:1px solid #dde6e6;">${escapeEmail(buyerEmail)}</td></tr>
      <tr><td style="font-size:13px;color:#4b6062;padding:9px 0;border-top:1px solid #dde6e6;">Amount</td><td style="font-size:13px;font-weight:700;text-align:right;border-top:1px solid #dde6e6;">${currency} ${amount.toLocaleString()}</td></tr>
      <tr><td style="font-size:13px;color:#4b6062;padding:9px 0;border-top:1px solid #dde6e6;">Order number</td><td style="font-size:13px;font-weight:700;text-align:right;border-top:1px solid #dde6e6;">${escapeEmail(reference)}</td></tr>
    </table>
    ${shippingBlock}
  </div>`;
}

/**
 * Marks a premium-content purchase paid and grants access. Idempotent, safe
 * to call from both the webhook and the client-side verify route -
 * whichever fires first wins, the second is a no-op. Same pattern as
 * markSkillToBusinessPaid.
 */
export async function markContentPurchasePaid(purchaseId: string, reference: string) {
  const supabase = supabaseAdmin();

  const { data: purchase, error: purchaseErr } = await supabase
    .from("purchases")
    .select("*")
    .eq("id", purchaseId)
    .single();

  if (purchaseErr || !purchase) return { ok: false as const };

  // Never trust that the currency the client checked out with is what
  // Flutterwave actually charged - re-verify the real transaction and
  // require both the amount and the currency to match what the server
  // computed at checkout time (stored on this row), before marking paid.
  const verified = await verifyTransaction(reference);
  if (!matchesPayment(verified, { reference, type: "content_purchase", idKey: "purchase_id", id: purchase.id,
    amount: purchase.amount, currency: purchase.currency || "USD", email: purchase.email,
    storedReference: purchase.flutterwave_reference })) {
    return { ok: false as const };
  }

  if (purchase.payment_status === "paid") return { ok: true as const, alreadyPaid: true };

  // The initial select above is not atomic with this update: the webhook
  // and the client-side verify route can both read "pending" before either
  // write lands, and both would pass the check above. .neq("payment_status",
  // "paid") means at most one of the two concurrent updates actually
  // changes a row - but without .select() here there's no way to tell
  // which one that was, so a naive "no error = success" check would let
  // both callers proceed and send two confirmation emails. Checking the
  // returned row count is what actually makes this idempotent under a race,
  // not just under sequential calls.
  const { data: updatedRows, error: updErr } = await supabase
    .from("purchases")
    .update({ payment_status: "paid", flutterwave_reference: reference })
    .eq("id", purchase.id)
    .neq("payment_status", "paid")
    .select("id");

  if (updErr) return { ok: false as const };
  if (!updatedRows || updatedRows.length === 0) {
    // Another concurrent call already won the race and marked it paid.
    return { ok: true as const, alreadyPaid: true };
  }

  const table = ITEM_TABLE[purchase.item_type];
  const { data: item } = table
    ? await supabase.from(table).select("title, slug").eq("id", purchase.item_id).maybeSingle()
    : { data: null };

  // Mockup image for the confirmation email - resource-only, and only
  // meaningful when this was a format-priced ebook purchase (purchase.format
  // set). Just the first one (by admin-set order), not the whole gallery -
  // genuinely public URL (resource-mockups bucket), so it still loads
  // whenever the recipient actually opens this email.
  let mockupUrls: string[] = [];
  if (purchase.item_type === "resource" && purchase.format) {
    const { data: mockups } = await supabase
      .from("resource_mockups")
      .select("url, position")
      .eq("resource_id", purchase.item_id)
      .order("position")
      .limit(1);
    mockupUrls = (mockups || []).map((m) => m.url);
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL!;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  const itemTitle = item?.title || "your purchase";
  const itemTypeLabel = ITEM_TYPE_LABELS[purchase.item_type] || "Item";
  const itemUrl = item?.slug ? `${SITE_URL}/${ITEM_URL_PATHS[purchase.item_type] || "resources"}/${item.slug}` : SITE_URL;
  const dateLabel = new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  await resend.emails.send({
    from: fromEmail,
    to: purchase.email,
    subject: purchase.format ? `You're ready: ${itemTitle}${FORMAT_TITLE_SUFFIXES[purchase.format] || ""}` : `Payment confirmed for ${itemTitle}`,
    html: orderConfirmationEmailHtml({
      itemTitle,
      itemTypeLabel,
      itemUrl,
      amount: purchase.amount,
      currency: purchase.currency,
      reference,
      dateLabel,
      mockupUrls,
      format: purchase.format,
      shippingAddress: purchase.shipping_address,
    }),
  }).catch(() => {});

  // Same admin-notification pattern as markSkillToBusinessPaid/membership -
  // every other paid flow already tells the admin about a new sale, this
  // one didn't yet.
  if (adminEmail) {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `New sale: ${itemTitle}`,
      html: adminSaleNotificationHtml({
        itemTitle,
        buyerEmail: purchase.email,
        amount: purchase.amount,
        currency: purchase.currency,
        reference,
        format: purchase.format,
        shippingFullName: purchase.shipping_full_name,
        shippingPhone: purchase.shipping_phone,
        shippingAddress: purchase.shipping_address,
      }),
    }).catch(() => {});
  }

  return { ok: true as const, alreadyPaid: false, itemType: purchase.item_type as string, itemSlug: item?.slug as string | undefined };
}

export type FormatPrice = { usd: number | null; ngn: number | null };
export type EbookFormatPrices = { read: FormatPrice; download: FormatPrice; hardcopy: FormatPrice };

/**
 * Reads the current price of a premium item directly from its own table -
 * the amount charged is never taken from the client. Returns both
 * currencies' prices (either can be null if the admin only set one, or if
 * this item was priced under the old single price/price_currency columns
 * and never updated) so the caller can validate whichever currency the
 * customer actually chose. Returns null if the item doesn't exist, isn't
 * premium, or has no price set anywhere (plain or per-format).
 *
 * Ebook format pricing is a hard switch, not a fallback: once a resource
 * has any of its six price_read/price_download/price_hardcopy_* columns
 * set, `usd`/`ngn` come back null for it regardless of what the plain
 * price_usd/price_ngn columns still hold, and `formats` carries the real
 * prices instead. This is what stops an item from ever having two live
 * purchasing models (generic + format) at once - the checkout route below
 * requires a `format` whenever `formats` is present, with nothing to fall
 * back to.
 */
export async function getItemPrice(itemType: string, itemId: string) {
  const table = ITEM_TABLE[itemType];
  if (!table) return null;

  const supabase = supabaseAdmin();
  const isResource = itemType === "resource";

  let data: { title: string; access: string; price_usd: number | null; price_ngn: number | null; price: number | null; price_currency: string | null } | null = null;
  let formats: EbookFormatPrices | null = null;

  if (isResource) {
    const { data: resourceData } = await supabase
      .from(table)
      .select("title, access, price_usd, price_ngn, price, price_currency, resource_type, price_read_usd, price_read_ngn, price_download_usd, price_download_ngn, price_hardcopy_usd, price_hardcopy_ngn")
      .eq("id", itemId).eq("status", "published")
      .maybeSingle();
    data = resourceData;

    if (resourceData && isFormatPriceableType(resourceData.resource_type)) {
      const candidate: EbookFormatPrices = {
        read: { usd: resourceData.price_read_usd, ngn: resourceData.price_read_ngn },
        download: { usd: resourceData.price_download_usd, ngn: resourceData.price_download_ngn },
        hardcopy: { usd: resourceData.price_hardcopy_usd, ngn: resourceData.price_hardcopy_ngn },
      };
      const hasAnyFormatPrice = Object.values(candidate).some((p) => p.usd != null || p.ngn != null);
      if (hasAnyFormatPrice) formats = candidate;
    }
  } else {
    const { data: otherData } = await supabase
      .from(table)
      .select("title, access, price_usd, price_ngn, price, price_currency")
      .eq("id", itemId).eq("status", "published")
      .maybeSingle();
    data = otherData;
  }

  if (!data || data.access !== "premium") return null;

  if (formats) {
    return { title: data.title, usd: null, ngn: null, formats };
  }

  let usd = typeof data.price_usd === "number" ? data.price_usd : null;
  let ngn = typeof data.price_ngn === "number" ? data.price_ngn : null;

  // Legacy fallback: an item priced before the dual-currency columns
  // existed only has the old single price/price_currency pair set - keep
  // it purchasable exactly as before until an admin fills in the new
  // fields, rather than silently making it unbuyable.
  if (usd == null && ngn == null && typeof data.price === "number") {
    if (data.price_currency === "NGN") ngn = data.price;
    else usd = data.price;
  }

  if (usd == null && ngn == null) return null;
  return { title: data.title as string, usd, ngn, formats: null as EbookFormatPrices | null };
}
