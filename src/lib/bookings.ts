import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { getDb, type Database } from '@/src/db';
import { bookings, type BookingStatus } from '@/src/db/schema';
import { getSlotPricing, PENDING_HOLD_MINUTES } from './pricing';
import {
  buildPortoNovoSlotRange,
  formatDateLongFr,
  formatPortoNovoSlotRangeFromDates,
  formatSlotRangeLabel,
  formatSlotShortHour,
  getPortoNovoDateStr,
  isValidDateStr,
} from './timezone';
import { bookingIdSchema, createBookingSchema } from './validations';

export type SlotState = 'free' | 'taken' | 'past';

export interface DaySlot {
  date: string;
  hour: number;
  label: string;
  shortHour: string;
  startsAtIso: string;
  endsAtIso: string;
  priceFcfa: number;
  isNightRate: boolean;
  state: SlotState;
}

export interface CreatedBookingSummary {
  id: string;
  reference: string;
  date: string;
  dateLabel: string;
  hour: number;
  timeLabel: string;
  teamName: string;
  phone: string;
  priceFcfa: number;
  expiresAtIso: string;
}

export type CreateBookingResult =
  | { ok: true; booking: CreatedBookingSummary }
  | {
      ok: false;
      code: 'VALIDATION_ERROR' | 'PAST_SLOT' | 'SLOT_TAKEN' | 'DB_UNAVAILABLE' | 'INTERNAL_ERROR';
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export function isPostgresExclusionError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 6 && current && typeof current === 'object'; depth++) {
    const record = current as Record<string, unknown>;
    if (record.code === '23P01') {
      return true;
    }
    current = record.cause ?? record.originalError ?? null;
  }
  return false;
}

export function extractDbErrorDetails(error: unknown): {
  code?: string;
  message: string;
} {
  let current: unknown = error;
  let lastMessage = error instanceof Error ? error.message : String(error);
  let foundCode: string | undefined;

  for (let depth = 0; depth < 6 && current && typeof current === 'object'; depth++) {
    const record = current as Record<string, unknown>;
    if (typeof record.code === 'string') {
      foundCode = record.code;
    }
    if (typeof record.message === 'string' && record.message.length > 0) {
      lastMessage = record.message;
    }
    if (Array.isArray(record.errors) && record.errors.length > 0) {
      current = record.errors[0];
      continue;
    }
    current = record.cause ?? record.originalError ?? null;
  }

  return { code: foundCode, message: lastMessage };
}

export function buildBookingReference(id: string): string {
  const compact = id.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `ESG-${compact}`;
}

/**
 * Cancels all pending bookings whose 15-minute hold has expired.
 * Executed lazily at the beginning of every read or write operation.
 * Uses SQL literal casts so it works seamlessly whether `status` is text or a PostgreSQL enum.
 */
export async function expirePendingBookings(
  db: Database,
  now: Date = new Date()
): Promise<void> {
  const nowIso = now.toISOString();
  await db
    .update(bookings)
    .set({
      status: sql`'cancelled'` as unknown as 'cancelled',
    })
    .where(
      and(
        sql`${bookings.status}::text = 'pending'`,
        isNotNull(bookings.expiresAt),
        sql`${bookings.expiresAt} <= ${nowIso}::timestamptz`
      )
    );
}

/**
 * Returns the 24 1-hour slots (00h to 23h) for a given YYYY-MM-DD date
 * in Africa/Porto-Novo (UTC+1), after expiring stale pending bookings.
 */
export async function getDaySlots(
  dateStr: string,
  dbOverride?: Database,
  nowOverride?: Date
): Promise<DaySlot[]> {
  if (!isValidDateStr(dateStr)) {
    throw new RangeError(`Invalid date: ${dateStr}`);
  }

  const db = dbOverride ?? getDb();
  const now = nowOverride ?? new Date();

  await expirePendingBookings(db, now);

  const { startsAt: dayStart } = buildPortoNovoSlotRange(dateStr, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const activeBookings = await db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
    })
    .from(bookings)
    .where(
      and(
        sql`${bookings.status}::text IN ('pending', 'confirmed')`,
        sql`${bookings.startsAt} < ${dayEnd.toISOString()}::timestamptz`,
        sql`${bookings.endsAt} > ${dayStart.toISOString()}::timestamptz`
      )
    );

  const slots: DaySlot[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const { startsAt, endsAt } = buildPortoNovoSlotRange(dateStr, hour);
    const pricing = getSlotPricing(hour);

    const hasOverlap = activeBookings.some(
      (b) =>
        new Date(b.startsAt).getTime() < endsAt.getTime() &&
        new Date(b.endsAt).getTime() > startsAt.getTime()
    );

    let state: SlotState = 'free';
    if (hasOverlap) {
      state = 'taken';
    } else if (startsAt.getTime() <= now.getTime()) {
      state = 'past';
    }

    slots.push({
      date: dateStr,
      hour,
      label: formatSlotRangeLabel(hour),
      shortHour: formatSlotShortHour(hour),
      startsAtIso: startsAt.toISOString(),
      endsAtIso: endsAt.toISOString(),
      priceFcfa: pricing.priceFcfa,
      isNightRate: pricing.isNightRate,
      state,
    });
  }

  return slots;
}

