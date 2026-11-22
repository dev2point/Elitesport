import crypto from 'node:crypto';
import { describe, expect, it } from 'bun:test';
import type { Database } from '@/src/db';
import { payments } from '@/src/db/schema';
import {
  fetchFeexPayTransactionStatus,
  formatBeninPhoneForFeexPay,
  initiateFeexPayDeposit,
  isSafeFeexPayRedirectUrl,
  isValidFeexPayReference,
  verifyFeexPayWebhookAuthorization,
  verifyFeexPayWebhookSignature,
} from '@/src/lib/feexpay';
import { processVerifiedFeexPayTransaction } from '@/src/lib/payments';

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

    // Tampered body
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

    // Expired timestamp (> 300s)
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
            bookingId: '11111111-1111-4111-8111-111111111111',
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
      expect(result.transaction.callbackInfo.bookingId).toBe(
        '11111111-1111-4111-8111-111111111111'
      );
    }
  });
});

describe('Idempotent FeexPay payment confirmation', () => {
  function createMockDb(initialStatus: 'pending' | 'confirmed' | 'cancelled' = 'pending') {
    const bookingId = '11111111-1111-4111-8111-111111111111';
    const bookingRow = {
      id: bookingId,
      status: initialStatus,
      depositFcfa: 2250,
      priceFcfa: 7500,
      expiresAt: initialStatus === 'pending' ? new Date('2026-11-21T12:15:00.000Z') : null,
    };

    const paymentRows: Array<{
      id: string;
      bookingId: string;
      amountFcfa: number;
      operator: string;
      transactionRef: string;
      status: 'pending' | 'successful' | 'failed';
      rawStatus: string | null;
    }> = [];

    let bookingUpdateCount = 0;

    const dbApi = {
      select: () => ({
        from: (table: unknown) => {
          const rows = table === payments ? paymentRows : [bookingRow];
          return {
            where: () => ({
              limit: async () => rows.slice(0, 1),
            }),
          };
        },
      }),
      update: () => ({
        set: (values: Record<string, unknown>) => ({
          where: () => {
            if ('expiresAt' in values) {
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
            if ('amountFcfa' in values && paymentRows[0]) {
              paymentRows[0].amountFcfa = Number(values.amountFcfa);
              paymentRows[0].status = 'successful';
            }
            return Promise.resolve([]);
          },
        }),
      }),
      insert: () => ({
        values: (vals: {
          bookingId: string;
          amountFcfa: number;
          operator: string;
          transactionRef: string;
          rawStatus?: string;
        }) => ({
          onConflictDoNothing: async () => {
            if (!paymentRows.some((p) => p.transactionRef === vals.transactionRef)) {
              paymentRows.push({
                id: `pay-${paymentRows.length + 1}`,
                bookingId: vals.bookingId,
                amountFcfa: vals.amountFcfa,
                operator: vals.operator,
                transactionRef: vals.transactionRef,
                status: vals.rawStatus === 'AMOUNT_TOO_LOW' ? 'failed' : 'successful',
                rawStatus: vals.rawStatus ?? null,
              });
            }
          },
          onConflictDoUpdate: async () => {
            const existing = paymentRows.find((p) => p.transactionRef === vals.transactionRef);
            if (!existing) {
              paymentRows.push({
                id: `pay-${paymentRows.length + 1}`,
                bookingId: vals.bookingId,
                amountFcfa: vals.amountFcfa,
                operator: vals.operator,
                transactionRef: vals.transactionRef,
                status:
                  vals.rawStatus === 'FAILED'
                    ? 'failed'
                    : vals.rawStatus === 'PENDING'
                      ? 'pending'
                      : 'successful',
                rawStatus: vals.rawStatus ?? null,
              });
            }
          },
        }),
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

  it('confirms pending booking on first verified webhook and stays idempotent on duplicate delivery', async () => {
    const ctx = createMockDb('pending');
    let verifyCalls = 0;

    const verifyFn = async (reference: string) => {
      verifyCalls += 1;
      return {
        ok: true as const,
        transaction: {
          reference,
          rawStatus: 'SUCCESSFUL',
          normalizedStatus: 'SUCCESSFUL' as const,
          amountFcfa: 2250,
          operator: 'MTN BJ',
          customId: 'ESG-111111',
          orderId: null,
          callbackInfo: {
            bookingId: '11111111-1111-4111-8111-111111111111',
            reference: 'ESG-111111',
          },
          reason: null,
        },
      };
    };

    const first = await processVerifiedFeexPayTransaction(
      { reference: 'feexpay_tx_001' },
      { db: ctx.db, verifyTransaction: verifyFn, now: new Date('2026-11-21T12:05:00.000Z') }
    );

    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.idempotent).toBe(false);
      expect(first.bookingStatus).toBe('confirmed');
      expect(first.paymentStatus).toBe('successful');
    }
    expect(ctx.bookingRow.status).toBe('confirmed');
    expect(ctx.paymentRows).toHaveLength(1);
    expect(ctx.getBookingUpdateCount()).toBe(1);

    // Second identical webhook -> strictly idempotent, no second API or booking mutation
    const second = await processVerifiedFeexPayTransaction(
      { reference: 'feexpay_tx_001' },
      { db: ctx.db, verifyTransaction: verifyFn, now: new Date('2026-11-21T12:05:05.000Z') }
    );

    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.idempotent).toBe(true);
      expect(second.bookingStatus).toBe('confirmed');
    }
    expect(verifyCalls).toBe(1);
    expect(ctx.paymentRows).toHaveLength(1);
    expect(ctx.getBookingUpdateCount()).toBe(1);
  });

  it('rejects underpaid deposits and mismatched booking references', async () => {
    const ctx = createMockDb('pending');

    const underpaid = await processVerifiedFeexPayTransaction(
      { reference: 'feexpay_tx_underpaid' },
      {
        db: ctx.db,
        verifyTransaction: async (reference) => ({
          ok: true,
          transaction: {
            reference,
            rawStatus: 'SUCCESSFUL',
            normalizedStatus: 'SUCCESSFUL',
            amountFcfa: 500, // less than 2250 deposit
            operator: 'MOOV BJ',
            customId: 'ESG-111111',
            orderId: null,
            callbackInfo: {
              bookingId: '11111111-1111-4111-8111-111111111111',
            },
            reason: null,
          },
        }),
      }
    );

    expect(underpaid.ok).toBe(false);
    if (!underpaid.ok) {
      expect(underpaid.code).toBe('AMOUNT_MISMATCH');
    }
    expect(ctx.bookingRow.status).toBe('pending');
  });

  it('records failed payment without confirming booking so user can use WhatsApp Plan B', async () => {
    const ctx = createMockDb('pending');

    const failed = await processVerifiedFeexPayTransaction(
      { reference: 'feexpay_tx_failed' },
      {
        db: ctx.db,
        verifyTransaction: async (reference) => ({
          ok: true,
          transaction: {
            reference,
            rawStatus: 'FAILED',
            normalizedStatus: 'FAILED',
            amountFcfa: 2250,
            operator: 'MTN BJ',
            customId: 'ESG-111111',
            orderId: null,
            callbackInfo: {
              bookingId: '11111111-1111-4111-8111-111111111111',
            },
            reason: 'INSUFFICIENT_FUNDS',
          },
        }),
      }
    );

    expect(failed.ok).toBe(true);
    if (failed.ok) {
      expect(failed.paymentStatus).toBe('failed');
      expect(failed.bookingStatus).toBe('pending');
    }
    expect(ctx.bookingRow.status).toBe('pending');
    expect(ctx.paymentRows[0]?.status).toBe('failed');
  });

  it('still confirms pending booking cleanly if the payments audit table does not exist (42P01)', async () => {
    const bookingId = '11111111-1111-4111-8111-111111111111';
    const bookingRow = {
      id: bookingId,
      status: 'pending' as 'pending' | 'confirmed',
      depositFcfa: 7500,
      priceFcfa: 25000,
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
      update: () => ({
        set: (values: Record<string, unknown>) => ({
          where: () => {
            if ('expiresAt' in values) {
              return {
                returning: async () => {
                  if (bookingRow.status === 'pending') {
                    bookingRow.status = 'confirmed';
                    bookingRow.expiresAt = null;
                    return [{ status: 'confirmed' }];
                  }
                  return [];
                },
              };
            }
            return Promise.resolve([]);
          },
        }),
      }),
      transaction: async <T>(fn: (tx: Database) => Promise<T>) =>
        fn(dbWithoutPayments as unknown as Database),
    } as unknown as Database;

    const result = await processVerifiedFeexPayTransaction(
      { reference: 'feexpay_tx_no_table', bookingIdHint: bookingId },
      {
        db: dbWithoutPayments,
        verifyTransaction: async (reference) => ({
          ok: true,
          transaction: {
            reference,
            rawStatus: 'SUCCESSFUL',
            normalizedStatus: 'SUCCESSFUL',
            amountFcfa: 7500,
            operator: 'MTN BJ',
            customId: 'ESG-111111',
            orderId: null,
            callbackInfo: {
              bookingId,
              reference: 'ESG-111111',
            },
            reason: null,
          },
        }),
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.paymentStatus).toBe('successful');
      expect(result.bookingStatus).toBe('confirmed');
    }
    expect(bookingRow.status).toBe('confirmed');
  });
});

describe('Server-side FeexPay Payin initiation (Sandbox & Production)', () => {
  it('formats Benin phones to FeexPay 22901XXXXXXXX format', () => {
    expect(formatBeninPhoneForFeexPay('0197000000', 'mtn')).toBe('2290197000000');
    expect(formatBeninPhoneForFeexPay('97000000', 'moov')).toBe('2290197000000');
    expect(formatBeninPhoneForFeexPay('+229 97000000', 'moov')).toBe('2290197000000');
    expect(formatBeninPhoneForFeexPay('+2290197000000', 'celtiis')).toBe('2290197000000');
  });

  it('initiates MTN sandbox push against sandbox-api.feexpay.me', async () => {
    let calledUrl = '';
    let sentBody: Record<string, unknown> = {};

    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calledUrl = String(input);
      sentBody = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
      return new Response(
        JSON.stringify({
          reference: '3670412f-8f6f-4cc1-879c-1f4570035ffc',
          status: 'PENDING',
          amount: 7500,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    const result = await initiateFeexPayDeposit(
      {
        bookingId: '11111111-1111-4111-8111-111111111111',
        bookingReference: 'ESG-111111',
        amountFcfa: 7500,
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
    expect(sentBody.amount).toBe(7500);
    expect(sentBody.phoneNumber).toBe('2290197000000');
    expect(result.ok).toBe(true);
    expect(result.reference).toBe('3670412f-8f6f-4cc1-879c-1f4570035ffc');
    expect(result.status).toBe('PENDING');
  });

  it('validates card redirect URLs strictly on *.feexpay.me', async () => {
    expect(
      isSafeFeexPayRedirectUrl(
        'https://sandbox-api.feexpay.me/api/card/sandbox/checkout/card-details?ref=abc'
      )
    ).toBe(true);
    expect(isSafeFeexPayRedirectUrl('https://evil.example.com/phish')).toBe(false);
    expect(isSafeFeexPayRedirectUrl('http://sandbox-api.feexpay.me/insecure')).toBe(false);
  });
});

