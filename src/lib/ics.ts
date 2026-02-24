function pad(n: number) {
    return String(n).padStart(2, "0");
  }
  
  // Input: date "YYYY-MM-DD", time "HH:mm"
  export function buildICS(opts: {
    title: string;
    description: string;
    location?: string;
    date: string;
    time: string;
    durationMinutes: number;
    uid: string;
  }) {
    const { title, description, location, date, time, durationMinutes, uid } = opts;
  
    // Treat as Africa/Lagos-ish local; for simple ICS we use floating time.
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
  
    const start = new Date(y, m - 1, d, hh, mm, 0);
    const end = new Date(start.getTime() + durationMinutes * 60_000);
  
    const toICS = (dt: Date) =>
      `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
  
    const dtStart = toICS(start);
    const dtEnd = toICS(end);
    const stamp = toICS(new Date());
  
    const safe = (s: string) =>
      String(s || "")
        .replace(/\r?\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
  
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Prowess Digital Solutions//Consultation//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${safe(title)}`,
      `DESCRIPTION:${safe(description)}`,
      location ? `LOCATION:${safe(location)}` : "LOCATION:Online",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
  }