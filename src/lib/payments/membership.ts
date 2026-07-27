import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resendClient";

/**
 * Marks a membership subscription paid and sends both confirmation emails.
 * Idempotent (guarded by the payment_status update condition) so it's safe
 * to call from both the Paystack webhook and the client-side verify route -
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
  if (sub.payment_status === "paid") return { ok: true as const, alreadyPaid: true };

  const { error: updErr } = await supabase
    .from("membership_subscriptions")
    .update({ payment_status: "paid", paystack_reference: reference })
    .eq("id", sub.id)
    .neq("payment_status", "paid");

  if (updErr) return { ok: false as const };

  const fromEmail = process.env.RESEND_FROM_EMAIL!;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL!;
  const planTitle = String(sub.plan_slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  await resend.emails.send({
    from: fromEmail,
    to: sub.email,
    subject: `Your ${planTitle} membership is confirmed`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>You're in - thank you, ${sub.full_name}.</h2>
        <p>Your <b>${planTitle}</b> membership payment has been received (billed ${sub.billing_interval}).</p>
        <p>Here is what happens next: we have your business details and what you would like us to focus on
           (${sub.service_focus}), and we will reach out to you directly within 24 hours to get started.</p>
        <p>Payment reference: ${sub.paystack_reference}</p>
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
        <p><b>Name:</b> ${sub.full_name}</p>
        <p><b>Email:</b> ${sub.email}</p>
        <p><b>Phone:</b> ${sub.phone || "-"}</p>
        <p><b>Business:</b> ${sub.business_name}</p>
        <p><b>Website:</b> ${sub.website || "-"}</p>
        <p><b>What their business does:</b> ${sub.business_description}</p>
        <p><b>What they want us to focus on:</b> ${sub.service_focus}</p>
        <p><b>Amount:</b> $${sub.amount_usd} (${sub.billing_interval})</p>
        <p><b>Ref:</b> ${sub.paystack_reference}</p>
        <p style="color:#b45309;"><b>Reminder: reach out within 24 hours.</b></p>
      </div>
    `,
  });

  return { ok: true as const, alreadyPaid: false };
}
