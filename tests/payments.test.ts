import crypto from 'node:crypto';
import { describe, expect, it } from 'bun:test';
import type { Database } from '@/src/db';
import { bookings, payments } from '@/src/db/schema';
import {
  fetchFeexPayTransactionStatus,
  formatBeninPhoneForFeexPay,
  initiateFeexPayPayment,
  isSafeFeexPayRedirectUrl,
  isValidFeexPayReference,
  verifyFeexPayWebhookAuthorization,
  verifyFeexPayWebhookSignature,
} from '@/src/lib/feexpay';
import { processVerifiedFeexPayTransaction } from '@/src/lib/payments';

const BOOKING_ID = '11111111-1111-4111-8111-111111111111';
const FULL_PRICE_FCFA = 25000;

function expectNoProgressFields(result: object): void {
  for (const key of ['stage', 'paidFcfa', 'remainingFcfa', 'depositFcfa']) {
    expect(Object.keys(result)).not.toContain(key);
  }
}

describe('FeexPay webhook HMAC-SHA256 verification', () => {
  const secret = 'fxp_whsec_test_secret_123456';

  it('accepts a valid v1 HMAC-SHA256 signature within replay window', () => {
    const rawBody = JSON.stringify({ reference: 'tx_12345', status: 'SUCCESSFUL' });
    const nowSec = 1_762_790_400;
    const timestamp = String(nowSec - 30);
    const deliveryId = 'deliv-uuid-001';
    const message = `${timestamp}.${deliveryId}.${rawBody}`;
    const sig = crypto.createHmac('sha256', secret).update(message, 'utf8').digest('hex');

    const valid = verifyFeexPayWebhookSignature({
      rawBody,
      timestamp,
      deliveryId,
      signatureHeader: `v1=${sig}`,
      secret,
      nowSec,
    });

    expect(valid).toBe(true);
  });

  it('rejects tampered payloads, wrong secrets, and expired timestamps', () => {
    const rawBody = JSON.stringify({ reference: 'tx_12345', status: 'SUCCESSFUL' });
    const nowSec = 1_762_790_400;
    const timestamp = String(nowSec - 10);
    const deliveryId = 'deliv-uuid-002';
    const sig = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${deliveryId}.${rawBody}`, 'utf8')
      .digest('hex');

    expect(
      verifyFeexPayWebhookSignature({
        rawBody: rawBody.replace('tx_12345', 'tx_99999'),
        timestamp,
        deliveryId,
        signatureHeader: `v1=${sig}`,
        secret,
        nowSec,
      })
    ).toBe(false);

    expect(
      verifyFeexPayWebhookSignature({
        rawBody,
        timestamp: String(nowSec - 400),
        deliveryId,
        signatureHeader: `v1=${sig}`,
        secret,
        nowSec,
      })
    ).toBe(false);
  });

  it('accepts custom shared-secret headers configured in FeexPay webhook UI', () => {
    const rawBody = JSON.stringify({ reference: 'tx_12345' });
    expect(
      verifyFeexPayWebhookAuthorization({
        rawBody,
        headers: new Headers({ authorization: 'Bearer my-custom-secret' }),
        secret: 'my-custom-secret',
      })
    ).toBe(true);

    expect(
      verifyFeexPayWebhookAuthorization({
        rawBody,
        headers: new Headers({ 'x-webhook-secret': 'my-custom-secret' }),
        secret: 'my-custom-secret',
      })
    ).toBe(true);

    expect(
      verifyFeexPayWebhookAuthorization({
        rawBody,
        headers: new Headers({ authorization: 'Bearer wrong-secret' }),
        secret: 'my-custom-secret',
      })
    ).toBe(false);
  });
});

describe('FeexPay reference validation & REST status verification', () => {
  it('blocks path traversal and malformed references', () => {
    expect(isValidFeexPayReference('../admin')).toBe(false);
    expect(isValidFeexPayReference('ref/1234')).toBe(false);
    expect(isValidFeexPayReference('abc')).toBe(false);
    expect(isValidFeexPayReference('fp_tx_2026_001')).toBe(true);
  });

  it('queries FeexPay sandbox API with Bearer token and normalizes payload', async () => {
    let calledUrl = '';
    let authHeader = '';

    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calledUrl = String(input);
      authHeader = (init?.headers as Record<string, string>)?.Authorization ?? '';
      return new Response(
        JSON.stringify({
          reference: 'tx_sandbox_999',
          status: 'SUCCESSFUL',
          amount: 2250,
          reseau: 'MTN BJ',
          custom_id: 'ESG-111111',
          callback_info: JSON.stringify({
            bookingId: BOOKING_ID,
            reference: 'ESG-111111',
          }),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    const result = await fetchFeexPayTransactionStatus('tx_sandbox_999', {
      apiKey: 'test_key_abc',
      mode: 'SANDBOX',
      fetchImpl: mockFetch,
    });

    expect(calledUrl).toBe(
      'https://sandbox-api.feexpay.me/api/transactions/public/single/status/tx_sandbox_999'
    );
    expect(authHeader).toBe('Bearer test_key_abc');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transaction.normalizedStatus).toBe('SUCCESSFUL');
      expect(result.transaction.amountFcfa).toBe(2250);
      expect(result.transaction.operator).toBe('MTN BJ');
      expect(result.transaction.callbackInfo.bookingId).toBe(BOOKING_ID);
    }
  });
});

describe('Full-payment-only FeexPay confirmation', () => {
  function collectStringParams(condition: unknown): string[] {
    const values: string[] = [];
    const seen = new WeakSet<object>();

    function walk(value: unknown): void {
      if (!value || typeof value !== 'object' || seen.has(value)) {
        return;
      }
      seen.add(value);
      for (const [key, nested] of Object.entries(value)) {
        if (key === 'value' && typeof nested === 'string') {
          values.push(nested);
        }
        walk(nested);
      }
    }

    walk(condition);
    return values;
  }

  function toPaymentStatus(value: unknown): 'pending' | 'successful' | 'failed' {
    return value === 'pending' || value === 'failed' ? value : 'successful';
  }

  function createMockDb(initialStatus: 'pending' | 'confirmed' | 'cancelled' = 'pending') {
    const bookingRow = {
      id: BOOKING_ID,
      status: initialStatus,
      priceFcfa: FULL_PRICE_FCFA,
      expiresAt: initialStatus === 'pending' ? new Date('2026-11-21T12:15:00.000Z') : null,
    };

    interface PaymentRow {
      id: string;
      bookingId: string;
      amountFcfa: number;
      operator: string;
      transactionRef: string;
      status: 'pending' | 'successful' | 'failed';
      rawStatus: string | null;
    }

    const paymentRows: PaymentRow[] = [];
    let bookingUpdateCount = 0;

    function rowsResult<T>(rows: T[]) {
      const copy = [...rows];
      return Object.assign(copy, {
        limit: async (count: number) => copy.slice(0, count),
      });
    }

    const dbApi = {
      select: (selection?: Record<string, unknown>) => ({
        from: (table: unknown) => ({
          where: (condition: unknown) => {
            const params = collectStringParams(condition);
            if (table === payments) {
              const isLookup =
                selection !== undefined && Object.keys(selection).includes('id');
              const rows = isLookup
                ? paymentRows.filter((p) => params.includes(p.transactionRef))
                : paymentRows.filter(
                    (p) => params.includes(p.bookingId) && params.includes('successful')
                  );
              return rowsResult(rows);
            }
            return rowsResult([bookingRow]);
          },
        }),
      }),
      update: (table: unknown) => ({
        set: (values: Record<string, unknown>) => ({
          where: (condition: unknown) => {
            if (table === bookings) {
              const keys = Object.keys(values);
              if (keys.includes('expiresAt') && keys.includes('status')) {
                return {
                  returning: async () => {
                    if (bookingRow.status === 'pending') {
                      bookingRow.status = 'confirmed';
                      bookingRow.expiresAt = null;
                      bookingUpdateCount += 1;
                      return [{ status: 'confirmed' }];
                    }
                    return [];
                  },
                };
              }
              return Promise.resolve([]);
            }

            if (table === payments) {
              const params = collectStringParams(condition);
              const row =
                paymentRows.find(
                  (p) => params.includes(p.id) || params.includes(p.transactionRef)
                ) ?? null;
              if (row) {
                if (typeof values.amountFcfa === 'number') {
                  row.amountFcfa = values.amountFcfa;
                }
                if (typeof values.operator === 'string') {
                  row.operator = values.operator;
                }
                row.status = toPaymentStatus(values.status);
                row.rawStatus =
                  typeof values.rawStatus === 'string' ? values.rawStatus : null;
              }
            }

            return Promise.resolve([]);
          },
        }),
      }),
      insert: (_table: unknown) => ({
        values: (vals: {
          bookingId: string;
          amountFcfa: number;
          operator: string;
          transactionRef: string;
          status?: 'pending' | 'successful' | 'failed';
          rawStatus?: string;
        }) => {
          function newRow(): PaymentRow {
            return {
              id: `pay-${paymentRows.length + 1}`,
              bookingId: vals.bookingId,
              amountFcfa: vals.amountFcfa,
              operator: vals.operator,
              transactionRef: vals.transactionRef,
              status: vals.status ?? (vals.rawStatus === 'AMOUNT_MISMATCH' ? 'failed' : 'successful'),
              rawStatus: vals.rawStatus ?? null,
            };
          }

          function upsert(shouldUpdate: boolean): void {
            const existing = paymentRows.find(
              (p) => p.transactionRef === vals.transactionRef
            );
            if (!existing) {
              paymentRows.push(newRow());
              return;
            }
            if (shouldUpdate) {
              existing.amountFcfa = vals.amountFcfa;
              existing.operator = vals.operator;
              existing.status = vals.status ?? existing.status;
              existing.rawStatus = vals.rawStatus ?? existing.rawStatus;
            }
          }

          return {
            onConflictDoNothing: async () => upsert(false),
            onConflictDoUpdate: async () => upsert(true),
          };
        },
      }),
      transaction: async <T>(fn: (tx: Database) => Promise<T>) =>
        fn(dbApi as unknown as Database),
    };

    return {
      db: dbApi as unknown as Database,
      bookingRow,
      paymentRows,
      getBookingUpdateCount: () => bookingUpdateCount,
    };
  }

  function verifiedTransaction(
    reference: string,
    amountFcfa: number,
    overrides?: {
      normalizedStatus?: 'SUCCESSFUL' | 'PENDING' | 'FAILED';
      rawStatus?: string;
    }
  ) {
    return {
      ok: true as const,
      transaction: {
        reference,
        rawStatus: overrides?.rawStatus ?? 'SUCCESSFUL',
        normalizedStatus: overrides?.normalizedStatus ?? ('SUCCESSFUL' as const),
        amountFcfa,
        operator: 'MTN BJ',
        customId: 'ESG-111111',
        orderId: null,
        callbackInfo: {
          bookingId: BOOKING_ID,
          reference: 'ESG-111111',
        },
        reason: null,
      },
    };
  }

  it('confirms only the exact full payment and keeps duplicate webhooks idempotent', async () => {
    const ctx = createMockDb('pending');
    let verifyCalls = 0;
    const verifyFn = async (reference: string) => {
      verifyCalls += 1;
      return verifiedTransaction(reference, FULL_PRICE_FCFA);
    };

    const first = await processVerifiedFeexPayTransaction(
      { reference: 'feexpay_tx_full' },
      {
        db: ctx.db,
        verifyTransaction: verifyFn,
        now: new Date('2026-11-21T12:05:00.000Z'),
      }
    );

    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.idempotent).toBe(false);
      expect(first.paymentStatus).toBe('successful');
      expect(first.bookingStatus).toBe('confirmed');
      expect(first.amountFcfa).toBe(FULL_PRICE_FCFA);
      expect(first.transactionRef).toBe('feexpay_tx_full');
      expectNoProgressFields(first);
    }
    expect(ctx.bookingRow.status).toBe('confirmed');
    expect(ctx.paymentRows).toHaveLength(1);
    expect(ctx.paymentRows[0]?.status).toBe('successful');
    expect(ctx.getBookingUpdateCount()).toBe(1);

    const duplicate = await processVerifiedFeexPayTransaction(
      { reference: 'feexpay_tx_full' },
      {
        db: ctx.db,
        verifyTransaction: verifyFn,
        now: new Date('2026-11-21T12:05:05.000Z'),
      }
    );

    expect(duplicate.ok).toBe(true);
    if (duplicate.ok) {
      expect(duplicate.idempotent).toBe(true);
      expect(duplicate.bookingStatus).toBe('confirmed');
      expectNoProgressFields(duplicate);
    }
    expect(verifyCalls).toBe(1);
    expect(ctx.paymentRows).toHaveLength(1);
    expect(ctx.getBookingUpdateCount()).toBe(1);
  });

  it('rejects partial and overpayments without confirming', async () => {
    for (const amount of [500, 7500, 3000]) {
      const ctx = createMockDb('pending');
      const result = await processVerifiedFeexPayTransaction(
        { reference: `feexpay_tx_${amount}` },
        {
          db: ctx.db,
          verifyTransaction: async (reference) => verifiedTransaction(reference, amount),
        }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('AMOUNT_MISMATCH');
        expect(result.error).toContain('25 000 FCFA');
      }
      expect(ctx.bookingRow.status).toBe('pending');
      expect(ctx.paymentRows[0]?.status).toBe('failed');
      expect(ctx.paymentRows[0]?.rawStatus).toBe('AMOUNT_MISMATCH');
      expect(ctx.getBookingUpdateCount()).toBe(0);
    }
  });

  it('rejects a second distinct successful payment for an already paid booking', async () => {
    const ctx = createMockDb('pending');
    const verifyFn = async (reference: string) =>
      verifiedTransaction(reference, FULL_PRICE_FCFA);

    const first = await processVerifiedFeexPayTransaction(
      { reference: 'feexpay_tx_full' },
      { db: ctx.db, verifyTransaction: verifyFn }
    );
    expect(first.ok).toBe(true);

    const second = await processVerifiedFeexPayTransaction(
      { reference: 'feexpay_tx_second' },
      { db: ctx.db, verifyTransaction: verifyFn }
    );

    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.code).toBe('AMOUNT_MISMATCH');
      expect(second.error).toContain('déjà réglé');
    }
    expect(ctx.bookingRow.status).toBe('confirmed');
    expect(ctx.paymentRows.filter((p) => p.status === 'successful')).toHaveLength(1);
    expect(ctx.paymentRows.filter((p) => p.rawStatus === 'AMOUNT_MISMATCH')).toHaveLength(1);
    expect(ctx.getBookingUpdateCount()).toBe(1);
  });

  it('records a failed FeexPay status without confirming the booking', async () => {
    const ctx = createMockDb('pending');
    const result = await processVerifiedFeexPayTransaction(
      { reference: 'feexpay_tx_failed' },
      {
        db: ctx.db,
        verifyTransaction: async (reference) =>
          verifiedTransaction(reference, FULL_PRICE_FCFA, {
            normalizedStatus: 'FAILED',
            rawStatus: 'FAILED',
          }),
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.paymentStatus).toBe('failed');
      expect(result.bookingStatus).toBe('pending');
      expectNoProgressFields(result);
    }
    expect(ctx.bookingRow.status).toBe('pending');
    expect(ctx.paymentRows[0]?.status).toBe('failed');
    expect(ctx.paymentRows[0]?.rawStatus).toBe('FAILED');
    expect(ctx.getBookingUpdateCount()).toBe(0);
  });

  it('fails closed when the payments table is missing (42P01)', async () => {
    const bookingRow = {
      id: BOOKING_ID,
      status: 'pending' as const,
      priceFcfa: FULL_PRICE_FCFA,
      expiresAt: new Date('2026-11-21T12:15:00.000Z') as Date | null,
    };
    const missingPaymentsError = Object.assign(
      new Error('relation "payments" does not exist'),
      { code: '42P01' }
    );

    const dbWithoutPayments = {
      select: () => ({
        from: (table: unknown) => ({
          where: () => ({
            limit: async () => {
              if (table === payments) {
                throw missingPaymentsError;
              }
              return [bookingRow];
            },
          }),
        }),
      }),
    } as unknown as Database;

    const result = await processVerifiedFeexPayTransaction(
      { reference: 'feexpay_tx_no_table', bookingIdHint: BOOKING_ID },
      {
        db: dbWithoutPayments,
        verifyTransaction: async (reference) =>
          verifiedTransaction(reference, FULL_PRICE_FCFA),
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.error).toContain('sql/003_payments.sql');
    }
    expect(bookingRow.status).toBe('pending');
  });
});

describe('Server-side FeexPay Payin initiation (Sandbox & Production)', () => {
  it('formats Benin phones to FeexPay 22901XXXXXXXX format', () => {
    expect(formatBeninPhoneForFeexPay('0197000000', 'mtn')).toBe('2290197000000');
    expect(formatBeninPhoneForFeexPay('97000000', 'moov')).toBe('2290197000000');
    expect(formatBeninPhoneForFeexPay('+229 97000000', 'moov')).toBe('2290197000000');
    expect(formatBeninPhoneForFeexPay('+2290197000000', 'celtiis')).toBe('2290197000000');
  });

  it('initiates MTN sandbox push for the full 25 000 FCFA slot price', async () => {
    let calledUrl = '';
    let sentBody: Record<string, unknown> = {};

    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calledUrl = String(input);
      sentBody = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
      return new Response(
        JSON.stringify({
          reference: '3670412f-8f6f-4cc1-879c-1f4570035ffc',
          status: 'PENDING',
          amount: FULL_PRICE_FCFA,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    const result = await initiateFeexPayPayment(
      {
        bookingId: BOOKING_ID,
        bookingReference: 'ESG-111111',
        amountFcfa: FULL_PRICE_FCFA,
        phone: '0197000000',
        channel: 'mtn',
      },
      {
        apiKey: 'test_key_sandbox_123',
        shopId: 'xSgF8Ckt6nPXSDp',
        mode: 'SANDBOX',
        fetchImpl: mockFetch,
      }
    );

    expect(calledUrl).toBe(
      'https://sandbox-api.feexpay.me/api/transactions/public/requesttopay/mtn'
    );
    expect(sentBody.shop).toBe('xSgF8Ckt6nPXSDp');
    expect(sentBody.amount).toBe(FULL_PRICE_FCFA);
    expect(sentBody.phoneNumber).toBe('2290197000000');
    expect(result.ok).toBe(true);
    expect(result.reference).toBe('3670412f-8f6f-4cc1-879c-1f4570035ffc');
    expect(result.status).toBe('PENDING');
  });

  it('validates card redirect URLs strictly on *.feexpay.me', () => {
    expect(
      isSafeFeexPayRedirectUrl(
        'https://sandbox-api.feexpay.me/api/card/sandbox/checkout/card-details?ref=abc'
      )
    ).toBe(true);
    expect(isSafeFeexPayRedirectUrl('https://evil.example.com/phish')).toBe(false);
    expect(isSafeFeexPayRedirectUrl('http://sandbox-api.feexpay.me/insecure')).toBe(false);
  });
});
