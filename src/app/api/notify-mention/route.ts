import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { to, taggerName, messageBody, everyone } = await req.json();

    if (!to || !messageBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const heading = everyone
      ? `${taggerName || "Someone"} tagged @everyone in Team Chat`
      : `${taggerName || "Someone"} mentioned you in Team Chat`;
    const subject = everyone
      ? "New message to the whole team"
      : `${taggerName || "Someone"} mentioned you`;
    const bodySnippet = messageBody.length > 300 ? messageBody.slice(0, 300).trimEnd() + "..." : messageBody;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:#507c80;padding:32px 40px;">
              <div style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px;">Prowess Digital Solutions</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Internal Team Dashboard</div>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px;">
              <div style="font-size:22px;font-weight:800;color:#0f172a;margin-bottom:22px;line-height:1.3;">${heading}</div>

              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:28px;">
                <div style="font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${bodySnippet}</div>
              </div>

              <div style="text-align:center;margin-bottom:8px;">
                <a href="https://prowessdigitalsolutions.com/dashboard"
                   style="display:inline-block;background:#507c80;color:white;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
                  Reply on Dashboard
                </a>
              </div>
            </td>
          </tr>

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
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("notify-mention error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
