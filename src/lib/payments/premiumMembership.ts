import { reconcileRecurring } from "@/lib/payments/recurring";
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
 * Paid access lasts through paid_through, even after cancellation. Existing
 * CVs remain separately grandfathered by the CV routes, not this check
 * itself. Do not fold that check into this function - it would silently
 * revoke existing members' work the moment a renewal fails.
 */
export async function hasPremiumAccess(caller: { userId?: string | null; email?: string | null }): Promise<boolean> {
  if (!caller.userId && !caller.email) return false;

  const supabase = supabaseAdmin();
  let query = supabase
    .from("premium_membership_subscriptions")
    .select("id, paid_through, subscription_status")
    .eq("payment_status", "paid");

  if (caller.userId && caller.email) {
    query = query.or(`user_id.eq.${caller.userId},email.eq.${JSON.stringify(caller.email)}`);
  } else if (caller.userId) {
    query = query.eq("user_id", caller.userId);
  } else if (caller.email) {
    query = query.eq("email", caller.email);
  }

  const { data } = await query;
  return Boolean(data?.some(row => row.paid_through ? Date.parse(row.paid_through) > Date.now() : row.subscription_status === "active"));
}

/**
 * Marks a Premium Membership subscription paid - the first charge or any
 * later renewal. Idempotent, safe to call from both the Flutterwave
 * webhook and the client-side verify route (whichever fires first wins).
 *
 * Charge identity, ordering and paid access are reconciled atomically in the database.
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
  // Store only a subscription identity returned by verified provider data.
  const providerId = verified.subscription_id ?? (verified.subscription as { id?: unknown } | undefined)?.id;
  if (typeof providerId === "string" || typeof providerId === "number") {
    const { error } = await supabase.from("premium_membership_subscriptions")
      .update({ flutterwave_subscription_id: String(providerId) }).eq("id", sub.id);
    if (error) throw new Error("Subscription identity could not be saved");
  }
  const transition = await reconcileRecurring("premium_membership", sub.id, "paid", reference, verified.created_at);
  if (!transition.initial) return { ok: true as const, alreadyPaid: true };

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
           <a href="https://www.prowessdigitalsolutions.com/tools/cv-builder">prowessdigitalsolutions.com/tools/cv-builder</a> to use them.</p>
        <p>You can manage your membership any time from your account's Membership page.</p>
        <p>Payment reference: ${reference}</p>
      </div>
    `,
  }).catch(() => {});

  return { ok: true as const, alreadyPaid: false };
}

/**
 * Records renewal failure once, preserving access through the paid period.
 */
export async function markPremiumMembershipRenewalFailed(subscriptionId: string, reference: string, occurredAt: string) {
  const supabase = supabaseAdmin();

  const { data: sub, error } = await supabase
    .from("premium_membership_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (error || !sub) return { ok: false as const };
  const transition = await reconcileRecurring("premium_membership", sub.id, "failed", reference, occurredAt);
  if (!transition.changed) return { ok: true as const };

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
 * Stops renewal while preserving the paid period and previously created CVs.
 */
export async function markPremiumMembershipCancelled(subscriptionId: string) {
  const supabase = supabaseAdmin();

  const { data: sub, error } = await supabase
    .from("premium_membership_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (error || !sub) return { ok: false as const };
  if (sub.payment_status === "paid" && !sub.paid_through && sub.subscription_status !== "cancelled") {
    if (!sub.flutterwave_reference) return { ok: false as const };
    const recovered = await markPremiumMembershipPaid(sub.id, sub.flutterwave_reference);
    if (!recovered.ok) return { ok: false as const };
  }
  const transition = await reconcileRecurring("premium_membership", sub.id, "cancelled");
  if (!transition.changed) return { ok: true as const };

  const fromEmail = process.env.RESEND_FROM_EMAIL!;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;

  await resend.emails.send({
    from: fromEmail,
    to: sub.email,
    subject: "Your Premium Membership renewal has stopped",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Your Premium Membership renewal has stopped</h2>
        <p>Renewal has stopped. Your Premium access remains available until the end of the paid period. Any CVs you already built keep working exactly as they are - after the paid period ends, creating new premium-template CVs or saving additional CVs requires an active membership.</p>
        <p>You can restart any time from <a href="https://www.prowessdigitalsolutions.com/account/membership">your account's Membership page</a>.</p>
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
