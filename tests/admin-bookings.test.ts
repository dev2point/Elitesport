import { describe, expect, it } from 'bun:test';
import type { Database } from '@/src/db';
import {
  extractPhoneDigitsForWhatsapp,
  getAdminDayBookings,
  transitionBookingStatus,
} from '@/src/lib/admin-bookings';
import { formatPortoNovoSlotRangeFromDates } from '@/src/lib/timezone';

describe('Admin Porto-Novo formatting', () => {
  it('formats slot hours in +01:00 regardless of server timezone', () => {
    const startsAt = new Date('2026-11-18T17:00:00.000Z'); // 18:00 Porto-Novo
    const endsAt = new Date('2026-11-18T18:00:00.000Z'); // 19:00 Porto-Novo
    expect(formatPortoNovoSlotRangeFromDates(startsAt, endsAt)).toBe('18h–19h');
  });

  it('extracts clean digits for wa.me links', () => {
    expect(extractPhoneDigitsForWhatsapp('+2290197123456')).toBe('2290197123456');
  });
});

describe('Admin booking status transitions & day listing', () => {
  it('rejects non-UUID booking IDs', async () => {
    const res = await transitionBookingStatus('not-a-uuid', 'confirm');
    expect(res.ok).toBe(false);
  });

  it('validates allowed transitions (pending -> confirmed -> completed, cannot cancel completed)', async () => {
    const validId = '11111111-1111-4111-8111-111111111111';
    const store = {
      id: validId,
      startsAt: new Date('2026-11-18T17:00:00.000Z'),
      endsAt: new Date('2026-11-18T18:00:00.000Z'),
      teamName: 'FC Étoiles',
      phone: '+2290197000000',
      status: 'pending' as 'pending' | 'confirmed' | 'cancelled' | 'completed',
      source: 'online' as const,
      priceFcfa: 25000,
      expiresAt: new Date('2026-11-18T12:00:00.000Z') as Date | null,
    };

    const mockDb = {
      update: () => ({
        set: (values: Record<string, unknown>) => ({
          where: () => {
            const ret = {
              returning: async () => {
                if (store.status === 'pending') {
                  store.status = 'confirmed';
                  store.expiresAt = null;
                  return [{ id: store.id }];
                }
                return [];
              },
            };
            if ('expiresAt' in values && values.expiresAt === null) {
              return ret;
            }
            if (store.status === 'confirmed') {
              store.status = 'completed';
            }
            return Promise.resolve([]);
          },
        }),
      }),
      select: () => ({
        from: () => ({
          where: () => {
            const chain = {
              limit: async () => [{ id: store.id, status: store.status }],
              orderBy: async () => [store],
            };
            return chain;
          },
        }),
      }),
    } as unknown as Database;

    const list = await getAdminDayBookings(
      '2026-11-18',
      mockDb,
      new Date('2026-11-18T11:50:00.000Z')
    );
    expect(list).toHaveLength(1);
    expect(list[0]?.timeLabel).toBe('18h–19h');
    expect(list[0]?.whatsappDigits).toBe('2290197000000');
    expect(list[0]?.priceFcfa).toBe(25000);
    expect(list[0]).not.toHaveProperty('depositFcfa');

    const confirmRes = await transitionBookingStatus(validId, 'confirm', mockDb);
    expect(confirmRes).toEqual({ ok: true, status: 'confirmed' });
    expect(store.expiresAt).toBeNull();

    const completeRes = await transitionBookingStatus(validId, 'complete', mockDb);
    expect(completeRes).toEqual({ ok: true, status: 'completed' });

    const cancelCompleted = await transitionBookingStatus(validId, 'cancel', mockDb);
    expect(cancelCompleted.ok).toBe(false);
  });
});
