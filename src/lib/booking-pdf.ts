import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import type { BookingDetails } from './bookings';
import { DEPOSIT_PERCENTAGE, formatFcfa } from './pricing';

const PAGE_WIDTH = 420; // A5 portrait width (pt)
const PAGE_HEIGHT = 595; // A5 portrait height (pt)

/**
 * Normalizes text into safe WinAnsi (CP1252) characters supported by pdf-lib standard fonts,
 * replacing narrow non-breaking spaces (\u202f) and stripping unsupported symbols/emojis.
 */
export function normalizeWinAnsiText(value: string): string {
  const normalized = value
    .replace(/[\u00a0\u202f\u2007]/g, ' ')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7e\u00a1-\u00ff]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

export function resolveBookingQrUrl(
  bookingId: string,
  preferredOrigin?: string
): string {
  const candidates = [
    preferredOrigin,
    process.env.APP_URL,
    process.env.BETTER_AUTH_URL,
    'http://localhost:3000',
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const trimmed = candidate.trim();
    if (!trimmed || trimmed === 'MY_APP_URL') continue;
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return `${parsed.origin}/reservation/${bookingId}`;
      }
    } catch {
      // Try next candidate
    }
  }

  return `http://localhost:3000/reservation/${bookingId}`;
}

export async function generateBookingQrPng(qrPayload: string): Promise<Uint8Array> {
  const buffer = await QRCode.toBuffer(qrPayload, {
    type: 'png',
    width: 360,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#16231b',
      light: '#ffffff',
    },
  });
  return new Uint8Array(buffer);
}

function getPdfStatusMeta(status: BookingDetails['status']): {
  label: string;
  bg: ReturnType<typeof rgb>;
  fg: ReturnType<typeof rgb>;
} {
  switch (status) {
    case 'confirmed':
      return {
        label: 'RESERVATION CONFIRMEE',
        bg: rgb(0.122, 0.365, 0.227), // #1f5d3a
        fg: rgb(1, 1, 1),
      };
    case 'completed':
      return {
        label: 'MATCH TERMINE',
        bg: rgb(0.122, 0.365, 0.227),
        fg: rgb(1, 1, 1),
      };
    case 'pending':
      return {
        label: 'CRENEAU BLOQUE 15 MIN - ACOMPTE REQUIS',
        bg: rgb(0.788, 0.278, 0.02), // #c94705
        fg: rgb(1, 1, 1),
      };
    case 'cancelled':
      return {
        label: 'RESERVATION ANNULEE OU EXPIREE',
        bg: rgb(0.353, 0.4, 0.365),
        fg: rgb(1, 1, 1),
      };
  }
}

function fitText(text: string, maxChars: number): string {
  const safe = normalizeWinAnsiText(text);
  if (safe.length <= maxChars) return safe;
  return `${safe.slice(0, Math.max(1, maxChars - 3))}...`;
}

