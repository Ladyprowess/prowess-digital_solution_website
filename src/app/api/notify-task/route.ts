import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const PRIORITY_COLOR: Record<string, string> = {
  high:   "#ef4444",
  medium: "#f59e0b",
  low:    "#22c55e",
};

const PRIORITY_LABEL: Record<string, string> = {
  high:   "High",
  medium: "Medium",
  low:    "Low",
};

export async function POST(req: NextRequest) {
  try {
    const {
      to, assigneeName, assignerName,
      taskTitle, taskDescription,
      priority, deadline, project,
    } = await req.json();

    if (!to || !taskTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const priorityColor = PRIORITY_COLOR[priority] || "#6366f1";
    const priorityLabel = PRIORITY_LABEL[priority] || priority;
    const deadlineText  = deadline
      ? new Date(deadline).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : null;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Task Assigned</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#507c80;padding:32px 40px;">
              <div style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px;">Prowess Digital Solutions</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Internal Team Dashboard</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <div style="font-size:15px;color:#64748b;margin-bottom:8px;">Hi ${assigneeName},</div>
              <div style="font-size:24px;font-weight:800;color:#0f172a;margin-bottom:6px;line-height:1.2;">You have a new task</div>
              <div style="font-size:14px;color:#94a3b8;margin-bottom:32px;">${assignerName} has assigned you the following task.</div>

              <!-- Task card -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:28px;">
                <div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:16px;">${taskTitle}</div>

                ${taskDescription ? `
                <div style="font-size:13px;color:#64748b;line-height:1.6;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #e2e8f0;">
                  ${taskDescription}
                </div>` : ""}

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:12px;">
                      <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Priority</span><br/>
                      <span style="display:inline-block;margin-top:4px;font-size:12px;font-weight:700;color:${priorityColor};background:${priorityColor}18;padding:3px 10px;border-radius:20px;">${priorityLabel}</span>
                    </td>
                    ${deadlineText ? `
                    <td style="padding-bottom:12px;">
                      <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Deadline</span><br/>
                      <span style="font-size:13px;font-weight:600;color:#0f172a;margin-top:4px;display:block;">${deadlineText}</span>
                    </td>` : ""}
                    ${project ? `
                    <td style="padding-bottom:12px;">
                      <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Project</span><br/>
                      <span style="font-size:13px;font-weight:600;color:#0f172a;margin-top:4px;display:block;">${project}</span>
                    </td>` : ""}
                  </tr>
                </table>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="https://prowessdigitalsolutions.com/dashboard"
                   style="display:inline-block;background:#507c80;color:white;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
                  View Task on Dashboard
                </a>
              </div>

              <div style="font-size:13px;color:#94a3b8;line-height:1.6;">
                If you have any questions about this task, reach out to ${assignerName} directly through the dashboard.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <div style="font-size:12px;color:#94a3b8;text-align:center;">
                Prowess Digital Solutions &bull; Internal Team Portal<br/>
                <a href="https://prowessdigitalsolutions.com" style="color:#507c80;text-decoration:none;">prowessdigitalsolutions.com</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await resend.emails.send({
      from: "Prowess Digital Solutions <info@prowessdigitalsolutions.com>",
      to: [to],
      subject: `New Task Assigned: ${taskTitle}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("notify-task error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
