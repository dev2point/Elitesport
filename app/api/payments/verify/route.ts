import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { processVerifiedFeexPayTransaction } from '@/src/lib/payments';

const verifyRequestSchema = z.object({
  bookingId: z.string().uuid('Identifiant de réservation invalide.'),
  reference: z.string().trim().min(4).max(128),
});

export async function POST(req: NextRequest) {
  let rawJson: unknown;
  try {
    rawJson = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Corps JSON invalide.' },
      { status: 400 }
    );
  }

  const parsed = verifyRequestSchema.safeParse(rawJson);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: 'VALIDATION_ERROR',
        error: parsed.error.issues[0]?.message ?? 'Paramètres invalides.',
      },
      { status: 400 }
    );
  }

  const result = await processVerifiedFeexPayTransaction({
    reference: parsed.data.reference,
    bookingIdHint: parsed.data.bookingId,
  });

  if (!result.ok) {
    const status =
      result.code === 'NOT_CONFIGURED' ||
      result.code === 'UPSTREAM_ERROR' ||
      result.code === 'INTERNAL_ERROR'
        ? 503
        : result.code === 'BOOKING_NOT_FOUND' ||
            result.code === 'TRANSACTION_NOT_FOUND'
          ? 404
          : 422;

    return NextResponse.json(
      { ok: false, code: result.code, error: result.error },
      { status }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      idempotent: result.idempotent,
      paymentStatus: result.paymentStatus,
      bookingId: result.bookingId,
      bookingStatus: result.bookingStatus,
      operator: result.operator,
      amountFcfa: result.amountFcfa,
      transactionRef: result.transactionRef,
    },
    { status: 200 }
  );
}
