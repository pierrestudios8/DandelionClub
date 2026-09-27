/**
 * .ics calendar files for planting confirmations and the "Add to calendar" link.
 * Times are the club's (Africa/Johannesburg, UTC+2 all year, no daylight saving)
 * and written in UTC so every calendar app agrees.
 */
export interface CalendarEvent {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  location?: string;
  url?: string;
}

const SAST_OFFSET = '+02:00';

/** A planting's calendar day ("2026-10-24" at UTC midnight) and "09:00" as an instant. */
export function atClubTime(day: Date, time: string): Date {
  return new Date(`${day.toISOString().slice(0, 10)}T${time}:00${SAST_OFFSET}`);
}

const stamp = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

/** RFC 5545 text: escape backslashes, semicolons, commas and newlines. */
const text = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Lines longer than 75 octets continue on the next line after a space. */
function fold(line: string): string {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let start = 0;
  while (start < bytes.length) {
    let end = Math.min(start + (parts.length ? 74 : 75), bytes.length);
    // Don't split a multi-byte character.
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    parts.push(bytes.subarray(start, end).toString('utf8'));
    start = end;
  }
  return parts.join('\r\n ');
}

export function buildIcs(event: CalendarEvent, now = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dandelion Club//Plantings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(event.end)}`,
    `SUMMARY:${text(event.summary)}`,
    ...(event.description ? [`DESCRIPTION:${text(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${text(event.location)}`] : []),
    ...(event.url ? [`URL:${event.url}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}