/**
 * Creates a 15-minute pending online booking.
 * Anti-double-booking is enforced atomically by PostgreSQL EXCLUDE USING gist (23P01).
 */
export async function createBooking(
  rawInput: unknown,
  dbOverride?: Database,
  nowOverride?: Date
): Promise<CreateBookingResult> {
  const parsed = createBookingSchema.safeParse(rawInput);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    const firstIssue = parsed.error.issues[0]?.message ?? 'Données invalides.';
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      error: firstIssue,
      fieldErrors: flattened.fieldErrors,
    };
  }

  const { date, hour, teamName, phone } = parsed.data;
  const now = nowOverride ?? new Date();
  const { startsAt, endsAt } = buildPortoNovoSlotRange(date, hour);

  if (startsAt.getTime() <= now.getTime()) {
    return {
      ok: false,
      code: 'PAST_SLOT',
      error: 'Ce créneau est déjà passé.',
    };
  }

  let db: Database;
  try {
    db = dbOverride ?? getDb();
  } catch {
    return {
      ok: false,
      code: 'DB_UNAVAILABLE',
      error: 'Base de données non configurée.',
    };
  }

  try {
    await expirePendingBookings(db, now);

    const { priceFcfa } = getSlotPricing(hour);
    const expiresAt = new Date(now.getTime() + PENDING_HOLD_MINUTES * 60 * 1000);

    const [created] = await db
      .insert(bookings)
      .values({
        startsAt,
        endsAt,
        teamName,
        phone,
        status: sql`'pending'` as unknown as 'pending',
        source: sql`'online'` as unknown as 'online',
        priceFcfa,
        // Legacy compatibility column; stores the full price, never a deposit concept.
        depositFcfa: priceFcfa,
        expiresAt,
      })
      .returning();

    if (!created) {
      return {
        ok: false,
        code: 'INTERNAL_ERROR',
        error: 'Impossible de créer la réservation.',
      };
    }

    return {
      ok: true,
      booking: {
        id: created.id,
        reference: buildBookingReference(created.id),
        date,
        dateLabel: formatDateLongFr(date),
        hour,
        timeLabel: formatSlotRangeLabel(hour),
        teamName: created.teamName,
        phone: created.phone,
        priceFcfa: created.priceFcfa,
        expiresAtIso: (created.expiresAt ?? expiresAt).toISOString(),
      },
    };
  } catch (error) {
    if (isPostgresExclusionError(error)) {
      return {
        ok: false,
        code: 'SLOT_TAKEN',
        error: "Ce créneau vient d'être pris",
      };
    }

    const details = extractDbErrorDetails(error);
    console.error('createBooking failed:', details.code ?? 'UNKNOWN', details.message);
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Erreur lors de la réservation. Veuillez réessayer.',
    };
  }
}

export interface BookingDetails {
  id: string;
  reference: string;
  dateStr: string;
  dateLabel: string;
  timeLabel: string;
  startsAtIso: string;
  endsAtIso: string;
  teamName: string;
  phone: string;
  status: BookingStatus;
  priceFcfa: number;
  expiresAtIso: string | null;
}

export async function getBookingById(
  rawId: string,
  dbOverride?: Database,
  nowOverride?: Date
): Promise<BookingDetails | null> {
  const parsed = bookingIdSchema.safeParse(rawId);
  if (!parsed.success) {
    return null;
  }

  const db = dbOverride ?? getDb();
  const now = nowOverride ?? new Date();

  await expirePendingBookings(db, now);

  const [row] = await db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      teamName: bookings.teamName,
      phone: bookings.phone,
      status: bookings.status,
      priceFcfa: bookings.priceFcfa,
      expiresAt: bookings.expiresAt,
    })
    .from(bookings)
    .where(eq(bookings.id, parsed.data))
    .limit(1);

  if (!row) {
    return null;
  }

  const startsAt = new Date(row.startsAt);
  const endsAt = new Date(row.endsAt);
  const dateStr = getPortoNovoDateStr(startsAt);

  return {
    id: row.id,
    reference: buildBookingReference(row.id),
    dateStr,
    dateLabel: formatDateLongFr(dateStr),
    timeLabel: formatPortoNovoSlotRangeFromDates(startsAt, endsAt),
    startsAtIso: startsAt.toISOString(),
    endsAtIso: endsAt.toISOString(),
    teamName: row.teamName,
    phone: row.phone,
    status: row.status,
    priceFcfa: row.priceFcfa,
    expiresAtIso: row.expiresAt ? new Date(row.expiresAt).toISOString() : null,
  };
}
