import { Resend } from "resend";
import { buildICS } from "@/lib/ics";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendBookingEmails(opts: {
  adminEmail: string;
  userEmail: string;
  userName: string;
  serviceName: string;
  date: string;
  time: string;
  durationMinutes: number;
  bookingId: string;
  paid: boolean;
}) {
  const {
    adminEmail,
    userEmail,
    userName,
    serviceName,
    date,
    time,
    durationMinutes,
    bookingId,
    paid,
  } = opts;

  const title = `${serviceName} – Consultation`;
  const pretty = `${date} at ${time}`;
  const ics = buildICS({
    title,
    description: `Consultation booking for ${userName}. Booking ID: ${bookingId}.`,
    location: "Online",
    date,
    time,
    durationMinutes,
    uid: bookingId,
  });

  const from = "Prowess Digital Solutions <bookings@prowessdigitalsolutions.com>";

  // User email
  await resend.emails.send({
    from,
    to: userEmail,
    subject: "Your consultation is confirmed",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 8px">Booking confirmed ✅</h2>
        <p style="margin:0 0 10px">Hi ${userName},</p>
        <p style="margin:0 0 10px">
          Your consultation has been confirmed.
        </p>
        <p style="margin:0 0 10px">
          <b>Service:</b> ${serviceName}<br/>
          <b>Date & time:</b> ${pretty}<br/>
          <b>Payment:</b> ${paid ? "Paid" : "Free"}<br/>
          <b>Booking ID:</b> ${bookingId}
        </p>
        <p style="margin:0">We have attached a calendar invite (.ics) so you can add it to your calendar.</p>
      </div>
    `,
    attachments: [
      {
        filename: "consultation-invite.ics",
        content: Buffer.from(ics).toString("base64"),
      },
    ],
  });

  // Admin email
  await resend.emails.send({
    from,
    to: adminEmail,
    subject: "New consultation booking",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 8px">New booking</h2>
        <p style="margin:0 0 10px">
          <b>Name:</b> ${userName}<br/>
          <b>Email:</b> ${userEmail}<br/>
          <b>Service:</b> ${serviceName}<br/>
          <b>Date & time:</b> ${pretty}<br/>
          <b>Payment:</b> ${paid ? "Paid" : "Free"}<br/>
          <b>Booking ID:</b> ${bookingId}
        </p>
      </div>
    `,
    attachments: [
      {
        filename: "consultation-invite.ics",
        content: Buffer.from(ics).toString("base64"),
      },
    ],
  });
}