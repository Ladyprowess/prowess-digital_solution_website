import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const BRAND = "#507c80";

function wrapEmail(title: string, body: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:${BRAND};padding:28px 36px;">
              <div style="font-size:22px;font-weight:800;color:#ffffff;">Prowess Digital Solutions</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.78);margin-top:4px;">Admin dashboard notification</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:18px 36px;border-top:1px solid #e2e8f0;">
              <div style="font-size:12px;color:#94a3b8;text-align:center;">
                <a href="https://prowessdigitalsolutions.com/dashboard" style="color:${BRAND};text-decoration:none;">Open dashboard</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const {
      type,
      to,
      submitterName,
      taskTitle,
      project,
      month,
      winnerName,
      totalPoints,
      tasksCompleted,
      logsSubmitted,
      recipientName,
      finalAmount,
      currencySymbol,
      payType,
      articleCount,
      notes,
    } = await req.json();

    if (!to || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let subject = "";
    let html = "";

    if (type === "task-submitted") {
      subject = `Task Submitted: ${taskTitle || "Untitled task"}`;
      html = wrapEmail(subject, `
        <div style="font-size:24px;font-weight:800;color:#0f172a;margin-bottom:10px;">Task submitted for review</div>
        <div style="font-size:14px;color:#64748b;line-height:1.7;margin-bottom:22px;">
          <strong style="color:#0f172a;">${submitterName || "A team member"}</strong> submitted a task on the dashboard.
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">Task</div>
          <div style="font-size:18px;font-weight:700;color:#0f172a;margin-top:6px;">${taskTitle || "Untitled task"}</div>
          ${project ? `<div style="font-size:13px;color:#64748b;margin-top:8px;">Project: ${project}</div>` : ""}
        </div>
      `);
    } else if (type === "activity-submitted") {
      subject = `Activity Submitted: ${taskTitle || "New activity log"}`;
      html = wrapEmail(subject, `
        <div style="font-size:24px;font-weight:800;color:#0f172a;margin-bottom:10px;">Activity submitted for review</div>
        <div style="font-size:14px;color:#64748b;line-height:1.7;margin-bottom:22px;">
          <strong style="color:#0f172a;">${submitterName || "A team member"}</strong> submitted an activity log.
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">Activity</div>
          <div style="font-size:18px;font-weight:700;color:#0f172a;margin-top:6px;">${taskTitle || "New activity log"}</div>
          ${project ? `<div style="font-size:13px;color:#64748b;margin-top:8px;">Project: ${project}</div>` : ""}
        </div>
      `);
    } else if (type === "month-marked") {
      subject = `Team Member of the Month Marked: ${winnerName || "Winner selected"}`;
      html = wrapEmail(subject, `
        <div style="font-size:24px;font-weight:800;color:#0f172a;margin-bottom:10px;">Team Member of the Month has been marked</div>
        <div style="font-size:14px;color:#64748b;line-height:1.7;margin-bottom:22px;">
          ${month || "This month"} has been closed on the dashboard.
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">Winner</div>
          <div style="font-size:18px;font-weight:700;color:#0f172a;margin-top:6px;">${winnerName || "Unknown"}</div>
          <div style="font-size:13px;color:#64748b;margin-top:8px;">${totalPoints ?? 0} points • ${tasksCompleted ?? 0} tasks • ${logsSubmitted ?? 0} logs</div>
        </div>
      `);
    } else if (type === "payment-made") {
      subject = `Payment Made: ${recipientName || "Team member"}`;
      html = wrapEmail(subject, `
        <div style="font-size:24px;font-weight:800;color:#0f172a;margin-bottom:10px;">Payment has been marked as paid</div>
        <div style="font-size:14px;color:#64748b;line-height:1.7;margin-bottom:22px;">
          You just made a payment to <strong style="color:#0f172a;">${recipientName || "a team member"}</strong>.
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">Payment Details</div>
          <div style="font-size:18px;font-weight:700;color:#0f172a;margin-top:6px;">${currencySymbol || ""}${Number(finalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div style="font-size:13px;color:#64748b;margin-top:8px;">${month || "This month"} • ${payType === "per_article" ? `Per Article${articleCount !== undefined ? ` • ${articleCount} article${articleCount === 1 ? "" : "s"}` : ""}` : "Monthly Salary"}</div>
          ${notes ? `<div style="font-size:13px;color:#64748b;margin-top:8px;">Reason for payment: ${notes}</div>` : ""}
        </div>
      `);
    } else {
      return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
    }

    await resend.emails.send({
      from: "Prowess Digital Solutions <info@prowessdigitalsolutions.com>",
      to: [to],
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send admin notification.";
    console.error("notify-dashboard-admin error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
