// 캘린더 유틸 — iCalendar (.ics) 파일 생성 + Google Calendar 등록 URL

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatDateLocal(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function formatDateTimeUTC(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeICS(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line: string): string {
  // RFC 5545: 75 octets per line, continuation with leading space
  if (line.length <= 75) return line;
  const out: string[] = [];
  let rest = line;
  out.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    out.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length > 0) out.push(" " + rest);
  return out.join("\r\n");
}

export function buildICS(events: CalendarEvent[], calName = "Pothos"): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pothos//Travel Planner//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICS(calName)}`,
  ];

  const stamp = formatDateTimeUTC(new Date());

  events.forEach((ev, i) => {
    const uid = `${stamp}-${i}@pothostravel.com`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${stamp}`);

    if (ev.allDay) {
      // DTEND for all-day is exclusive (next day)
      const endExclusive = new Date(ev.endDate);
      endExclusive.setDate(endExclusive.getDate() + 1);
      lines.push(`DTSTART;VALUE=DATE:${formatDateLocal(ev.startDate)}`);
      lines.push(`DTEND;VALUE=DATE:${formatDateLocal(endExclusive)}`);
    } else {
      lines.push(`DTSTART:${formatDateTimeUTC(ev.startDate)}`);
      lines.push(`DTEND:${formatDateTimeUTC(ev.endDate)}`);
    }

    lines.push(foldLine(`SUMMARY:${escapeICS(ev.title)}`));
    if (ev.location) lines.push(foldLine(`LOCATION:${escapeICS(ev.location)}`));
    if (ev.description) lines.push(foldLine(`DESCRIPTION:${escapeICS(ev.description)}`));
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(filename: string, ics: string): void {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Google Calendar 단일 이벤트 등록 URL (TEMPLATE 모드, OAuth 불필요)
// 안드로이드/모바일 브라우저에서도 동일하게 동작합니다.
export function getGoogleCalendarUrl(ev: CalendarEvent): string {
  const dates = ev.allDay
    ? (() => {
        const endExclusive = new Date(ev.endDate);
        endExclusive.setDate(endExclusive.getDate() + 1);
        return `${formatDateLocal(ev.startDate)}/${formatDateLocal(endExclusive)}`;
      })()
    : `${formatDateTimeUTC(ev.startDate)}/${formatDateTimeUTC(ev.endDate)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates,
  });
  if (ev.description) params.append("details", ev.description);
  if (ev.location) params.append("location", ev.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
