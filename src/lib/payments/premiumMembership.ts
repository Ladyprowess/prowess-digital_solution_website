import { escapeEmail } from "@/lib/payments/emailEscape";
import { matchesPayment } from "@/lib/payments/validation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resendClient";
import { verifyTransaction } from "@/lib/payments/flutterwave";
import { formatMoney } from "@/lib/formatMoney";

/**
 * The one platform-level "is this member premium right now" check. Every
 * feature that gates on Premium Membership (CV Builder's extra templates
 * and multi-CV saving today, future tools later) calls this - nothing
 * outside this file ever queries premium_membership_subscriptions directly,
 * so a future entitlement source (a trial, grandfathered access, a promo
 * code) only ever changes in this one function.
 *
 * Answers "can this member start something new premium right now" only -
 * it does NOT gate access to premium content a member already created.
 * `lapsed`/`cancelled` both return false here even though a lapsed/
 * cancelled member's existing premium-templated CVs must stay fully
 * viewable/editable/downloadable - that grandfathering is enforced by the
 * CV Builder's own save/pdf routes checking "does this row already have
 * this template" BEFORE ever calling this function, not by this function
 * itself. Do not fold that check into this function - it would silently
 * revoke existing members' work the moment a renewal fails.
 */
export async function hasPremiumAccess(caller: { userId?: string | null; email?: string | null }): Promise<boolean> {
  if (!caller.userId && !caller.email) return false;

  const supabase = supabaseAdmin();
  let query = supabase
    .from("premium_membership_subscriptions")
    .select("id")
    .eq("subscription_status", "active")
    .eq("payment_status", "paid")
    .limit(1);

  if (caller.userId && caller.email) {
    query = query.or(`user_id.eq.${caller.userId},email.eq.${JSON.stringify(caller.email)}`);
  } else if (caller.userId) {
    query = query.eq("user_id", caller.userId);
  } else if (caller.email) {
    query = query.eq("email", caller.email);
  }

  const { data } = await query.maybeSingle();
  return Boolean(data);
}

/**
 * Marks a Premium Membership subscription paid - the first charge or any
 * later renewal. Idempotent, safe to call from both the Flutterwave
 * webhook and the client-side verify route (whichever fires first wins).
 *
 * Reference-level idempotency (not just "already paid_status='paid'"):
 * each renewal reuses this same function with a brand new reference every
 * billing cycle, so the plain "already paid" guard alone would let a
 * duplicate webhook delivery of the SAME renewal event re-process (and
 * re-send a confirmation email) a second time. Checking the stored
 * flutterwave_reference against the incoming one first is what actually
 * catches that.
 */
