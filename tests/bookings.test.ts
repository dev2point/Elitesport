import { describe, expect, it } from 'bun:test';
import type { Database } from '@/src/db';
import { createBooking, getDaySlots, isPostgresExclusionError } from '@/src/lib/bookings';
import {
  DEPOSIT_PERCENTAGE,
  getSlotPricing,
  HOURLY_RATE_FCFA,
} from '@/src/lib/pricing';
import {
  buildPortoNovoSlotRange,
  getPortoNovoDateStr,
  getUpcoming7Days,
} from '@/src/lib/timezone';
import { createBookingSchema } from '@/src/lib/validations';

describe('Pricing rules', () => {
  it('applies 25000 FCFA per hour 24h/24 with 30% integer deposit (7500 FCFA)', () => {
    expect(HOURLY_RATE_FCFA).toBe(25000);
    for (let h = 0; h < 24; h++) {
      const p = getSlotPricing(h);
      expect(p.priceFcfa).toBe(25000);
      expect(p.depositFcfa).toBe(Math.round((25000 * DEPOSIT_PERCENTAGE) / 100));
      expect(p.depositFcfa).toBe(7500);
      expect(p.remainingFcfa).toBe(17500);
      expect(Number.isInteger(p.priceFcfa)).toBe(true);
      expect(Number.isInteger(p.depositFcfa)).toBe(true);
    }
  });
});

describe('Africa/Porto-Novo (+01:00) timezone logic', () => {
  it('builds exact UTC timestamps for +01:00 offset across midnight', () => {
    const { startsAt, endsAt } = buildPortoNovoSlotRange('2026-11-20', 23);
    expect(startsAt.toISOString()).toBe('2026-11-20T22:00:00.000Z');
    expect(endsAt.toISOString()).toBe('2026-11-20T23:00:00.000Z');
  });

  it('computes Porto-Novo date without relying on server TZ', () => {
    const utcLate = new Date('2026-11-18T23:30:00.000Z');
    expect(getPortoNovoDateStr(utcLate)).toBe('2026-11-19');
    expect(getUpcoming7Days(utcLate)).toHaveLength(7);
  });
});

describe('Benin phone validation', () => {
  it('accepts 8 to 10 digits with optional +229', () => {
    const a = createBookingSchema.safeParse({
      date: '2026-11-20',
      hour: 18,
      teamName: 'FC Godomey',
      phone: '97000000',
    });
    const b = createBookingSchema.safeParse({
      date: '2026-11-20',
      hour: 18,
      teamName: 'FC Godomey',
      phone: '+229 01 97 00 00 00',
    });
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
    if (b.success) {
      expect(b.data.phone).toBe('+2290197000000');
    }
  });

  it('rejects invalid phone lengths', () => {
    const bad = createBookingSchema.safeParse({
      date: '2026-11-20',
      hour: 18,
      teamName: 'FC Godomey',
      phone: '1234567',
    });
    expect(bad.success).toBe(false);
  });
});

describe('Concurrent booking exclusion (23P01)', () => {
  it('detects Postgres 23P01 error nested under cause', () => {
    const wrapped = new Error('Failed query', {
      cause: Object.assign(new Error('conflicting key value violates exclusion constraint'), {
        code: '23P01',
      }),
    });
    expect(isPostgresExclusionError(wrapped)).toBe(true);
  });

  it('allows only one of two simultaneous bookings for the same slot', async () => {
    const stored: Array<{
      id: string;
      startsAt: Date;
      endsAt: Date;
      teamName: string;
      phone: string;
      status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
      source: 'online' | 'manual';
      priceFcfa: number;
      depositFcfa: number;
      expiresAt: Date | null;
      createdAt: Date;
    }> = [];

    const mockDb = {
      update: () => ({
        set: () => ({
          where: async () => [],
        }),
      }),
      select: () => ({
        from: () => ({
          where: async () =>
            stored.filter((r) => r.status === 'pending' || r.status === 'confirmed'),
        }),
      }),
      insert: () => ({
        values: (vals: {
          startsAt: Date;
          endsAt: Date;
          teamName: string;
          phone: string;
          status: 'pending';
          source: 'online';
          priceFcfa: number;
          depositFcfa: number;
          expiresAt: Date;
        }) => ({
          returning: async () => {
            const overlaps = stored.some(
              (r) =>
                (r.status === 'pending' || r.status === 'confirmed') &&
                r.startsAt.getTime() < vals.endsAt.getTime() &&
                r.endsAt.getTime() > vals.startsAt.getTime()
            );
            if (overlaps) {
              throw new Error('Failed query', {
                cause: Object.assign(new Error('exclusion violation'), {
                  code: '23P01',
                }),
              });
            }
            const row = {
              id: `11111111-1111-4111-8111-11111111111${stored.length + 1}`,
              startsAt: vals.startsAt,
              endsAt: vals.endsAt,
              teamName: vals.teamName,
              phone: vals.phone,
              status: 'pending' as const,
              source: 'online' as const,
              priceFcfa: vals.priceFcfa,
              depositFcfa: vals.depositFcfa,
              expiresAt: vals.expiresAt,
              createdAt: new Date(),
            };
            stored.push(row);
            return [row];
          },
        }),
      }),
    } as unknown as Database;

    const fixedNow = new Date('2026-11-20T10:00:00.000Z');
    const [res1, res2] = await Promise.all([
      createBooking(
        { date: '2026-11-21', hour: 19, teamName: 'Aigles FC', phone: '0197111111' },
        mockDb,
        fixedNow
      ),
      createBooking(
        { date: '2026-11-21', hour: 19, teamName: 'Lions FC', phone: '0197222222' },
        mockDb,
        fixedNow
      ),
    ]);

    const successes = [res1, res2].filter((r) => r.ok);
    const failures = [res1, res2].filter((r) => !r.ok);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    if (!failures[0].ok) {
      expect(failures[0].code).toBe('SLOT_TAKEN');
      expect(failures[0].error).toBe("Ce créneau vient d'être pris");
    }

    const slots = await getDaySlots('2026-11-21', mockDb, fixedNow);
    expect(slots).toHaveLength(24);
    expect(slots[19]?.state).toBe('taken');
  });
});
