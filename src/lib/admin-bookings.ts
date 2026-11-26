import { and, asc, eq, sql } from 'drizzle-orm';
import { getDb, type Database } from '@/src/db';
import { bookings, type BookingSource, type BookingStatus } from '@/src/db/schema';
import {
  buildBookingReference,
  expirePendingBookings,
  extractDbErrorDetails,
} from './bookings';
import {
  buildPortoNovoSlotRange,
  formatPortoNovoSlotRangeFromDates,
  getPortoNovoMonthRange,
  getPortoNovoWeekRange,
  isValidDateStr,
} from './timezone';
import { bookingIdSchema } from './validations';

export type AdminBookingAction = 'confirm' | 'cancel' | 'complete';

export interface AdminBookingItem {
  id: string;
  reference: string;
  timeLabel: string;
  startsAtIso: string;
  endsAtIso: string;
  teamName: string;
  phone: string;
  whatsappDigits: string;
  status: BookingStatus;
  source: BookingSource;
  priceFcfa: number;
  expiresAtIso: string | null;
}

export interface RevenuePeriodSummary {
  totalFcfa: number;
  count: number;
}

export interface AdminRevenueSummary {
  day: RevenuePeriodSummary;
  week: RevenuePeriodSummary;
  month: RevenuePeriodSummary;
}

export type TransitionBookingResult =
  | { ok: true; status: BookingStatus }
  | { ok: false; error: string };

export function extractPhoneDigitsForWhatsapp(phone: string): string {
  return phone.replace(/\D/g, '');
}

export async function getAdminRevenueStats(
  referenceDateStr: string,
  dbOverride?: Database
): Promise<AdminRevenueSummary> {
  if (!isValidDateStr(referenceDateStr)) {
    throw new RangeError(`Invalid date: ${referenceDateStr}`);
  }

  const db = dbOverride ?? getDb();

  const { startsAt: dayStart } = buildPortoNovoSlotRange(referenceDateStr, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const weekRange = getPortoNovoWeekRange(referenceDateStr);
  const monthRange = getPortoNovoMonthRange(referenceDateStr);

  const rangeStart = new Date(
    Math.min(dayStart.getTime(), weekRange.start.getTime(), monthRange.start.getTime())
  );
  const rangeEnd = new Date(
    Math.max(dayEnd.getTime(), weekRange.end.getTime(), monthRange.end.getTime())
  );

  const rows = await db
    .select({
      startsAt: bookings.startsAt,
      priceFcfa: bookings.priceFcfa,
    })
    .from(bookings)
    .where(
      and(
        sql`${bookings.status}::text IN ('confirmed', 'completed')`,
        sql`${bookings.startsAt} >= ${rangeStart.toISOString()}::timestamptz`,
        sql`${bookings.startsAt} < ${rangeEnd.toISOString()}::timestamptz`
      )
    );

  const summary: AdminRevenueSummary = {
    day: { totalFcfa: 0, count: 0 },
    week: { totalFcfa: 0, count: 0 },
    month: { totalFcfa: 0, count: 0 },
  };

  for (const row of rows) {
    const ts = new Date(row.startsAt).getTime();
    if (ts >= dayStart.getTime() && ts < dayEnd.getTime()) {
      summary.day.totalFcfa += row.priceFcfa;
      summary.day.count += 1;
    }
    if (ts >= weekRange.start.getTime() && ts < weekRange.end.getTime()) {
      summary.week.totalFcfa += row.priceFcfa;
      summary.week.count += 1;
    }
    if (ts >= monthRange.start.getTime() && ts < monthRange.end.getTime()) {
      summary.month.totalFcfa += row.priceFcfa;
      summary.month.count += 1;
    }
  }

  return summary;
}

export async function getAdminDayBookings(
  dateStr: string,
  dbOverride?: Database,
  nowOverride?: Date
): Promise<AdminBookingItem[]> {
  if (!isValidDateStr(dateStr)) {
    throw new RangeError(`Invalid date: ${dateStr}`);
  }

  const db = dbOverride ?? getDb();
  const now = nowOverride ?? new Date();

  await expirePendingBookings(db, now);

  const { startsAt: dayStart } = buildPortoNovoSlotRange(dateStr, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      teamName: bookings.teamName,
      phone: bookings.phone,
      status: bookings.status,
      source: bookings.source,
      priceFcfa: bookings.priceFcfa,
      expiresAt: bookings.expiresAt,
    })
    .from(bookings)
    .where(
      and(
        sql`${bookings.startsAt} >= ${dayStart.toISOString()}::timestamptz`,
        sql`${bookings.startsAt} < ${dayEnd.toISOString()}::timestamptz`
      )
    )
    .orderBy(asc(bookings.startsAt), asc(bookings.createdAt));

  return rows.map((row) => {
    const startsAt = new Date(row.startsAt);
    const endsAt = new Date(row.endsAt);
    return {
      id: row.id,
      reference: buildBookingReference(row.id),
      timeLabel: formatPortoNovoSlotRangeFromDates(startsAt, endsAt),
      startsAtIso: startsAt.toISOString(),
      endsAtIso: endsAt.toISOString(),
      teamName: row.teamName,
      phone: row.phone,
      whatsappDigits: extractPhoneDigitsForWhatsapp(row.phone),
      status: row.status,
      source: row.source,
      priceFcfa: row.priceFcfa,
      expiresAtIso: row.expiresAt ? new Date(row.expiresAt).toISOString() : null,
    };
  });
}

