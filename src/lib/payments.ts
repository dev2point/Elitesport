import { and, eq, sql } from 'drizzle-orm';
import { getDb, type Database } from '@/src/db';
import { bookings, payments, type BookingStatus, type PaymentStatus } from '@/src/db/schema';
import {
  buildBookingReference,
  expirePendingBookings,
  extractDbErrorDetails,
} from './bookings';
import {
  fetchFeexPayTransactionStatus,
  type FeexPayVerificationResult,
  type FeexPayVerifiedTransaction,
} from './feexpay';
import { hasSuccessfulFullPayment } from './payment-ledger';
import { formatFcfa } from './pricing';
import { bookingIdSchema } from './validations';

const PAYMENTS_TABLE_MISSING_ERROR =
  'La table des paiements est absente. Exécutez sql/003_payments.sql dans Supabase avant de reprendre le paiement.';

export interface ProcessPaymentInput {
  reference: string;
  bookingIdHint?: string;
}

export type ProcessPaymentResult =
  | {
      ok: true;
      idempotent: boolean;
      paymentStatus: PaymentStatus;
      bookingId: string;
      bookingStatus: BookingStatus;
      amountFcfa: number;
      operator: string;
      transactionRef: string;
    }
  | {
      ok: false;
      code:
        | 'VALIDATION_ERROR'
        | 'NOT_CONFIGURED'
        | 'UPSTREAM_ERROR'
        | 'TRANSACTION_NOT_FOUND'
        | 'BOOKING_NOT_FOUND'
        | 'REFERENCE_MISMATCH'
        | 'AMOUNT_MISMATCH'
        | 'INTERNAL_ERROR';
      error: string;
    };

interface AuditPaymentParams {
  bookingId: string;
  amountFcfa: number;
  operator: string;
  transactionRef: string;
}

type ConfirmationOutcome =
  | { kind: 'recorded'; idempotent: boolean; bookingStatus: BookingStatus }
  | { kind: 'already_paid' };

function isPaymentsTableMissing(error: unknown): boolean {
  return extractDbErrorDetails(error).code === '42P01';
}

function mapPaymentStatus(
  normalizedStatus: FeexPayVerifiedTransaction['normalizedStatus']
): PaymentStatus {
  if (normalizedStatus === 'SUCCESSFUL') return 'successful';
  if (normalizedStatus === 'PENDING') return 'pending';
  return 'failed';
}

async function recordAmountMismatchAudit(
  db: Database,
  params: AuditPaymentParams,
  now: Date
): Promise<void> {
  try {
    await db
      .insert(payments)
      .values({
        bookingId: params.bookingId,
        amountFcfa: params.amountFcfa,
        operator: params.operator,
        transactionRef: params.transactionRef,
        status: 'failed',
        rawStatus: 'AMOUNT_MISMATCH',
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: payments.transactionRef,
        set: {
          amountFcfa: params.amountFcfa,
          operator: params.operator,
          status: 'failed',
          rawStatus: 'AMOUNT_MISMATCH',
          updatedAt: now,
        },
      });
  } catch (error) {
    if (isPaymentsTableMissing(error)) {
      throw error;
    }
    const details = extractDbErrorDetails(error);
    console.warn(
      'Amount mismatch payment audit skipped:',
      details.code ?? 'UNKNOWN',
      details.message
    );
  }
}

function resolveBookingIdentifiers(tx: FeexPayVerifiedTransaction): {
  bookingIdFromInfo: string | null;
  bookingRefCandidates: string[];
} {
  const rawBookingId = tx.callbackInfo.bookingId;
  const parsedId =
    typeof rawBookingId === 'string' ? bookingIdSchema.safeParse(rawBookingId) : null;

  const refCandidates: string[] = [];
  for (const val of [
    tx.callbackInfo.reference,
    tx.customId,
    tx.orderId,
    tx.reference,
  ]) {
    if (typeof val === 'string') {
      const trimmed = val.trim().toUpperCase();
      if (/^ESG-[A-F0-9]{6}$/.test(trimmed)) {
        refCandidates.push(trimmed);
      }
    }
  }

  return {
    bookingIdFromInfo: parsedId?.success ? parsedId.data : null,
    bookingRefCandidates: refCandidates,
  };
}

