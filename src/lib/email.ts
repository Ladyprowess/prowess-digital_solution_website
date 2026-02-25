type EmailParams = {
  to: string;
  name: string;
  service_name: string;   // ✅ add this
  startISO: string;
  endISO: string;
  timezone: string;
};

function fmt(iso: string, tz: string) {
  return new Date(iso).toLocaleString("en-GB", { timeZone: tz });
}

export async function sendConsultationEmail(p: EmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) throw new Error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL");

  const subject = "Your consultation booking is confirmed";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>Booking confirmed ✅</h2>
      <p>Hi ${p.name},</p>
      <p>Your consultation has been confirmed.</p>

      <p><b>Service:</b> ${p.service_name}</p>

      <p>
        <b>Start:</b> ${fmt(p.startISO, p.timezone)}<br/>
        <b>End:</b> ${fmt(p.endISO, p.timezone)}
      </p>

      <p>If you have any questions, reply to this email.</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: p.to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || "Failed to send email.");
  }

  return true;
}