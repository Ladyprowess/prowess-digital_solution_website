import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resendClient";

const ITEM_TABLE: Record<string, string> = {
  resource: "resources",
  course: "courses",
  career_path: "career_paths",
};

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
  const itemTitle = item?.title || "your purchase";

  await resend.emails.send({
    from: fromEmail,
    to: purchase.email,
    subject: `You now have access - ${itemTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Payment received</h2>
        <p>Thanks for your purchase of <b>${itemTitle}</b> on Prowess Digital Solutions.</p>
        <p>You now have full access. Payment reference: ${reference}</p>
      </div>
    `,
  }).catch(() => {});

  return { ok: true as const, alreadyPaid: false, itemType: purchase.item_type as string, itemSlug: item?.slug as string | undefined };
}

/**
 * Reads the current price of a premium item directly from its own table -
 * the amount charged is never taken from the client. Returns null if the
 * item doesn't exist, isn't premium, or has no price set.
 */
export async function getItemPrice(itemType: string, itemId: string) {
  const table = ITEM_TABLE[itemType];
  if (!table) return null;

  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from(table)
    .select("title, access, price, price_currency")
    .eq("id", itemId)
    .maybeSingle();

  if (!data || data.access !== "premium" || !data.price) return null;
  return { title: data.title as string, amount: data.price as number, currency: (data.price_currency as string) || "NGN" };
}
