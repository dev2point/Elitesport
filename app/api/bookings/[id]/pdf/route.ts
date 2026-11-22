import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/src/db';
import { getBookingById } from '@/src/lib/bookings';
import { generateBookingPdf, resolveBookingQrUrl } from '@/src/lib/booking-pdf';
import { bookingIdSchema } from '@/src/lib/validations';

const SAFE_HOST_REGEX = /^[a-zA-Z0-9.-]+(:\d{1,5})?$/;

function resolveRequestOrigin(req: NextRequest): string | undefined {
  const forwardedHost = req.headers
    .get('x-forwarded-host')
    ?.split(',')[0]
    ?.trim();
  const hostHeader = req.headers.get('host')?.trim();
  const candidateHost = forwardedHost || hostHeader;

  if (candidateHost && SAFE_HOST_REGEX.test(candidateHost)) {
    const rawProto = req.headers
      .get('x-forwarded-proto')
      ?.split(',')[0]
      ?.trim()
      ?.toLowerCase();
    const proto = rawProto === 'http' || rawProto === 'https'
      ? rawProto
      : candidateHost.startsWith('localhost') || candidateHost.startsWith('127.0.0.1')
        ? 'http'
        : 'https';
    return `${proto}://${candidateHost}`;
  }

  return req.nextUrl.origin;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Service momentanément indisponible.' },
      { status: 503 }
    );
  }

  const { id } = await context.params;
  const parsed = bookingIdSchema.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Identifiant de réservation invalide.' },
      { status: 400 }
    );
  }

  const booking = await getBookingById(parsed.data);
  if (!booking) {
    return NextResponse.json(
      { ok: false, error: 'Réservation introuvable.' },
      { status: 404 }
    );
  }

  const requestOrigin = resolveRequestOrigin(req);
  const qrUrl = resolveBookingQrUrl(booking.id, requestOrigin);
  const pdfBytes = await generateBookingPdf(booking, qrUrl);

  const safeRef = booking.reference.replace(/[^A-Z0-9-]/g, '');

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="fiche-reservation-${safeRef}.pdf"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
