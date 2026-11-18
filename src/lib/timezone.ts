const PORTO_NOVO_OFFSET_MS = 60 * 60 * 1000; // UTC+1 all year round

const WEEKDAY_SHORT_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as const;
const WEEKDAY_LONG_FR = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
] as const;
const MONTH_SHORT_FR = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Aoû',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
] as const;

export interface DayOption {
  dateStr: string;
  weekdayShort: string;
  dayNumber: string;
  monthShort: string;
  fullLabel: string;
  isToday: boolean;
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

export function isValidDateStr(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  return (
    probe.getUTCFullYear() === y &&
    probe.getUTCMonth() === m - 1 &&
    probe.getUTCDate() === d
  );
}

/**
 * Returns YYYY-MM-DD in Africa/Porto-Novo (UTC+1) without relying on server TZ.
 */
export function getPortoNovoDateStr(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + PORTO_NOVO_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = pad2(shifted.getUTCMonth() + 1);
  const day = pad2(shifted.getUTCDate());
  return `${year}-${month}-${day}`;
}

export function addDaysToDateStr(dateStr: string, offsetDays: number): string {
  if (!isValidDateStr(dateStr)) {
    throw new RangeError(`Invalid date string: ${dateStr}`);
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d + offsetDays));
  return `${utcDate.getUTCFullYear()}-${pad2(utcDate.getUTCMonth() + 1)}-${pad2(
    utcDate.getUTCDate()
  )}`;
}

/**
 * Builds the exact UTC Date for a slot in Africa/Porto-Novo (+01:00).
 */
export function buildPortoNovoSlotRange(
  dateStr: string,
  hour: number
): { startsAt: Date; endsAt: Date } {
  if (!isValidDateStr(dateStr)) {
    throw new RangeError(`Invalid date string: ${dateStr}`);
  }
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new RangeError(`Invalid slot hour: ${hour}`);
  }

  const startsAt = new Date(`${dateStr}T${pad2(hour)}:00:00+01:00`);
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
  return { startsAt, endsAt };
}

export function formatSlotRangeLabel(hour: number): string {
  const start = pad2(hour);
  const end = pad2((hour + 1) % 24);
  return `${start}h–${end}h`;
}

export function formatSlotShortHour(hour: number): string {
  return `${pad2(hour)}h`;
}

export function formatDateLongFr(dateStr: string): string {
  if (!isValidDateStr(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const utcMidnight = new Date(Date.UTC(y, m - 1, d));
  const weekday = WEEKDAY_LONG_FR[utcMidnight.getUTCDay()];
  const month = MONTH_SHORT_FR[m - 1];
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${d} ${month} ${y}`;
}

export function getUpcoming7Days(now: Date = new Date()): DayOption[] {
  const todayStr = getPortoNovoDateStr(now);
  const days: DayOption[] = [];

  for (let i = 0; i < 7; i++) {
    const dateStr = addDaysToDateStr(todayStr, i);
    const [y, m, d] = dateStr.split('-').map(Number);
    const utcDate = new Date(Date.UTC(y, m - 1, d));
    const dayIdx = utcDate.getUTCDay();

    days.push({
      dateStr,
      weekdayShort: i === 0 ? "Auj." : WEEKDAY_SHORT_FR[dayIdx],
      dayNumber: pad2(d),
      monthShort: MONTH_SHORT_FR[m - 1],
      fullLabel: formatDateLongFr(dateStr),
      isToday: i === 0,
    });
  }

  return days;
}

export function formatPortoNovoSlotRangeFromDates(
  startsAt: Date,
  endsAt: Date
): string {
  const startShifted = new Date(startsAt.getTime() + PORTO_NOVO_OFFSET_MS);
  const endShifted = new Date(endsAt.getTime() + PORTO_NOVO_OFFSET_MS);
  const startH = pad2(startShifted.getUTCHours());
  const endH = pad2(endShifted.getUTCHours());
  return `${startH}h–${endH}h`;
}

export function formatPortoNovoTimeHHMM(date: Date = new Date()): string {
  const shifted = new Date(date.getTime() + PORTO_NOVO_OFFSET_MS);
  return `${pad2(shifted.getUTCHours())}:${pad2(shifted.getUTCMinutes())}`;
}

