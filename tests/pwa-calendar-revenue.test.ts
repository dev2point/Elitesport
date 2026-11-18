import { describe, expect, it } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import manifest from '@/app/manifest';
import type { Database } from '@/src/db';
import { getAdminRevenueStats } from '@/src/lib/admin-bookings';
import {
  buildBookingIcsContent,
  buildGoogleCalendarUrl,
} from '@/src/lib/calendar';
import {
  getPortoNovoMonthRange,
  getPortoNovoWeekRange,
} from '@/src/lib/timezone';

describe('PWA manifest and icons', () => {
  it('defines required manifest fields and theme color #1f5d3a', () => {
    const m = manifest();
    expect(m.id).toBe('/');
    expect(m.start_url).toBe('/');
    expect(m.scope).toBe('/');
    expect(m.display).toBe('standalone');
    expect(m.theme_color).toBe('#1f5d3a');
    expect(m.background_color).toBe('#f8f7f2');
    expect((m.short_name ?? '').length).toBeLessThanOrEqual(12);
    expect(m.icons?.some((i) => i.sizes === '192x192' && i.purpose === 'any')).toBe(true);
    expect(m.icons?.some((i) => i.sizes === '512x512' && i.purpose === 'any')).toBe(true);
    expect(m.icons?.some((i) => i.sizes === '512x512' && i.purpose === 'maskable')).toBe(true);
  });

  it('has valid PNG icon assets and SVG icon in public/', () => {
    const pngFiles = [
      'pwa-192x192.png',
      'pwa-512x512.png',
      'pwa-maskable-512x512.png',
      'apple-touch-icon.png',
    ];
    for (const file of pngFiles) {
      const buf = fs.readFileSync(path.join(process.cwd(), 'public', file));
      expect(buf.subarray(0, 8)).toEqual(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
      );
    }
    expect(fs.existsSync(path.join(process.cwd(), 'public', 'icon.svg'))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'public', 'sw.js'))).toBe(true);
  });
});

describe('Calendar ICS and Google Calendar generation', () => {
  it('generates valid RFC 5545 VCALENDAR event and Google Calendar URL', () => {
    const booking = {
      id: '11111111-1111-4111-8111-111111111111',
      reference: 'ESG-111111',
      teamName: 'FC Godomey',
      startsAtIso: '2026-11-20T17:00:00.000Z',
      endsAtIso: '2026-11-20T18:00:00.000Z',
      priceFcfa: 7500,
      depositFcfa: 2250,
    };

    const ics = buildBookingIcsContent(booking);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART:20261120T170000Z');
    expect(ics).toContain('DTEND:20261120T180000Z');
    expect(ics).toContain('FC Godomey');
    expect(ics).toContain('END:VCALENDAR');

    const gUrl = buildGoogleCalendarUrl(booking);
    expect(gUrl).toContain('https://calendar.google.com/calendar/render');
    expect(gUrl).toContain('20261120T170000Z%2F20261120T180000Z');
  });
});

describe('Admin day / week / month revenue stats', () => {
  it('computes Porto-Novo week (Mon-Sun) and month boundaries accurately', () => {
    // 2026-11-18 is Wednesday -> Monday is 2026-11-16, next Monday is 2026-11-23
    const week = getPortoNovoWeekRange('2026-11-18');
    expect(week.start.toISOString()).toBe('2026-11-15T23:00:00.000Z');
    expect(week.end.toISOString()).toBe('2026-11-22T23:00:00.000Z');

    const month = getPortoNovoMonthRange('2026-11-18');
    expect(month.start.toISOString()).toBe('2026-10-31T23:00:00.000Z');
    expect(month.end.toISOString()).toBe('2026-11-30T23:00:00.000Z');
  });

  it('aggregates day, week, and month revenue from confirmed/completed bookings', async () => {
    const rows = [
      // Today (2026-11-18 18:00+01:00 = 17:00Z)
      { startsAt: new Date('2026-11-18T17:00:00.000Z'), priceFcfa: 7500, depositFcfa: 2250 },
      // Same week, different day (2026-11-16 10:00+01:00 = 09:00Z)
      { startsAt: new Date('2026-11-16T09:00:00.000Z'), priceFcfa: 5000, depositFcfa: 1500 },
      // Same month, previous week (2026-11-05 14:00+01:00 = 13:00Z)
      { startsAt: new Date('2026-11-05T13:00:00.000Z'), priceFcfa: 5000, depositFcfa: 1500 },
    ];

    const mockDb = {
      select: () => ({
        from: () => ({
          where: async () => rows,
        }),
      }),
    } as unknown as Database;

    const stats = await getAdminRevenueStats('2026-11-18', mockDb);
    expect(stats.day).toEqual({ totalFcfa: 7500, depositFcfa: 2250, count: 1 });
    expect(stats.week).toEqual({ totalFcfa: 12500, depositFcfa: 3750, count: 2 });
    expect(stats.month).toEqual({ totalFcfa: 17500, depositFcfa: 5250, count: 3 });
  });
});