function doesTransactionMatchBooking(
  tx: FeexPayVerifiedTransaction,
  bookingId: string,
  bookingReference: string,
  existingPaymentBookingId: string | null
): boolean {
  if (existingPaymentBookingId && existingPaymentBookingId === bookingId) {
    return true;
  }

  const { bookingIdFromInfo, bookingRefCandidates } = resolveBookingIdentifiers(tx);
  if (bookingIdFromInfo) {
    return bookingIdFromInfo === bookingId;
  }

  if (bookingRefCandidates.length > 0) {
    return bookingRefCandidates.includes(bookingReference.toUpperCase());
  }

  return false;
}

/**
 * Authoritatively verifies a FeexPay transaction against FeexPay's REST API,
 * requires the exact full slot price, records the `payments` row idempotently,
 * and transitions a `pending` booking to `confirmed` inside a DB transaction.
 */
export async function processVerifiedFeexPayTransaction(
  input: ProcessPaymentInput,
  deps?: {
    db?: Database;
    verifyTransaction?: (reference: string) => Promise<FeexPayVerificationResult>;
    now?: Date;
  }
): Promise<ProcessPaymentResult> {
  const reference = input.reference?.trim();
  if (!reference || reference.length < 4 || reference.length > 128) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      error: 'Référence de transaction invalide.',
    };
  }

  let db: Database;
  try {
    db = deps?.db ?? getDb();
  } catch {
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Base de données indisponible.',
    };
  }

  const now = deps?.now ?? new Date();

  try {
    // 1. Fast idempotency check: this transactionRef was already fully paid.
    let existingPayment:
      | {
          id: string;
          bookingId: string;
          amountFcfa: number;
          operator: string;
          transactionRef: string;
          status: PaymentStatus;
        }
      | undefined;

    try {
      [existingPayment] = await db
        .select({
          id: payments.id,
          bookingId: payments.bookingId,
          amountFcfa: payments.amountFcfa,
          operator: payments.operator,
          transactionRef: payments.transactionRef,
          status: payments.status,
        })
        .from(payments)
        .where(eq(payments.transactionRef, reference))
        .limit(1);
    } catch (lookupError) {
      if (isPaymentsTableMissing(lookupError)) {
        return {
          ok: false,
          code: 'INTERNAL_ERROR',
          error: PAYMENTS_TABLE_MISSING_ERROR,
        };
      }
      throw lookupError;
    }

    if (existingPayment && existingPayment.status === 'successful') {
      const [existingBooking] = await db
        .select({
          id: bookings.id,
          status: bookings.status,
          priceFcfa: bookings.priceFcfa,
        })
        .from(bookings)
        .where(eq(bookings.id, existingPayment.bookingId))
        .limit(1);

      if (!existingBooking) {
        return {
          ok: false,
          code: 'BOOKING_NOT_FOUND',
          error: 'Réservation introuvable.',
        };
      }

      if (existingPayment.amountFcfa !== existingBooking.priceFcfa) {
        return {
          ok: false,
          code: 'AMOUNT_MISMATCH',
          error: `Paiement enregistré (${formatFcfa(existingPayment.amountFcfa)}) incorrect. Montant attendu : ${formatFcfa(existingBooking.priceFcfa)}.`,
        };
      }

      return {
        ok: true,
        idempotent: true,
        paymentStatus: 'successful',
        bookingId: existingPayment.bookingId,
        bookingStatus: existingBooking.status,
        amountFcfa: existingPayment.amountFcfa,
        operator: existingPayment.operator,
        transactionRef: existingPayment.transactionRef,
      };
    }

    // 2. Never trust incoming body/client — verify directly against FeexPay API.
    const verifyFn =
      deps?.verifyTransaction ?? ((ref) => fetchFeexPayTransactionStatus(ref));
    const verification = await verifyFn(reference);

    if (!verification.ok) {
      if (verification.code === 'NOT_CONFIGURED') {
        return { ok: false, code: 'NOT_CONFIGURED', error: verification.error };
      }
      if (verification.code === 'NOT_FOUND') {
        return {
          ok: false,
          code: 'TRANSACTION_NOT_FOUND',
          error: verification.error,
        };
      }
      if (verification.code === 'INVALID_REFERENCE') {
        return { ok: false, code: 'VALIDATION_ERROR', error: verification.error };
      }
      return { ok: false, code: 'UPSTREAM_ERROR', error: verification.error };
    }

    const verifiedTx = verification.transaction;

    // 3. Locate the linked booking.
    const { bookingIdFromInfo } = resolveBookingIdentifiers(verifiedTx);
    const hintParsed = input.bookingIdHint
      ? bookingIdSchema.safeParse(input.bookingIdHint)
      : null;

    const targetBookingId =
      existingPayment?.bookingId ??
      bookingIdFromInfo ??
      (hintParsed?.success ? hintParsed.data : null);

    if (!targetBookingId) {
      return {
        ok: false,
        code: 'BOOKING_NOT_FOUND',
        error: 'Aucune réservation associée à cette référence FeexPay.',
      };
    }

    await expirePendingBookings(db, now);

    const [booking] = await db
      .select({
        id: bookings.id,
        status: bookings.status,
        priceFcfa: bookings.priceFcfa,
      })
      .from(bookings)
      .where(eq(bookings.id, targetBookingId))
      .limit(1);

    if (!booking) {
      return {
        ok: false,
        code: 'BOOKING_NOT_FOUND',
        error: 'Réservation introuvable.',
      };
    }

    const bookingReference = buildBookingReference(booking.id);

    // 4. Verify the transaction explicitly belongs to this booking.
    if (
      !doesTransactionMatchBooking(
        verifiedTx,
        booking.id,
        bookingReference,
        existingPayment?.bookingId ?? null
      )
    ) {
      return {
        ok: false,
        code: 'REFERENCE_MISMATCH',
        error: 'La référence de transaction ne correspond pas à cette réservation.',
      };
    }

    // 5. Full-payment-only guard: exact integer amount, no prior full payment.
    let alreadyPaid: boolean;
    try {
      alreadyPaid = await hasSuccessfulFullPayment(
        db,
        booking.id,
        booking.priceFcfa,
        verifiedTx.reference
      );
    } catch (ledgerError) {
      if (isPaymentsTableMissing(ledgerError)) {
        return {
          ok: false,
          code: 'INTERNAL_ERROR',
          error: PAYMENTS_TABLE_MISSING_ERROR,
        };
      }
      throw ledgerError;
    }

    const amountIsExact =
      Number.isInteger(verifiedTx.amountFcfa) && verifiedTx.amountFcfa === booking.priceFcfa;

    if (
      alreadyPaid ||
      (verifiedTx.normalizedStatus === 'SUCCESSFUL' && !amountIsExact)
    ) {
      await recordAmountMismatchAudit(
        db,
        {
          bookingId: booking.id,
          amountFcfa: verifiedTx.amountFcfa,
          operator: verifiedTx.operator,
          transactionRef: verifiedTx.reference,
        },
        now
      );

      if (alreadyPaid) {
        return {
          ok: false,
          code: 'AMOUNT_MISMATCH',
          error: `Le montant total est déjà réglé (${formatFcfa(booking.priceFcfa)}). Aucun second paiement n'est attendu.`,
        };
      }

      return {
        ok: false,
        code: 'AMOUNT_MISMATCH',
        error: `Montant payé (${formatFcfa(verifiedTx.amountFcfa)}) incorrect. Montant attendu : ${formatFcfa(booking.priceFcfa)}.`,
      };
    }

    // 6. Persist payment & transition booking atomically.
    const mappedPaymentStatus = mapPaymentStatus(verifiedTx.normalizedStatus);

    const outcome = await db.transaction(async (tx): Promise<ConfirmationOutcome> => {
      const [currentPayment] = await tx
        .select({
          id: payments.id,
          status: payments.status,
        })
        .from(payments)
        .where(eq(payments.transactionRef, verifiedTx.reference))
        .limit(1);

      const [latestBooking] = await tx
        .select({ status: bookings.status })
        .from(bookings)
        .where(eq(bookings.id, booking.id))
        .limit(1);

      const currentBookingStatus = latestBooking?.status ?? booking.status;

      if (currentPayment?.status === 'successful') {
        return {
          kind: 'recorded',
          idempotent: true,
          bookingStatus: currentBookingStatus,
        };
      }

      const stillPaid = await hasSuccessfulFullPayment(
        tx,
        booking.id,
        booking.priceFcfa,
        verifiedTx.reference
      );

      if (stillPaid) {
        await tx
          .insert(payments)
          .values({
            bookingId: booking.id,
            amountFcfa: verifiedTx.amountFcfa,
            operator: verifiedTx.operator,
            transactionRef: verifiedTx.reference,
            status: 'failed',
            rawStatus: 'AMOUNT_MISMATCH',
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: payments.transactionRef,
            set: {
              amountFcfa: verifiedTx.amountFcfa,
              operator: verifiedTx.operator,
              status: 'failed',
              rawStatus: 'AMOUNT_MISMATCH',
              updatedAt: now,
            },
          });

        return { kind: 'already_paid' };
      }

      if (currentPayment) {
        await tx
          .update(payments)
          .set({
            amountFcfa: verifiedTx.amountFcfa,
            operator: verifiedTx.operator,
            status: mappedPaymentStatus,
            rawStatus: verifiedTx.rawStatus,
            updatedAt: now,
          })
          .where(eq(payments.id, currentPayment.id));
      } else {
        await tx
          .insert(payments)
          .values({
            bookingId: booking.id,
            amountFcfa: verifiedTx.amountFcfa,
            operator: verifiedTx.operator,
            transactionRef: verifiedTx.reference,
            status: mappedPaymentStatus,
            rawStatus: verifiedTx.rawStatus,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: payments.transactionRef,
            set: {
              amountFcfa: verifiedTx.amountFcfa,
              operator: verifiedTx.operator,
              status: mappedPaymentStatus,
              rawStatus: verifiedTx.rawStatus,
              updatedAt: now,
            },
          });
      }

      if (mappedPaymentStatus !== 'successful') {
        return {
          kind: 'recorded',
          idempotent: false,
          bookingStatus: currentBookingStatus,
        };
      }

      if (currentBookingStatus === 'confirmed' || currentBookingStatus === 'completed') {
        return {
          kind: 'recorded',
          idempotent: true,
          bookingStatus: currentBookingStatus,
        };
      }

      if (currentBookingStatus === 'pending') {
        const updated = await tx
          .update(bookings)
          .set({
            status: sql`'confirmed'` as unknown as 'confirmed',
            expiresAt: null,
          })
          .where(
            and(
              eq(bookings.id, booking.id),
              sql`${bookings.status}::text = 'pending'`
            )
          )
          .returning({ status: bookings.status });

        return {
          kind: 'recorded',
          idempotent: false,
          bookingStatus: updated[0]?.status ?? currentBookingStatus,
        };
      }

      // Booking was already cancelled/expired: keep audit payment row without forcing slot back.
      return {
        kind: 'recorded',
        idempotent: false,
        bookingStatus: currentBookingStatus,
      };
    });

    if (outcome.kind === 'already_paid') {
      return {
        ok: false,
        code: 'AMOUNT_MISMATCH',
        error: `Le montant total est déjà réglé (${formatFcfa(booking.priceFcfa)}). Aucun second paiement n'est attendu.`,
      };
    }

    return {
      ok: true,
      idempotent: outcome.idempotent,
      paymentStatus: mappedPaymentStatus,
      bookingId: booking.id,
      bookingStatus: outcome.bookingStatus,
      amountFcfa: verifiedTx.amountFcfa,
      operator: verifiedTx.operator,
      transactionRef: verifiedTx.reference,
    };
  } catch (error) {
    const details = extractDbErrorDetails(error);
    if (details.code === '42P01') {
      return {
        ok: false,
        code: 'INTERNAL_ERROR',
        error: PAYMENTS_TABLE_MISSING_ERROR,
      };
    }
    console.warn(
      'processVerifiedFeexPayTransaction failed:',
      details.code ?? 'UNKNOWN',
      details.message
    );
    return {
      ok: false,
      code: 'INTERNAL_ERROR',
      error: 'Erreur interne lors du traitement du paiement.',
    };
  }
}
