import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getFeexPayWebhookSecret,
  verifyFeexPayWebhookAuthorization,
} from '@/src/lib/feexpay';
import { processVerifiedFeexPayTransaction } from '@/src/lib/payments';

const webhookBodySchema = z
  .object({
    reference: z.string().trim().min(4).max(128).optional(),
    transaction_id: z.string().trim().min(4).max(128).optional(),
    order_id: z.string().trim().min(4).max(128).optional(),
  })
  .passthrough();

export async function POST(req: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Corps de requête illisible.' },
      { status: 400 }
    );
  }

  // If FEEXPAY_WEBHOOK_SECRET is configured, verify HMAC signature or custom header secret
  const webhookSecret = getFeexPayWebhookSecret();
  if (webhookSecret) {
    const isAuthorized = verifyFeexPayWebhookAuthorization({
      rawBody,
      headers: req.headers,
      secret: webhookSecret,
    });

    if (!isAuthorized) {
      return NextResponse.json(
        { ok: false, error: 'Signature ou en-tête webhook FeexPay invalide.' },
        { status: 401 }
      );
    }
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'JSON webhook invalide.' },
      { status: 400 }
    );
  }

  const parsed = webhookBodySchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Payload webhook invalide.' },
      { status: 400 }
    );
  }

  const reference =
    parsed.data.reference ??
    parsed.data.transaction_id ??
    parsed.data.order_id;

  if (!reference) {
    return NextResponse.json(
      { ok: false, error: 'Référence de transaction manquante.' },
      { status: 400 }
    );
  }

  // Never trust body status or amount: processVerifiedFeexPayTransaction re-queries FeexPay API
  const result = await processVerifiedFeexPayTransaction({ reference });

  if (!result.ok) {
    if (
      result.code === 'NOT_CONFIGURED' ||
      result.code === 'UPSTREAM_ERROR' ||
      result.code === 'INTERNAL_ERROR'
    ) {
      return NextResponse.json(
        { ok: false, code: result.code, error: result.error },
        { status: 503 }
      );
    }

    if (
      result.code === 'VALIDATION_ERROR' ||
      result.code === 'TRANSACTION_NOT_FOUND'
    ) {
      return NextResponse.json(
        { ok: false, code: result.code, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, code: result.code, error: result.error },
      { status: 422 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      idempotent: result.idempotent,
      paymentStatus: result.paymentStatus,
      bookingId: result.bookingId,
      bookingStatus: result.bookingStatus,
      transactionRef: result.transactionRef,
    },
    { status: 200 }
  );
}
