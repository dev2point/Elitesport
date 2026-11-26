import { describe, expect, it } from 'bun:test';
import { PDFDocument } from 'pdf-lib';
import type { BookingDetails } from '@/src/lib/bookings';
import { formatFcfa } from '@/src/lib/pricing';
import {
  generateBookingPdf,
  generateBookingQrPng,
  normalizeWinAnsiText,
  resolveBookingQrUrl,
} from '@/src/lib/booking-pdf';

describe('Booking PDF & QR code generation', () => {
  const sampleBooking: BookingDetails = {
    id: '11111111-1111-4111-8111-111111111111',
    reference: 'ESG-111111',
    dateStr: '2026-11-22',
    dateLabel: 'Dimanche 22 Nov 2026',
    timeLabel: '18h-19h',
    startsAtIso: '2026-11-22T17:00:00.000Z',
    endsAtIso: '2026-11-22T18:00:00.000Z',
    teamName: 'Équipe Étoile Bénin ⚽',
    phone: '0197000000',
    status: 'confirmed',
    priceFcfa: 25000,
    expiresAtIso: null,
  };

  it('sanitizes WinAnsi text and strips emojis or narrow spaces cleanly', () => {
    expect(normalizeWinAnsiText('25\u202f000\u00a0FCFA — Équipe ⚽')).toBe(
      '25 000 FCFA - Équipe'
    );
  });

  it('resolves safe canonical verification URLs for the QR payload', () => {
    expect(
      resolveBookingQrUrl(sampleBooking.id, 'https://elitesport.bj')
    ).toBe(`https://elitesport.bj/reservation/${sampleBooking.id}`);

    expect(
      resolveBookingQrUrl(sampleBooking.id, 'javascript:alert(1)')
    ).toContain(`/reservation/${sampleBooking.id}`);
  });

  it('generates a valid PNG QR buffer and loadable single-page A5 PDF document', async () => {
    const qrUrl = resolveBookingQrUrl(sampleBooking.id, 'https://elitesport.bj');
    const qrPng = await generateBookingQrPng(qrUrl);

    // PNG magic bytes: 89 50 4E 47
    expect(qrPng[0]).toBe(0x89);
    expect(qrPng[1]).toBe(0x50);
    expect(qrPng[2]).toBe(0x4e);
    expect(qrPng[3]).toBe(0x47);

    const pdfBytes = await generateBookingPdf(sampleBooking, qrUrl);
    const header = Buffer.from(pdfBytes.slice(0, 5)).toString('ascii');
    expect(header).toBe('%PDF-');

    const loaded = await PDFDocument.load(pdfBytes);
    expect(loaded.getPageCount()).toBe(1);
    expect(loaded.getTitle()).toBe('Fiche de reservation ESG-111111');
    expect(normalizeWinAnsiText(formatFcfa(sampleBooking.priceFcfa))).toBe(
      '25 000 FCFA'
    );
  });
});
