// FILE: src/app/api/notify-commission/route.ts
//
// Sends an email notification when:
// (a) A member logs a sale — notifies admin to confirm it
// (b) Admin/leader confirms or rejects a sale — notifies the member
// (c) Admin/leader marks commission as paid — notifies the member

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const B = "#507c80";

type NotifyType = "sale-logged" | "sale-confirmed" | "sale-rejected" | "commission-paid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, to, recipientName }: { type: NotifyType; to: string; recipientName: string } = body;

    if (!type || !to) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let subject = "";
    let html    = "";

    const header = `
      <tr>
        <td style="background:${B};padding:32px 40px;">
          <div style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px;">Prowess Digital Solutions</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Commission System</div>
        </td>
      </tr>`;

    const footer = `
      <tr>
        <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
          <div style="font-size:12px;color:#94a3b8;text-align:center;">
            Prowess Digital Solutions &bull; Internal Team Portal<br/>
            <a href="https://prowessdigitalsolutions.com" style="color:${B};text-decoration:none;">prowessdigitalsolutions.com</a>
          </div>
        </td>
      </tr>`;

    const wrap = (body: string) => `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        ${header}
        <tr><td style="padding:36px 40px;">${body}</td></tr>
        ${footer}
      </table>
    </td></tr>
  </table>
</body></html>`;

    // ── (a) Member logged a sale → notify admin to review ──────────────────
    if (type === "sale-logged") {
      const { memberName, clientName, saleAmount, currencySymbol, productService, saleDate } = body;
      subject = `New Sale Logged — Pending Confirmation`;
      html = wrap(`
        <div style="font-size:15px;color:#64748b;margin-bottom:8px;">Hi ${recipientName},</div>
        <div style="font-size:24px;font-weight:800;color:#0f172a;margin-bottom:6px;line-height:1.2;">A sale needs your confirmation</div>
        <div style="font-size:14px;color:#94a3b8;margin-bottom:28px;">${memberName} has logged a new sale awaiting review.</div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:14px;">
                <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Sales Rep</span><br/>
                <span style="font-size:14px;font-weight:600;color:#0f172a;margin-top:4px;display:block;">${memberName}</span>
              </td>
              <td style="padding-bottom:14px;">
                <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Client</span><br/>
                <span style="font-size:14px;font-weight:600;color:#0f172a;margin-top:4px;display:block;">${clientName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:14px;">
                <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Sale Amount</span><br/>
                <span style="font-size:18px;font-weight:800;color:${B};margin-top:4px;display:block;">${currencySymbol}${Number(saleAmount).toLocaleString()}</span>
              </td>
              <td style="padding-bottom:14px;">
                <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Commission (2%)</span><br/>
                <span style="font-size:18px;font-weight:800;color:#10b981;margin-top:4px;display:block;">${currencySymbol}${(Number(saleAmount) * 0.02).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Product / Service</span><br/>
                <span style="font-size:13px;font-weight:600;color:#0f172a;margin-top:4px;display:block;">${productService}</span>
              </td>
              <td>
                <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Sale Date</span><br/>
                <span style="font-size:13px;font-weight:600;color:#0f172a;margin-top:4px;display:block;">${new Date(saleDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
              </td>
            </tr>
          </table>
        </div>
        <div style="text-align:center;margin-bottom:28px;">
          <a href="https://prowessdigitalsolutions.com/dashboard" style="display:inline-block;background:${B};color:white;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
            Review on Dashboard
          </a>
        </div>
      `);
    }

    // ── (b) Sale confirmed → notify member ─────────────────────────────────
    if (type === "sale-confirmed") {
      const { clientName, saleAmount, currencySymbol, commissionAmount } = body;
      subject = `Your Sale Has Been Confirmed 🎉`;
      html = wrap(`
        <div style="font-size:15px;color:#64748b;margin-bottom:8px;">Hi ${recipientName},</div>
        <div style="font-size:24px;font-weight:800;color:#0f172a;margin-bottom:6px;line-height:1.2;">Your sale has been confirmed!</div>
        <div style="font-size:14px;color:#94a3b8;margin-bottom:28px;">Your commission for the sale below has been approved and is now tracked.</div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin-bottom:28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:14px;">
                <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Client</span><br/>
                <span style="font-size:14px;font-weight:600;color:#0f172a;margin-top:4px;display:block;">${clientName}</span>
              </td>
              <td style="padding-bottom:14px;">
                <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Sale Amount</span><br/>
                <span style="font-size:14px;font-weight:600;color:#0f172a;margin-top:4px;display:block;">${currencySymbol}${Number(saleAmount).toLocaleString()}</span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="text-align:center;padding-top:8px;">
                <div style="font-size:13px;color:#16a34a;font-weight:600;margin-bottom:4px;">Your Commission Earned</div>
                <div style="font-size:32px;font-weight:800;color:#16a34a;">${currencySymbol}${Number(commissionAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Payout scheduled for end of month</div>
              </td>
            </tr>
          </table>
        </div>
        <div style="text-align:center;">
          <a href="https://prowessdigitalsolutions.com/dashboard" style="display:inline-block;background:${B};color:white;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
            View My Earnings
          </a>
        </div>
      `);
    }

    // ── (c) Sale rejected → notify member ──────────────────────────────────
    if (type === "sale-rejected") {
      const { clientName, rejectionNote } = body;
      subject = `Sale Log Rejected — Action Required`;
      html = wrap(`
        <div style="font-size:15px;color:#64748b;margin-bottom:8px;">Hi ${recipientName},</div>
        <div style="font-size:24px;font-weight:800;color:#0f172a;margin-bottom:6px;line-height:1.2;">Your sale log was rejected</div>
        <div style="font-size:14px;color:#94a3b8;margin-bottom:28px;">The following sale could not be confirmed. Please review the note below.</div>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:24px;margin-bottom:28px;">
          <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:6px;">Client: <span style="font-weight:400">${clientName}</span></div>
          ${rejectionNote ? `<div style="font-size:13px;font-weight:700;color:#374151;margin-top:12px;">Reason:</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px;line-height:1.6;">${rejectionNote}</div>` : ""}
        </div>
        <div style="text-align:center;">
          <a href="https://prowessdigitalsolutions.com/dashboard" style="display:inline-block;background:${B};color:white;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
            Go to Dashboard
          </a>
        </div>
      `);
    }

    // ── (d) Commission paid → notify member ────────────────────────────────
    if (type === "commission-paid") {
      const { totalPaid, currencySymbol, month } = body;
      subject = `Commission Paid — ${month}`;
      html = wrap(`
        <div style="font-size:15px;color:#64748b;margin-bottom:8px;">Hi ${recipientName},</div>
        <div style="font-size:24px;font-weight:800;color:#0f172a;margin-bottom:6px;line-height:1.2;">Your commission has been paid! 💸</div>
        <div style="font-size:14px;color:#94a3b8;margin-bottom:28px;">Your commission for ${month} has been marked as paid.</div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:32px;margin-bottom:28px;text-align:center;">
          <div style="font-size:13px;color:#16a34a;font-weight:600;margin-bottom:6px;">Amount Paid</div>
          <div style="font-size:40px;font-weight:800;color:#16a34a;">${currencySymbol}${Number(totalPaid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:6px;">${month}</div>
        </div>
        <div style="text-align:center;">
          <a href="https://prowessdigitalsolutions.com/dashboard" style="display:inline-block;background:${B};color:white;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
            View Commission History
          </a>
        </div>
      `);
    }

    if (!subject || !html) {
      return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
    }

    await resend.emails.send({
      from: "Prowess Digital Solutions <info@prowessdigitalsolutions.com>",
      to: [to],
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("notify-commission error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}