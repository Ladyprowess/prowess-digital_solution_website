import { escapeEmail } from "@/lib/payments/emailEscape";
import { ensureToolGrant } from "@/lib/payments/toolGrant";
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

  if (sub.payment_status === "paid" && (sub.subscription_status === "cancelled" ||
    (sub.lapsed_at && (!verified.created_at || new Date(verified.created_at).getTime() <= new Date(sub.lapsed_at).getTime())))) {
    return { ok: true as const, alreadyPaid: true };
  }
  if (sub.payment_status === "paid") {
    // A renewal charge on an already-paid subscription - the access code
    // from the first charge is still valid, so don't re-send emails or
    // re-issue a code. But DO clear a stale "lapsed" flag if a prior
    // renewal failed and this one recovered before Flutterwave cancelled
    // the subscription outright.
    if (sub.subscription_status === "lapsed") {
      const { error: renewalError } = await supabase
        .from("membership_subscriptions")
        .update({ subscription_status: "active", lapsed_at: null, flutterwave_reference: reference })
        .eq("id", sub.id).eq("subscription_status", "lapsed");
      if (renewalError) return { ok: false as const };
    }
    return { ok: true as const, alreadyPaid: true };
  }

  const unlockedTools = toolsForPlan(sub.plan_slug);
  const accessCode = await ensureToolGrant(`membership:${sub.id}`, {
    name: sub.full_name,
    email: sub.email,
    business: sub.business_name,
    type: "1year",
    status: "active",
    created_at: Date.now(),
    expires_at: Date.now() + 365 * 24 * 60 * 60 * 1000,
    allowed_tools: unlockedTools,
    plan_slug: sub.plan_slug,
  });


  const { data: updatedRows, error: updErr } = await supabase
    .from("membership_subscriptions")
    .update({
      payment_status: "paid",
      flutterwave_reference: reference,
      subscription_status: "active",
      lapsed_at: null,
    })
    .eq("id", sub.id)
    .neq("payment_status", "paid")
    .neq("subscription_status", "cancelled")
    .select("id");

  if (updErr) return { ok: false as const };
  if (!updatedRows?.length) return { ok: true as const, alreadyPaid: true };

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
 * A recurring renewal charge failed (Flutterwave will retry up to 3 times
 * before giving up). Flag the subscription as lapsed and let the admin know,
 * but don't touch payment_status or revoke tools access yet - that happens
 * on the subscription.cancelled webhook once Flutterwave actually gives up.
 */
export async function markMembershipRenewalFailed(subscriptionId: string) {
  const supabase = supabaseAdmin();

  const { data: sub, error } = await supabase
    .from("membership_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (error || !sub) return { ok: false as const };
  if (sub.payment_status !== "paid" || sub.subscription_status === "cancelled") return { ok: true as const };

  const { error: updateError } = await supabase
    .from("membership_subscriptions")
    .update({ subscription_status: "lapsed", lapsed_at: new Date().toISOString() })
    .eq("id", sub.id);
  if (updateError) return { ok: false as const };

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
 * Flutterwave has given up on a subscription (cancelled by the customer, or
 * auto-cancelled after 3 failed renewal attempts). Revoke tools access by
 * revoking the client_codes row(s) tied to this plan, and notify both sides.
 */
export async function markMembershipCancelled(subscriptionId: string) {
  const supabase = supabaseAdmin();

  const { data: sub, error } = await supabase
    .from("membership_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (error || !sub) return { ok: false as const };
  if (sub.subscription_status === "cancelled") return { ok: true as const };

  let revoke = supabase
    .from("client_codes")
    .update({ status: "revoked" })
    .eq("email", sub.email)
    .eq("plan_slug", sub.plan_slug);
  const { data: scoped } = await supabase.from("client_codes").select("code").eq("payment_key", `membership:${sub.id}`).limit(1);
  if (scoped?.length) revoke = revoke.eq("payment_key", `membership:${sub.id}`);
  else revoke = revoke.is("payment_key", null);
  const { error: revokeError } = await revoke;
  if (revokeError) return { ok: false as const };

  const { error: updateError } = await supabase
    .from("membership_subscriptions")
    .update({ subscription_status: "cancelled", lapsed_at: sub.lapsed_at || new Date().toISOString() })
    .eq("id", sub.id);
  if (updateError) return { ok: false as const };



  const fromEmail = process.env.RESEND_FROM_EMAIL!;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL!;

  await resend.emails.send({
    from: fromEmail,
    to: sub.email,
    subject: "Your membership has been cancelled",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Your ${sub.plan_slug} membership has ended</h2>
        <p>Your subscription payment could not be completed, so your membership and tools access have been cancelled.</p>
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
        <p>Tools access has been revoked.</p>
      </div>
    `,
  });

  return { ok: true as const };
}