export async function transitionBookingStatus(
  rawBookingId: unknown,
  action: AdminBookingAction,
  dbOverride?: Database,
  nowOverride?: Date
): Promise<TransitionBookingResult> {
  const parsedId = bookingIdSchema.safeParse(rawBookingId);
  if (!parsedId.success) {
    return { ok: false, error: 'Identifiant de réservation invalide.' };
  }

  let db: Database;
  try {
    db = dbOverride ?? getDb();
  } catch {
    return { ok: false, error: 'Base de données non configurée.' };
  }

  const bookingId = parsedId.data;
  const now = nowOverride ?? new Date();

  try {
    await expirePendingBookings(db, now);

    const [current] = await db
      .select({
        id: bookings.id,
        status: bookings.status,
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!current) {
      return { ok: false, error: 'Réservation introuvable.' };
    }

    if (action === 'confirm') {
      if (current.status === 'confirmed') {
        return { ok: true, status: 'confirmed' };
      }
      if (current.status !== 'pending') {
        return {
          ok: false,
          error:
            current.status === 'cancelled'
              ? 'Cette réservation a expiré ou a été annulée.'
              : 'Seule une réservation en attente peut être confirmée.',
        };
      }

      const updated = await db
        .update(bookings)
        .set({
          status: sql`'confirmed'` as unknown as 'confirmed',
          expiresAt: null,
        })
        .where(
          and(
            eq(bookings.id, bookingId),
            sql`${bookings.status}::text = 'pending'`
          )
        )
        .returning({ id: bookings.id });

      if (updated.length === 0) {
        return {
          ok: false,
          error: 'Cette réservation vient d’expirer ou de changer d’état.',
        };
      }
      return { ok: true, status: 'confirmed' };
    }

    if (action === 'cancel') {
      if (current.status === 'cancelled') {
        return { ok: true, status: 'cancelled' };
      }
      if (current.status !== 'pending' && current.status !== 'confirmed') {
        return {
          ok: false,
          error: 'Impossible d’annuler une réservation déjà terminée.',
        };
      }

      await db
        .update(bookings)
        .set({
          status: sql`'cancelled'` as unknown as 'cancelled',
        })
        .where(
          and(
            eq(bookings.id, bookingId),
            sql`${bookings.status}::text IN ('pending', 'confirmed')`
          )
        );

      return { ok: true, status: 'cancelled' };
    }

    // action === 'complete'
    if (current.status === 'completed') {
      return { ok: true, status: 'completed' };
    }
    if (current.status !== 'confirmed') {
      return {
        ok: false,
        error: 'Seule une réservation confirmée peut être marquée terminée.',
      };
    }

    await db
      .update(bookings)
      .set({
        status: sql`'completed'` as unknown as 'completed',
      })
      .where(
        and(
          eq(bookings.id, bookingId),
          sql`${bookings.status}::text = 'confirmed'`
        )
      );

    return { ok: true, status: 'completed' };
  } catch (error) {
    const details = extractDbErrorDetails(error);
    console.error(
      'transitionBookingStatus failed:',
      details.code ?? 'UNKNOWN',
      details.message
    );
    return {
      ok: false,
      error: 'Erreur lors de la mise à jour de la réservation.',
    };
  }
}