export async function markPremiumMembershipPaid(subscriptionId: string, reference: string) {
  const supabase = supabaseAdmin();

  const { data: sub, error: subErr } = await supabase
    .from("premium_membership_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (subErr || !sub) return { ok: false as const };
  if (sub.subscription_status === "cancelled" && sub.payment_status !== "paid") return { ok: false as const };

  // Never trust that the currency the client checked out with is what was
  // actually charged - re-verify the real transaction and require both the
  // amount and the currency to match what the server computed at checkout
  // time (stored on this row), before doing anything else. Checked before
  // the idempotency branches below so this applies to every renewal charge
  // too, not just the initial one.
  const verified = await verifyTransaction(reference);
  const expectedAmount = sub.currency === "NGN" ? sub.amount_ngn : sub.amount_usd;
  if (!matchesPayment(verified, { reference, type: "premium_membership", idKey: "subscription_id", id: sub.id,
    amount: expectedAmount, currency: sub.currency || "USD", email: sub.email,
    storedReference: sub.payment_status === "paid" ? null : sub.flutterwave_reference })) {
    return { ok: false as const };
  }

  // This exact charge was already processed (a duplicate webhook delivery,
  // or the webhook and the client verify call both fired) - no-op.
  if (sub.payment_status === "paid" && sub.flutterwave_reference === reference) {
    return { ok: true as const, alreadyPaid: true };
  }

  // Flutterwave's subscription-resource id isn't confirmed against a real
  // test-mode payload yet (see the schema file's comment on this column) -
  // captured defensively under a couple of likely field names, and simply
  // stays null if neither is present. Confirm the real field name against
  // an actual webhook payload and adjust here if needed.
  const verifiedAny = verified as Record<string, unknown> | undefined;
  const flwSubscriptionId =
    (verifiedAny?.subscription_id as string | number | undefined) ??
    (verifiedAny?.subscription as { id?: string | number } | undefined)?.id ??
    null;

  if (sub.payment_status === "paid" && (sub.subscription_status === "cancelled" ||
    (sub.lapsed_at && (!verified.created_at || new Date(verified.created_at).getTime() <= new Date(sub.lapsed_at).getTime())))) {
    return { ok: true as const, alreadyPaid: true };
  }
  if (sub.payment_status === "paid") {
    // A renewal charge on an already-paid subscription. Only touch the
    // fields that represent "is this subscription currently in good
    // standing" - never amount_usd/amount_ngn/currency, which represent the
    // price at signup, not something a renewal charge should be able to
    // drift.
    const updates: Record<string, unknown> = { flutterwave_reference: reference };
    if (flwSubscriptionId != null) updates.flutterwave_subscription_id = String(flwSubscriptionId);
    if (sub.subscription_status === "lapsed") {
      updates.subscription_status = "active";
      updates.lapsed_at = null;
    }
    const { error: renewalError } = await supabase.from("premium_membership_subscriptions").update(updates).eq("id", sub.id).neq("subscription_status", "cancelled");
    if (renewalError) return { ok: false as const };
    return { ok: true as const, alreadyPaid: true };
  }

  const { data: updatedRows, error: updErr } = await supabase
    .from("premium_membership_subscriptions")
    .update({
      payment_status: "paid",
      subscription_status: "active",
      flutterwave_reference: reference,
      ...(flwSubscriptionId != null ? { flutterwave_subscription_id: String(flwSubscriptionId) } : {}),
    })
    .eq("id", sub.id)
    .neq("payment_status", "paid")
    .neq("subscription_status", "cancelled")
    .select("id");

  if (updErr) return { ok: false as const };
  if (!updatedRows || updatedRows.length === 0) {
    // Another concurrent call already won the race and marked it paid.
    return { ok: true as const, alreadyPaid: true };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL!;
  const planTitle = "Premium Membership";
  const amountLabel = formatMoney(Number(expectedAmount), (sub.currency as "USD" | "NGN") || "USD");

  await resend.emails.send({
    from: fromEmail,
    to: sub.email,
    subject: `Your ${planTitle} is confirmed`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>You're in${sub.full_name ? `, ${escapeEmail(sub.full_name)}` : ""}.</h2>
        <p>Your <b>${planTitle}</b> payment has been received (billed ${sub.billing_interval}, ${amountLabel}).</p>
        <p>Every premium CV template and unlimited saved CVs are unlocked on your account now - head to
           <a href="https://prowessdigitalsolutions.com/tools/cv-builder">prowessdigitalsolutions.com/tools/cv-builder</a> to use them.</p>
        <p>You can manage your membership any time from your account's Membership page.</p>
        <p>Payment reference: ${reference}</p>
      </div>
    `,
  }).catch(() => {});

  return { ok: true as const, alreadyPaid: false };
}

/**
 * A recurring renewal charge failed (Flutterwave will retry up to 3 times
 * before giving up). Flags the subscription as lapsed and notifies the
 * admin - does not touch payment_status (the historical "has this member
 * ever paid" fact stays intact) or any amount/currency field. Access to
 * premium-created content is NOT revoked here or anywhere else while
 * lapsed - only hasPremiumAccess() flips to false, which blocks new
 * premium actions, not existing ones (see that function's own doc comment).
 */
export async function markPremiumMembershipRenewalFailed(subscriptionId: string) {
  const supabase = supabaseAdmin();

  const { data: sub, error } = await supabase
    .from("premium_membership_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (error || !sub) return { ok: false as const };
  if (sub.payment_status !== "paid" || sub.subscription_status !== "active") return { ok: true as const };

  const { data: changed, error: updateError } = await supabase
    .from("premium_membership_subscriptions")
    .update({ subscription_status: "lapsed", lapsed_at: new Date().toISOString() })
    .eq("id", sub.id).eq("subscription_status", "active").eq("payment_status", "paid").select("id");
  if (updateError) return { ok: false as const };
  if (!changed?.length) return { ok: true as const };

  const fromEmail = process.env.RESEND_FROM_EMAIL!;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (adminEmail) {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `Premium Membership renewal failed: ${sub.email}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>A Premium Membership renewal charge failed</h2>
          <p><b>Email:</b> ${escapeEmail(sub.email)} · <b>Billing:</b> ${sub.billing_interval}</p>
          <p>Flutterwave will retry automatically. If it fails 3 times, the subscription is cancelled and you'll get a separate notice.</p>
        </div>
      `,
    }).catch(() => {});
  }

  return { ok: true as const };
}

/**
 * Flutterwave has given up on a subscription (user-cancelled, or
 * auto-cancelled after 3 failed renewal attempts). Cancellation is
 * immediate - access to NEW premium actions ends the moment this fires, not
 * deferred to the end of an already-paid period (matches the existing B2B
 * markMembershipCancelled behavior already live in this codebase). Existing
 * premium-templated CVs remain fully accessible - this function only
 * changes subscription_status, it never touches member_cvs.
 */
export async function markPremiumMembershipCancelled(subscriptionId: string) {
  const supabase = supabaseAdmin();

  const { data: sub, error } = await supabase
    .from("premium_membership_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (error || !sub) return { ok: false as const };
  if (sub.subscription_status === "cancelled") return { ok: true as const };

  const { error: updateError } = await supabase
    .from("premium_membership_subscriptions")
    .update({ subscription_status: "cancelled", lapsed_at: sub.lapsed_at || new Date().toISOString() })
    .eq("id", sub.id);
  if (updateError) return { ok: false as const };

  const fromEmail = process.env.RESEND_FROM_EMAIL!;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;

  await resend.emails.send({
    from: fromEmail,
    to: sub.email,
    subject: "Your Premium Membership has ended",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Your Premium Membership has ended</h2>
        <p>Your subscription has ended, so Premium access has been switched off. Any CVs you already built keep working exactly as they are - you just won't be able to create new premium-template CVs or save additional CVs until you resubscribe.</p>
        <p>You can restart any time from <a href="https://prowessdigitalsolutions.com/account/membership">your account's Membership page</a>.</p>
      </div>
    `,
  }).catch(() => {});

  if (adminEmail) {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `Premium Membership cancelled: ${sub.email}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Premium Membership cancelled</h2>
          <p><b>Email:</b> ${escapeEmail(sub.email)} · <b>Billing:</b> ${sub.billing_interval}</p>
        </div>
      `,
    }).catch(() => {});
  }

  return { ok: true as const };
}
