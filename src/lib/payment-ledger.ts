import { and, eq } from 'drizzle-orm';
import type { Database } from '@/src/db';
import { payments } from '@/src/db/schema';

/**
 * Full-payment-only ledger guard.
 * Returns true when a successful payment for this booking already covers the
 * whole slot price. `excludedTransactionRef` keeps the current webhook
 * idempotent while still rejecting a second distinct successful payment.
 */
export async function hasSuccessfulFullPayment(
  db: Database,
  bookingId: string,
  priceFcfa: number,
  excludedTransactionRef?: string
): Promise<boolean> {
  const rows = await db
    .select({
      amountFcfa: payments.amountFcfa,
      transactionRef: payments.transactionRef,
      status: payments.status,
    })
    .from(payments)
    .where(and(eq(payments.bookingId, bookingId), eq(payments.status, 'successful')));

  return rows.some(
    (row) =>
      row.status === 'successful' &&
      row.amountFcfa === priceFcfa &&
      row.transactionRef !== excludedTransactionRef
  );
}