export async function generateBookingPdf(
  booking: BookingDetails,
  qrPayload: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(normalizeWinAnsiText(`Fiche de reservation ${booking.reference}`));
  pdfDoc.setAuthor('Elite Sport Godomey');
  pdfDoc.setSubject(
    normalizeWinAnsiText(`Reservation terrain ${booking.dateLabel} ${booking.timeLabel}`)
  );

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const colorChalk = rgb(0.973, 0.969, 0.949); // #f8f7f2
  const colorInk = rgb(0.086, 0.137, 0.106); // #16231b
  const colorMuted = rgb(0.353, 0.4, 0.365);
  const colorTurf = rgb(0.122, 0.365, 0.227); // #1f5d3a
  const colorLine = rgb(0.91, 0.349, 0.047); // #e8590c
  const colorBorder = rgb(0.84, 0.85, 0.82);
  const colorWhite = rgb(1, 1, 1);

  // Page background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: colorChalk,
  });

  // Top Header Band
  const headerHeight = 96;
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - headerHeight,
    width: PAGE_WIDTH,
    height: headerHeight,
    color: colorTurf,
  });

  // Orange pitch stripe under header
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - headerHeight - 4,
    width: PAGE_WIDTH,
    height: 4,
    color: colorLine,
  });

  const margin = 24;
  const contentWidth = PAGE_WIDTH - margin * 2;

  page.drawText('ELITE SPORT GODOMEY', {
    x: margin,
    y: PAGE_HEIGHT - 30,
    size: 11,
    font: fontBold,
    color: rgb(0.94, 0.96, 0.93),
  });

  page.drawText('FICHE DE RESERVATION', {
    x: margin,
    y: PAGE_HEIGHT - 56,
    size: 20,
    font: fontBold,
    color: colorWhite,
  });

  page.drawText('Godomey, Cotonou · Terrain synthetique 24h/24', {
    x: margin,
    y: PAGE_HEIGHT - 76,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.91, 0.93, 0.9),
  });

  // Reference badge on top-right of header
  const refText = normalizeWinAnsiText(booking.reference);
  const refBadgeWidth = 98;
  const refBadgeX = PAGE_WIDTH - margin - refBadgeWidth;
  page.drawRectangle({
    x: refBadgeX,
    y: PAGE_HEIGHT - 64,
    width: refBadgeWidth,
    height: 36,
    color: rgb(0.086, 0.137, 0.106),
    borderColor: colorLine,
    borderWidth: 1,
  });

  page.drawText('REFERENCE', {
    x: refBadgeX + 10,
    y: PAGE_HEIGHT - 41,
    size: 7,
    font: fontBold,
    color: rgb(0.82, 0.85, 0.83),
  });

  page.drawText(refText, {
    x: refBadgeX + 10,
    y: PAGE_HEIGHT - 56,
    size: 11.5,
    font: fontBold,
    color: colorWhite,
  });

  // Status banner
  const statusMeta = getPdfStatusMeta(booking.status);
  const statusBarY = PAGE_HEIGHT - headerHeight - 36;
  page.drawRectangle({
    x: margin,
    y: statusBarY,
    width: contentWidth,
    height: 24,
    color: statusMeta.bg,
  });
  page.drawText(statusMeta.label, {
    x: margin + 10,
    y: statusBarY + 8,
    size: 9.5,
    font: fontBold,
    color: statusMeta.fg,
  });

  // Main details card
  const cardTop = statusBarY - 12;
  const cardHeight = 236;
  const cardBottom = cardTop - cardHeight;
  page.drawRectangle({
    x: margin,
    y: cardBottom,
    width: contentWidth,
    height: cardHeight,
    color: colorWhite,
    borderColor: colorBorder,
    borderWidth: 1,
  });

  const rows: Array<{ label: string; value: string; highlight?: 'turf' | 'bold' }> = [
    { label: 'Equipe', value: fitText(booking.teamName, 34), highlight: 'bold' },
    { label: 'Date', value: fitText(booking.dateLabel, 34) },
    { label: 'Creneau', value: fitText(booking.timeLabel, 24), highlight: 'bold' },
    { label: 'Lieu', value: 'Elite Sport Godomey, Cotonou' },
    {
      label: 'Tarif terrain (1h)',
      value: normalizeWinAnsiText(formatFcfa(booking.priceFcfa)),
      highlight: 'bold',
    },
    {
      label: `Acompte (${DEPOSIT_PERCENTAGE} %)`,
      value: normalizeWinAnsiText(formatFcfa(booking.depositFcfa)),
      highlight: 'turf',
    },
    {
      label: 'Solde sur place',
      value: normalizeWinAnsiText(formatFcfa(booking.remainingFcfa)),
      highlight: 'bold',
    },
  ];

  const rowHeight = 31;
  let currentY = cardTop - 25;

  rows.forEach((row, index) => {
    page.drawText(row.label, {
      x: margin + 14,
      y: currentY,
      size: 9.5,
      font: fontRegular,
      color: colorMuted,
    });

    const valueFont = row.highlight ? fontBold : fontRegular;
    const valueSize = row.label === 'Creneau' ? 11.5 : 10;
    const valueWidth = valueFont.widthOfTextAtSize(row.value, valueSize);
    const valueColor = row.highlight === 'turf' ? colorTurf : colorInk;

    page.drawText(row.value, {
      x: margin + contentWidth - 14 - valueWidth,
      y: currentY,
      size: valueSize,
      font: valueFont,
      color: valueColor,
    });

    if (index < rows.length - 1) {
      const dividerY = currentY - 11;
      page.drawLine({
        start: { x: margin + 12, y: dividerY },
        end: { x: margin + contentWidth - 12, y: dividerY },
        thickness: 0.6,
        color: rgb(0.9, 0.91, 0.89),
      });
    }

    currentY -= rowHeight;
  });

  // QR Verification Box
  const qrPngBytes = await generateBookingQrPng(qrPayload);
  const qrImage = await pdfDoc.embedPng(qrPngBytes);

  const qrBoxTop = cardBottom - 14;
  const qrBoxHeight = 148;
  const qrBoxBottom = qrBoxTop - qrBoxHeight;

  page.drawRectangle({
    x: margin,
    y: qrBoxBottom,
    width: contentWidth,
    height: qrBoxHeight,
    color: colorWhite,
    borderColor: colorTurf,
    borderWidth: 1.2,
  });

  const qrSize = 116;
  const qrX = margin + 16;
  const qrY = qrBoxBottom + (qrBoxHeight - qrSize) / 2;

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  const infoX = qrX + qrSize + 16;
  const infoTopY = qrBoxTop - 28;

  page.drawText("CODE QR DE CONTROLE", {
    x: infoX,
    y: infoTopY,
    size: 11,
    font: fontBold,
    color: colorTurf,
  });

  const instructions = [
    "Presentez cette fiche au terrain 10 min",
    "avant le coup d'envoi.",
    "",
    "Le gerant scanne ce code QR pour",
    "verifier le statut en direct.",
  ];

  let textY = infoTopY - 20;
  for (const line of instructions) {
    if (line.length > 0) {
      page.drawText(line, {
        x: infoX,
        y: textY,
        size: 9.2,
        font: fontRegular,
        color: colorInk,
      });
    }
    textY -= 13;
  }

  page.drawText(`Ref. : ${refText}`, {
    x: infoX,
    y: qrBoxBottom + 20,
    size: 9.5,
    font: fontBold,
    color: colorLine,
  });

  // Footer
  page.drawText(
    "Elite Sport Godomey · Fiche generee automatiquement · Mobile Money & especes acceptes",
    {
      x: margin,
      y: 22,
      size: 7.8,
      font: fontRegular,
      color: colorMuted,
    }
  );

  return pdfDoc.save();
}
