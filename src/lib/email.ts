type EmailParams = {
  to: string;
  name: string;
  service_name: string;
  startISO: string;
  endISO: string;
  timezone?: string;
};

function fmt(iso: string, tz = "Africa/Lagos") {
  return new Date(iso).toLocaleString("en-GB", { timeZone: tz });
}

export async function sendConsultationEmail(p: EmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL");
  }

  const subject = "Your consultation booking is confirmed";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h2 style="margin-bottom:8px">Booking confirmed ✅</h2>

      <p>Hi ${p.name},</p>

      <p>Your consultation has been confirmed.</p>

      <p><strong>Service:</strong> ${p.service_name}</p>

      <p>
        <strong>Start:</strong> ${fmt(p.startISO, p.timezone)}<br/>
        <strong>End:</strong> ${fmt(p.endISO, p.timezone)}
      </p>

      <p>Kindly add this event to your google calendar.</p>

      <p>If you have any questions, simply reply to this email.</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",

      // prevents accidental duplicate sends
      "Idempotency-Key": `${p.to}-${p.startISO}`,
    },
    body: JSON.stringify({
      from,
      to: [p.to], // ✅ IMPORTANT: array
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