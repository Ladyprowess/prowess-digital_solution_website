import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resendClient";
import { verifyTransaction } from "@/lib/payments/flutterwave";

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://prowessdigitalsolutions.com";

// Every email client that matters here (Gmail, Outlook, Apple Mail) has
// wildly inconsistent CSS support - no flexbox/grid, no CSS custom
// properties, iffy border-radius in Outlook. Tables + inline styles are the
// only layout that reliably renders the same everywhere, unlike the modern
// CSS the design mockup used for previewing this on the web.
function orderConfirmationEmailHtml(params: {
  itemTitle: string;
  itemTypeLabel: string;
  itemUrl: string;
  amount: number;
  currency: string;
  reference: string;
  dateLabel: string;
}): string {
  const { itemTitle, itemTypeLabel, itemUrl, amount, currency, reference, dateLabel } = params;
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
                <p style="margin:0 0 2px;font-size:14.5px;font-weight:700;color:#0b1b1d;">${itemTitle}</p>
                <p style="margin:0;font-size:12px;color:#4b6062;">${itemTypeLabel}</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f2f6f6;padding:14px 18px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="font-size:12px;color:#4b6062;padding:5px 0;">Order number</td><td style="font-size:13px;font-weight:600;color:#0b1b1d;text-align:right;font-family:ui-monospace,Menlo,Consolas,monospace;">${reference}</td></tr>
                  <tr><td style="font-size:12px;color:#4b6062;padding:5px 0;">Date</td><td style="font-size:13px;font-weight:600;color:#0b1b1d;text-align:right;">${dateLabel}</td></tr>
                  <tr><td style="font-size:12px;color:#4b6062;padding:5px 0;">Amount paid</td><td style="font-size:14px;font-weight:700;color:#3d5f62;text-align:right;">${currency} ${amount.toLocaleString()}</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:12px 28px 8px;">
          <a href="${itemUrl}" style="display:inline-block;background:#507c80;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 30px;border-radius:8px;">Read your ${itemTypeLabel.toLowerCase()}</a>
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
}): string {
  const { itemTitle, buyerEmail, amount, currency, reference } = params;
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;padding:8px;">
    <h2 style="margin:0 0 12px;font-size:16px;color:#0b1b1d;">New sale</h2>
    <p style="margin:0 0 14px;font-size:14px;color:#4b6062;">Someone just bought a resource.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="border:1px solid #dde6e6;border-radius:10px;background:#f2f6f6;padding:4px 18px;width:100%;max-width:460px;">
      <tr><td style="font-size:13px;color:#4b6062;padding:9px 0;">Item</td><td style="font-size:13px;font-weight:700;text-align:right;">${itemTitle}</td></tr>
      <tr><td style="font-size:13px;color:#4b6062;padding:9px 0;border-top:1px solid #dde6e6;">Buyer email</td><td style="font-size:13px;font-weight:700;text-align:right;border-top:1px solid #dde6e6;">${buyerEmail}</td></tr>
      <tr><td style="font-size:13px;color:#4b6062;padding:9px 0;border-top:1px solid #dde6e6;">Amount</td><td style="font-size:13px;font-weight:700;text-align:right;border-top:1px solid #dde6e6;">${currency} ${amount.toLocaleString()}</td></tr>
      <tr><td style="font-size:13px;color:#4b6062;padding:9px 0;border-top:1px solid #dde6e6;">Order number</td><td style="font-size:13px;font-weight:700;text-align:right;border-top:1px solid #dde6e6;">${reference}</td></tr>
    </table>
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
  if (purchase.payment_status === "paid") return { ok: true as const, alreadyPaid: true };

  // Never trust that the currency the client checked out with is what
  // Flutterwave actually charged - re-verify the real transaction and
  // require both the amount and the currency to match what the server
  // computed at checkout time (stored on this row), before marking paid.
  const verified = await verifyTransaction(reference);
  const amountMatches = Math.round(Number(verified?.amount || 0) * 100) === Math.round(Number(purchase.amount) * 100);
  const currencyMatches = String(verified?.currency || "").toUpperCase() === String(purchase.currency).toUpperCase();
  if (verified?.status !== "successful" || !amountMatches || !currencyMatches) {
    return { ok: false as const };
  }

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

  const fromEmail = process.env.RESEND_FROM_EMAIL!;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  const itemTitle = item?.title || "your purchase";
  const itemTypeLabel = ITEM_TYPE_LABELS[purchase.item_type] || "Item";
  const itemUrl = item?.slug ? `${SITE_URL}/${ITEM_URL_PATHS[purchase.item_type] || "resources"}/${item.slug}` : SITE_URL;
  const dateLabel = new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  await resend.emails.send({
    from: fromEmail,
    to: purchase.email,
    subject: `Payment confirmed for ${itemTitle}`,
    html: orderConfirmationEmailHtml({
      itemTitle,
      itemTypeLabel,
      itemUrl,
      amount: purchase.amount,
      currency: purchase.currency,
      reference,
      dateLabel,
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
      }),
    }).catch(() => {});
  }

  return { ok: true as const, alreadyPaid: false, itemType: purchase.item_type as string, itemSlug: item?.slug as string | undefined };
}

/**
 * Reads the current price of a premium item directly from its own table -
 * the amount charged is never taken from the client. Returns both
 * currencies' prices (either can be null if the admin only set one, or if
 * this item was priced under the old single price/price_currency columns
 * and never updated) so the caller can validate whichever currency the
 * customer actually chose. Returns null if the item doesn't exist, isn't
 * premium, or has no price set in either currency.
 */
export async function getItemPrice(itemType: string, itemId: string) {
  const table = ITEM_TABLE[itemType];
  if (!table) return null;

  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from(table)
    .select("title, access, price_usd, price_ngn, price, price_currency")
    .eq("id", itemId)
    .maybeSingle();

  if (!data || data.access !== "premium") return null;
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
  return { title: data.title as string, usd, ngn };
}
