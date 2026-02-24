import { google } from "googleapis";

export function getCalendarClient() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");

  const creds = JSON.parse(json);

  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

export async function createCalendarEvent(args: {
  summary: string;
  description?: string;
  startISO: string;
  endISO: string;
}) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const timeZone = process.env.CONSULTATION_TIMEZONE || "Africa/Lagos";

  if (!calendarId) throw new Error("Missing GOOGLE_CALENDAR_ID");

  const calendar = getCalendarClient();

  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: args.summary,
      description: args.description || "",
      start: { dateTime: args.startISO, timeZone },
      end: { dateTime: args.endISO, timeZone },
    },
  });

  return {
    id: res.data.id || null,
    htmlLink: res.data.htmlLink || null,
  };
}