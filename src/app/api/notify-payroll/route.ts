// FILE: src/app/api/notify-payroll/route.ts
// Sends email to member when admin marks their payroll as paid.

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const B = "#507c80";

export async function POST(req: NextRequest) {
  try {
    const {
      to, recipientName, month,
      finalAmount, currencySymbol,
      payType, articleCount, adjustmentNote,
    } = await req.json();

    if (!to || !finalAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const articleLine = payType === "per_article" && articleCount
      ? `<tr>
           <td style="padding-bottom:12px;">
             <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Articles Counted</span><br/>
             <span style="font-size:14px;font-weight:600;color:#0f172a;margin-top:4px;display:block;">${articleCount} article${articleCount !== 1 ? "s" : ""}</span>
           </td>
         </tr>`
      : "";

    const adjLine = adjustmentNote
      ? `<tr>
           <td style="padding-bottom:12px;">
             <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Adjustment Note</span><br/>
             <span style="font-size:13px;color:#64748b;margin-top:4px;display:block;">${adjustmentNote}</span>
           </td>
         </tr>`
      : "";

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:${B};padding:32px 40px;">
            <div style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px;">Prowess Digital Solutions</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Payroll Notification</div>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px;">
            <div style="font-size:15px;color:#64748b;margin-bottom:8px;">Hi ${recipientName},</div>
            <div style="font-size:24px;font-weight:800;color:#0f172a;margin-bottom:6px;line-height:1.2;">Your payment has been sent! 💸</div>
            <div style="font-size:14px;color:#94a3b8;margin-bottom:28px;">Your ${payType === "per_article" ? "article-based" : "monthly"} pay for ${month} has been marked as paid.</div>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:28px;margin-bottom:28px;text-align:center;">
              <div style="font-size:13px;color:#16a34a;font-weight:600;margin-bottom:6px;">Amount Paid</div>
              <div style="font-size:40px;font-weight:800;color:#16a34a;">${currencySymbol}${Number(finalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:6px;">${month}</div>
            </div>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${articleLine}
                ${adjLine}
                <tr>
                  <td>
                    <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Pay Type</span><br/>
                    <span style="font-size:13px;font-weight:600;color:#0f172a;margin-top:4px;display:block;">${payType === "per_article" ? "Per Article" : "Monthly Salary"}</span>
                  </td>
                </tr>
              </table>
            </div>

            <div style="text-align:center;">
              <a href="https://prowessdigitalsolutions.com/dashboard"
                 style="display:inline-block;background:${B};color:white;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
                View Payroll History
              </a>
            </div>
          </td>
        </tr>

        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
            <div style="font-size:12px;color:#94a3b8;text-align:center;">
              Prowess Digital Solutions &bull; Internal Team Portal<br/>
              <a href="https://prowessdigitalsolutions.com" style="color:${B};text-decoration:none;">prowessdigitalsolutions.com</a>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await resend.emails.send({
      from: "Prowess Digital Solutions <info@prowessdigitalsolutions.com>",
      to: [to],
      subject: `Payment Received — ${month}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("notify-payroll error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}