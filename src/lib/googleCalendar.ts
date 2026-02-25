import { google } from "googleapis";

type Params = {
  summary: string;
  description?: string;
  startISO: string;
  endISO: string;
  timezone: string;
};

function getServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");

  const json = JSON.parse(raw);

  // Must be a real service account json with private_key + client_email
  if (!json.client_email || !json.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not a service account key.");
  }

  return json;
}

export async function createGoogleEvent(p: Params) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error("Missing GOOGLE_CALENDAR_ID");

  const sa = getServiceAccount();

  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: p.summary,
      description: p.description || "",
      start: { dateTime: p.startISO, timeZone: p.timezone },
      end: { dateTime: p.endISO, timeZone: p.timezone },
    },
  });

  return res.data.id || null;
}
