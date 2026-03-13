// FILE: src/app/api/notify-month-winner/route.ts
// Sends email when admin closes the month — winner gets a celebratory email,
// team members get an announcement email.

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const B = "#507c80";
const PURPLE = "#9333ea";

export async function POST(req: NextRequest) {
  try {
    const {
      to, winnerName, month,
      totalPoints, tasksCompleted, logsSubmitted,
      isWinner, teamSize,
    } = await req.json();

    if (!to || !winnerName || !month) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let subject: string;
    let html: string;

    if (isWinner) {
      // ---------------------------------------------------------------
      // Winner email
      // ---------------------------------------------------------------
      subject = `🏆 Team Member of the Month — ${month}`;
      html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:linear-gradient(135deg,${PURPLE},#a855f7);padding:32px 40px;">
            <div style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px;">Prowess Digital Solutions</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Team Member of the Month</div>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px;">
            <div style="text-align:center;margin-bottom:28px;">
              <div style="font-size:56px;margin-bottom:12px;">🌟</div>
              <div style="font-size:15px;color:#64748b;margin-bottom:8px;">Hi ${winnerName},</div>
              <div style="font-size:26px;font-weight:800;color:#0f172a;margin-bottom:6px;line-height:1.2;">
                You are Team Member of the Month!
              </div>
              <div style="font-size:14px;color:#94a3b8;">Congratulations on your outstanding performance in ${month}.</div>
            </div>

            <div style="background:linear-gradient(135deg,#fdf4ff,#fae8ff);border:2px solid #e879f9;border-radius:14px;padding:28px;margin-bottom:28px;text-align:center;">
              <div style="font-size:13px;color:#86198f;font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Your Stats for ${month}</div>
              <div style="display:flex;justify-content:center;gap:36px;flex-wrap:wrap;margin-top:16px;">
                <div>
                  <div style="font-size:32px;font-weight:800;color:${PURPLE};">${totalPoints}</div>
                  <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Points</div>
                </div>
                <div>
                  <div style="font-size:32px;font-weight:800;color:#22c55e;">${tasksCompleted}</div>
                  <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Tasks Completed</div>
                </div>
                <div>
                  <div style="font-size:32px;font-weight:800;color:#6366f1;">${logsSubmitted}</div>
                  <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Logs Submitted</div>
                </div>
              </div>
            </div>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:28px;">
              <div style="font-size:13px;color:#64748b;line-height:1.7;">
                Out of ${teamSize} team member${teamSize !== 1 ? "s" : ""}, you stood out the most this month through your dedication, consistency, and hard work. The entire Prowess team is proud of you — keep shining! 🎉
              </div>
            </div>

            <div style="text-align:center;">
              <a href="https://prowessdigitalsolutions.com/dashboard"
                 style="display:inline-block;background:${PURPLE};color:white;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
                View Your Leaderboard
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
    } else {
      // ---------------------------------------------------------------
      // Team announcement email (isWinner = false)
      // ---------------------------------------------------------------
      subject = `🏆 ${winnerName} is Team Member of the Month — ${month}`;
      html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:linear-gradient(135deg,${PURPLE},#a855f7);padding:32px 40px;">
            <div style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px;">Prowess Digital Solutions</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Team Member of the Month — ${month}</div>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px;">
            <div style="text-align:center;margin-bottom:28px;">
              <div style="font-size:48px;margin-bottom:12px;">🌟</div>
              <div style="font-size:22px;font-weight:800;color:#0f172a;margin-bottom:6px;line-height:1.2;">
                Meet this month's star performer!
              </div>
              <div style="font-size:14px;color:#94a3b8;">${month} · Prowess Digital Solutions</div>
            </div>

            <div style="background:linear-gradient(135deg,#fdf4ff,#fae8ff);border:2px solid #e879f9;border-radius:14px;padding:28px;margin-bottom:28px;text-align:center;">
              <div style="font-size:13px;color:#86198f;font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Team Member of the Month</div>
              <div style="font-size:28px;font-weight:800;color:#0f172a;margin-bottom:16px;">${winnerName}</div>
              <div style="display:flex;justify-content:center;gap:36px;flex-wrap:wrap;">
                <div>
                  <div style="font-size:28px;font-weight:800;color:${PURPLE};">${totalPoints}</div>
                  <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Points</div>
                </div>
                <div>
                  <div style="font-size:28px;font-weight:800;color:#22c55e;">${tasksCompleted}</div>
                  <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Tasks Completed</div>
                </div>
                <div>
                  <div style="font-size:28px;font-weight:800;color:#6366f1;">${logsSubmitted}</div>
                  <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Logs Submitted</div>
                </div>
              </div>
            </div>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:28px;">
              <div style="font-size:13px;color:#64748b;line-height:1.7;">
                Please join us in congratulating <strong style="color:#0f172a;">${winnerName}</strong> on this well-deserved recognition! Their hard work and consistency throughout ${month} set a fantastic example for the whole team. 🎉
              </div>
            </div>

            <div style="text-align:center;">
              <a href="https://prowessdigitalsolutions.com/dashboard"
                 style="display:inline-block;background:${B};color:white;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
                View Leaderboard
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
    }

    await resend.emails.send({
      from: "Prowess Digital Solutions <info@prowessdigitalsolutions.com>",
      to: [to],
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("notify-month-winner error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
