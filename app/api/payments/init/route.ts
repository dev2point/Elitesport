import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb, isDatabaseConfigured } from '@/src/db';
import { bookings, payments } from '@/src/db/schema';
import {
  buildBookingReference,
  expirePendingBookings,
  extractDbErrorDetails,
} from '@/src/lib/bookings';
import { initiateFeexPayPayment } from '@/src/lib/feexpay';
import { hasSuccessfulFullPayment } from '@/src/lib/payment-ledger';
import { processVerifiedFeexPayTransaction } from '@/src/lib/payments';
import { bookingIdSchema, normalizeBeninPhone } from '@/src/lib/validations';

const PAYMENTS_TABLE_MISSING_ERROR =
  'La table des paiements est absente. Exécutez sql/003_payments.sql dans Supabase.';

const paymentPhoneSchema = z.string().trim().transform((val, ctx) => {
  const normalized = normalizeBeninPhone(val);
  if (!normalized) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'Numéro Mobile Money invalide (8 chiffres ou 10 chiffres commençant par 01).',
    });
    return z.NEVER;
  }
  return normalized;
});

const initPaymentSchema = z.object({
  bookingId: bookingIdSchema,
  channel: z.enum(['mtn', 'moov', 'celtiis', 'card']),
  phone: paymentPhoneSchema.optional(),
});

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Service momentanément indisponible.' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Requête invalide.' },
      { status: 400 }
    );
  }

  const parsed = initPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error:
          parsed.error.issues[0]?.message ?? 'Données de paiement invalides.',
      },
      { status: 400 }
    );
  }

  const { bookingId, channel } = parsed.data;
  const db = getDb();
  const now = new Date();

  try {
    await expirePendingBookings(db, now);

    const [booking] = await db
      .select({
        id: bookings.id,
        status: bookings.status,
        priceFcfa: bookings.priceFcfa,
        phone: bookings.phone,
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: 'Réservation introuvable.' },
        { status: 404 }
      );
    }

    if (booking.status === 'confirmed' || booking.status === 'completed') {
      return NextResponse.json(
        {
          ok: true,
          status: 'successful',
          bookingId: booking.id,
          amountFcfa: booking.priceFcfa,
        },
        { status: 200 }
      );
    }

    if (booking.status !== 'pending') {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Ce créneau a expiré ou a été annulé. Veuillez choisir un nouvel horaire.',
        },
        { status: 409 }
      );
    }

    let alreadyPaid: boolean;
    try {
      alreadyPaid = await hasSuccessfulFullPayment(db, booking.id, booking.priceFcfa);
    } catch (ledgerError) {
      const details = extractDbErrorDetails(ledgerError);
      if (details.code === '42P01') {
        return NextResponse.json(
          { ok: false, error: PAYMENTS_TABLE_MISSING_ERROR },
          { status: 503 }
        );
      }
      throw ledgerError;
    }

    if (alreadyPaid) {
      return NextResponse.json(
        {
          ok: true,
          status: 'successful',
          bookingId: booking.id,
          amountFcfa: booking.priceFcfa,
        },
        { status: 200 }
      );
    }

    let resolvedPhone = booking.phone;
    if (channel !== 'card') {
      const phoneCheck = paymentPhoneSchema.safeParse(parsed.data.phone ?? booking.phone);
      if (!phoneCheck.success) {
        return NextResponse.json(
          {
            ok: false,
            error:
              phoneCheck.error.issues[0]?.message ??
              'Numéro Mobile Money invalide (8 chiffres ou 10 chiffres commençant par 01).',
          },
          { status: 400 }
        );
      }
      resolvedPhone = phoneCheck.data;
    }

    const bookingReference = buildBookingReference(booking.id);
    const initResult = await initiateFeexPayPayment({
      bookingId: booking.id,
      bookingReference,
      amountFcfa: booking.priceFcfa,
      phone: resolvedPhone,
      channel,
    });

    if (!initResult.ok || !initResult.reference) {
      return NextResponse.json(
        {
          ok: false,
          error:
            initResult.error ??
            'Le paiement en ligne n’a pas pu démarrer. Confirmez sur WhatsApp ci-dessous.',
        },
        { status: 502 }
      );
    }

    // Record the full-payment intent for idempotency & audit.
    try {
      await db
        .insert(payments)
        .values({
          bookingId: booking.id,
          amountFcfa: booking.priceFcfa,
          operator: initResult.operator,
          transactionRef: initResult.reference,
          status: 'pending',
          rawStatus: initResult.status ?? 'PENDING',
          updatedAt: now,
        })
        .onConflictDoNothing();
    } catch (auditError) {
      const details = extractDbErrorDetails(auditError);
      if (details.code === '42P01') {
        return NextResponse.json(
          { ok: false, error: PAYMENTS_TABLE_MISSING_ERROR },
          { status: 503 }
        );
      }
      console.warn(
        'FeexPay payment audit insert skipped:',
        details.code ?? 'UNKNOWN',
        details.message
      );
    }

    if (initResult.paymentUrl) {
      return NextResponse.json(
        {
          ok: true,
          status: 'redirect',
          reference: initResult.reference,
          paymentUrl: initResult.paymentUrl,
          amountFcfa: booking.priceFcfa,
        },
        { status: 200 }
      );
    }

    if (initResult.status === 'SUCCESSFUL') {
      const verified = await processVerifiedFeexPayTransaction({
        reference: initResult.reference,
        bookingIdHint: booking.id,
      });
      if (verified.ok && verified.paymentStatus === 'successful') {
        return NextResponse.json(
          {
            ok: true,
            status: 'successful',
            reference: initResult.reference,
            bookingId: booking.id,
            amountFcfa: verified.amountFcfa,
          },
          { status: 200 }
        );
      }
    }

    if (initResult.status === 'FAILED') {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Le paiement n’a pas été accepté. Réessayez ou confirmez sur WhatsApp.',
        },
        { status: 402 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        status: 'pending',
        reference: initResult.reference,
        amountFcfa: booking.priceFcfa,
      },
      { status: 200 }
    );
  } catch (error) {
    const details = extractDbErrorDetails(error);
    if (details.code === '42P01') {
      return NextResponse.json(
        { ok: false, error: PAYMENTS_TABLE_MISSING_ERROR },
        { status: 503 }
      );
    }
    console.warn(
      'Payment init route failed:',
      details.code ?? 'UNKNOWN',
      details.message
    );
    return NextResponse.json(
      {
        ok: false,
        error:
          'Le paiement en ligne est momentanément indisponible. Confirmez sur WhatsApp.',
      },
      { status: 500 }
    );
  }
}
