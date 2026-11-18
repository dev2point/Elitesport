export interface CalendarBookingInput {
  id: string;
  reference: string;
  teamName: string;
  startsAtIso: string;
  endsAtIso: string;
  priceFcfa: number;
  depositFcfa: number;
}

function toIcsUtcStamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function buildBookingIcsContent(booking: CalendarBookingInput): string {
  const dtStart = toIcsUtcStamp(booking.startsAtIso);
  const dtEnd = toIcsUtcStamp(booking.endsAtIso);
  const dtStamp = toIcsUtcStamp(new Date().toISOString());

  const summary = `Foot — Élite Sport Godomey (${booking.teamName})`;
  const location = 'Terrain Élite Sport Godomey, Godomey, Cotonou, Bénin';
  const description = [
    `Référence : ${booking.reference}`,
    `Équipe : ${booking.teamName}`,
    `Tarif total : ${booking.priceFcfa} FCFA`,
    `Acompte 30 % : ${booking.depositFcfa} FCFA`,
    `Solde sur place : ${booking.priceFcfa - booking.depositFcfa} FCFA`,
  ].join('\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Elite Sport Godomey//Reservation//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.id}@elitesportgodomey.bj`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `LOCATION:${escapeIcsText(location)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function buildBookingIcsDataUri(booking: CalendarBookingInput): string {
  const ics = buildBookingIcsContent(booking);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

export function buildGoogleCalendarUrl(booking: CalendarBookingInput): string {
  const dates = `${toIcsUtcStamp(booking.startsAtIso)}/${toIcsUtcStamp(
    booking.endsAtIso
  )}`;
  const text = `Foot — Élite Sport Godomey (${booking.teamName})`;
  const location = 'Terrain Élite Sport Godomey, Godomey, Cotonou, Bénin';
  const details = `Référence : ${booking.reference}\nÉquipe : ${booking.teamName}\nTarif : ${booking.priceFcfa} FCFA (Acompte 30 % : ${booking.depositFcfa} FCFA)`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text,
    dates,
    location,
    details,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
