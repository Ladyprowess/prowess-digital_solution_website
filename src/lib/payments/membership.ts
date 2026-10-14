import { reconcileRecurring } from "@/lib/payments/recurring";
import { escapeEmail } from "@/lib/payments/emailEscape";
import { matchesPayment } from "@/lib/payments/validation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resendClient";
import { toolsForPlan, PREMIUM_TOOL_NAMES } from "@/lib/tools/tierAccess";
import { verifyTransaction } from "@/lib/payments/flutterwave";
import { formatMoney } from "@/lib/formatMoney";

/**
 * Marks a membership subscription paid and sends both confirmation emails.
 * Idempotent (guarded by the payment_status update condition) so it's safe
 * to call from both the Flutterwave webhook and the client-side verify route -
 * whichever fires first wins, the second is a no-op.
 */
export async function markMembershipPaid(subscriptionId: string, reference: string) {
  const supabase = supabaseAdmin();

  const { data: sub, error: subErr } = await supabase
    .from("membership_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (subErr || !sub) return { ok: false as const };
  if (sub.subscription_status === "cancelled" && sub.payment_status !== "paid") return { ok: false as const };

  // Never trust that the currency the client checked out with is what was
  // actually charged - re-verify the real transaction and require both the
  // amount and the currency to match what the server computed at checkout
  // time (stored on this row) before doing anything else. Checked before
  // the "already paid" branch below so this applies to every recurring
  // renewal charge too, not just the initial one.
  const verified = await verifyTransaction(reference);
  const expectedAmount = sub.currency === "NGN" ? sub.amount_ngn : sub.amount_usd;
  if (!matchesPayment(verified, { reference, type: "membership", idKey: "subscription_id", id: sub.id,
    amount: expectedAmount, currency: sub.currency || "USD", email: sub.email,
    storedReference: sub.payment_status === "paid" ? null : sub.flutterwave_reference })) {
    return { ok: false as const };
  }

  const transition = await reconcileRecurring("membership", sub.id, "paid", reference, verified.created_at, toolsForPlan(sub.plan_slug));
  if (!transition.initial) return { ok: true as const, alreadyPaid: true };
  const unlockedTools = toolsForPlan(sub.plan_slug);
  const accessCode = transition.code!;

  const fromEmail = process.env.RESEND_FROM_EMAIL!;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL!;
  const planTitle = String(sub.plan_slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  // Auto-issue a tools access code scoped to exactly what this tier includes,
  // so the client can get into their tools immediately rather than waiting
  // on a manual admin step.

  const toolsList = unlockedTools.length
    ? unlockedTools.map((t) => `<li>${PREMIUM_TOOL_NAMES[t]}</li>`).join("")
    : "<li>No premium tools are included on this tier.</li>";

  await resend.emails.send({
    from: fromEmail,
    to: sub.email,
    subject: `Your ${planTitle} membership is confirmed`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>You're in - thank you, ${escapeEmail(sub.full_name)}.</h2>
        <p>Your <b>${planTitle}</b> membership payment has been received (billed ${sub.billing_interval}).</p>
        <p>Here is what happens next: we have your business details and what you would like us to focus on
           (${escapeEmail(sub.service_focus)}), and we will reach out to you directly within 24 hours to get started.</p>
        <p>Your tools access is ready right now. Your access code is:</p>
        <p style="font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 1px;">${accessCode}</p>
        <p>This code unlocks:</p>
        <ul>${toolsList}</ul>
        <p>Enter it at <a href="https://prowessdigitalsolutions.com/tools">prowessdigitalsolutions.com/tools</a> to get started.</p>
        <p>Payment reference: ${reference}</p>
      </div>
    `,
  });

  await resend.emails.send({
    from: fromEmail,
    to: adminEmail,
    subject: `New paid membership: ${planTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>New ${planTitle} membership (${sub.billing_interval})</h2>
        <p><b>Name:</b> ${escapeEmail(sub.full_name)}</p>
        <p><b>Email:</b> ${escapeEmail(sub.email)}</p>
        <p><b>Phone:</b> ${escapeEmail(sub.phone || "-")}</p>
        <p><b>Business:</b> ${escapeEmail(sub.business_name)}</p>
        <p><b>Website:</b> ${escapeEmail(sub.website || "-")}</p>
        <p><b>What their business does:</b> ${escapeEmail(sub.business_description)}</p>
        <p><b>What they want us to focus on:</b> ${escapeEmail(sub.service_focus)}</p>
        <p><b>Amount:</b> ${formatMoney(expectedAmount, (sub.currency as "USD" | "NGN") || "USD")} (${sub.billing_interval})</p>
        <p><b>Ref:</b> ${reference}</p>
        <p><b>Tools access code auto-issued:</b> ${accessCode} (${unlockedTools.join(", ") || "no tools on this tier"})</p>
        <p style="color:#b45309;"><b>Reminder: reach out within 24 hours.</b></p>
      </div>
    `,
  });

  return { ok: true as const, alreadyPaid: false };
}

/**
 * Records renewal failure once while preserving purchased tool access.
 */
export async function markMembershipRenewalFailed(subscriptionId: string, reference: string, occurredAt: string) {
  const supabase = supabaseAdmin();

  const { data: sub, error } = await supabase
    .from("membership_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (error || !sub) return { ok: false as const };
  const transition = await reconcileRecurring("membership", sub.id, "failed", reference, occurredAt);
  if (!transition.changed) return { ok: true as const };

  const fromEmail = process.env.RESEND_FROM_EMAIL!;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL!;

  await resend.emails.send({
    from: fromEmail,
    to: adminEmail,
    subject: `Renewal payment failed: ${sub.full_name} (${sub.plan_slug})`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>A membership renewal charge failed</h2>
        <p><b>Name:</b> ${escapeEmail(sub.full_name)} · <b>Email:</b> ${escapeEmail(sub.email)}</p>
        <p><b>Plan:</b> ${sub.plan_slug} (${sub.billing_interval})</p>
        <p>Flutterwave will retry automatically. If it fails 3 times, the subscription is cancelled and you'll get a separate notice.</p>
      </div>
    `,
  });

  return { ok: true as const };
}

/**
 * Stops renewal, retaining tool access through the existing paid expiry.
 */
export async function markMembershipCancelled(subscriptionId: string) {
  const supabase = supabaseAdmin();

  const { data: sub, error } = await supabase
    .from("membership_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (error || !sub) return { ok: false as const };
  if (sub.payment_status === "paid" && !sub.paid_through && sub.subscription_status !== "cancelled") {
    if (!sub.flutterwave_reference) return { ok: false as const };
    const recovered = await markMembershipPaid(sub.id, sub.flutterwave_reference);
    if (!recovered.ok) return { ok: false as const };
  }
  const transition = await reconcileRecurring("membership", sub.id, "cancelled");
  if (!transition.changed) return { ok: true as const };

  const fromEmail = process.env.RESEND_FROM_EMAIL!;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL!;

  await resend.emails.send({
    from: fromEmail,
    to: sub.email,
    subject: "Your membership has been cancelled",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Your ${sub.plan_slug} membership has ended</h2>
        <p>Renewal has been cancelled. Access already paid for remains available until its expiry date.</p>
        <p>You can restart anytime from <a href="https://prowessdigitalsolutions.com/pricing">prowessdigitalsolutions.com/pricing</a>.</p>
      </div>
    `,
  });

  await resend.emails.send({
    from: fromEmail,
    to: adminEmail,
    subject: `Membership cancelled: ${sub.full_name} (${sub.plan_slug})`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Membership cancelled</h2>
        <p><b>Name:</b> ${escapeEmail(sub.full_name)} · <b>Email:</b> ${escapeEmail(sub.email)}</p>
        <p><b>Plan:</b> ${sub.plan_slug} (${sub.billing_interval})</p>
        <p>Renewal has stopped. Existing paid access expires at the end of its paid period.</p>
      </div>
    `,
  });

  return { ok: true as const };
}
