import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resendClient";
import { genAccessCode, PREMIUM_TOOL_KEYS, PREMIUM_TOOL_NAMES } from "@/lib/tools/tierAccess";
import { verifyTransaction } from "@/lib/payments/flutterwave";
import { formatMoney } from "@/lib/formatMoney";

/**
 * Marks a Skill to Business enrollment paid, grants a full year of access to
 * every premium tool (not tier-scoped like memberships - this program
 * includes the whole tools suite), and sends both confirmation emails.
 * Idempotent, safe to call from both the webhook and the client-side verify
 * route - whichever fires first wins, the second is a no-op.
 */
export async function markSkillToBusinessPaid(purchaseId: string, reference: string) {
  const supabase = supabaseAdmin();

  const { data: purchase, error: purchaseErr } = await supabase
    .from("skill_to_business_purchases")
    .select("*")
    .eq("id", purchaseId)
    .single();

  if (purchaseErr || !purchase) return { ok: false as const };
  if (purchase.payment_status === "paid") return { ok: true as const, alreadyPaid: true };

  // This previously did no amount/currency verification at all - trusted
  // that a webhook or verify call for this purchase_id meant it was really
  // paid in full. Now checks Flutterwave's own verified transaction against
  // the amount the server computed at checkout time (stored on this row).
  const verified = await verifyTransaction(reference);
  const expectedAmount = purchase.currency === "NGN" ? purchase.amount_ngn : purchase.amount_usd;
  const amountMatches = expectedAmount != null && Math.round(Number(verified?.amount || 0) * 100) === Math.round(Number(expectedAmount) * 100);
  const currencyMatches = String(verified?.currency || "").toUpperCase() === String(purchase.currency || "USD").toUpperCase();
  if (verified?.status !== "successful" || !amountMatches || !currencyMatches) {
    return { ok: false as const };
  }

  const { error: updErr } = await supabase
    .from("skill_to_business_purchases")
    .update({ payment_status: "paid", flutterwave_reference: reference })
    .eq("id", purchase.id)
    .neq("payment_status", "paid");

  if (updErr) return { ok: false as const };

  const fromEmail = process.env.RESEND_FROM_EMAIL!;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL!;

  // Full access to every premium tool for one year - this program includes
  // the whole suite, unlike membership tiers which are scoped per plan.
  const accessCode = genAccessCode();

  await supabase.from("client_codes").insert({
    code: accessCode,
    name: purchase.full_name,
    email: purchase.email,
    business: purchase.skill_or_business,
    notes: "Skill to Business enrollment",
    type: "1year",
    status: "active",
    created_at: Date.now(),
    expires_at: Date.now() + 365 * 24 * 60 * 60 * 1000,
    allowed_tools: null, // null = full access to all tools
    plan_slug: "skill-to-business",
  });

  const toolsList = PREMIUM_TOOL_KEYS.map((t) => `<li>${PREMIUM_TOOL_NAMES[t]}</li>`).join("");

  await resend.emails.send({
    from: fromEmail,
    to: purchase.email,
    subject: "You're enrolled - Skill to Business",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>You're in, ${purchase.full_name}.</h2>
        <p>Your Skill to Business enrollment payment has been received.</p>
        <p>Here is what happens next: we will reach out to you directly to schedule your
           Business Foundation Session and get your Starter Pack to you.</p>
        <p>You also have full access to every premium business tool for the next 12 months,
           starting right now. Your access code is:</p>
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
    subject: `New Skill to Business enrollment: ${purchase.full_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>New Skill to Business enrollment</h2>
        <p><b>Name:</b> ${purchase.full_name}</p>
        <p><b>Email:</b> ${purchase.email}</p>
        <p><b>Phone:</b> ${purchase.phone || "-"}</p>
        <p><b>Skill / business:</b> ${purchase.skill_or_business}</p>
        <p><b>Amount:</b> ${formatMoney(expectedAmount, (purchase.currency as "USD" | "NGN") || "USD")}</p>
        <p><b>Ref:</b> ${reference}</p>
        <p><b>Tools access code auto-issued:</b> ${accessCode} (all tools, 1 year)</p>
      </div>
    `,
  });

  return { ok: true as const, alreadyPaid: false };
}
