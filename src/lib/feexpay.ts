import crypto from 'node:crypto';
import { z } from 'zod';

export type FeexPayMode = 'SANDBOX' | 'LIVE';
export type FeexPayChannel = 'mtn' | 'moov' | 'celtiis' | 'card';

export interface FeexPayWidgetConfig {
  shopId: string;
  publicToken: string;
  mode: FeexPayMode;
  isConfigured: boolean;
}

export interface FeexPayInitResult {
  ok: boolean;
  status?: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  reference?: string;
  paymentUrl?: string;
  operator: string;
  error?: string;
}

export interface FeexPayVerifiedTransaction {
  reference: string;
  rawStatus: string;
  normalizedStatus: 'SUCCESSFUL' | 'PENDING' | 'FAILED';
  amountFcfa: number;
  operator: string;
  customId: string | null;
  orderId: string | null;
  callbackInfo: Record<string, unknown>;
  reason: string | null;
}

export type FeexPayVerificationResult =
  | { ok: true; transaction: FeexPayVerifiedTransaction }
  | {
      ok: false;
      code:
        | 'NOT_CONFIGURED'
        | 'INVALID_REFERENCE'
        | 'NOT_FOUND'
        | 'UPSTREAM_ERROR'
        | 'INVALID_RESPONSE';
      error: string;
    };

const SAFE_REFERENCE_REGEX = /^[a-zA-Z0-9._:-]{4,128}$/;
const SAFE_SHOP_ID_REGEX = /^[a-zA-Z0-9_-]{4,128}$/;

export function isValidFeexPayReference(reference: string): boolean {
  return SAFE_REFERENCE_REGEX.test(reference) && !reference.includes('..');
}

export function getFeexPayMode(): FeexPayMode {
  const raw = (
    process.env.FEEXPAY_MODE ??
    process.env.NEXT_PUBLIC_FEEXPAY_MODE ??
    'SANDBOX'
  )
    .trim()
    .toUpperCase();
  return raw === 'LIVE' ? 'LIVE' : 'SANDBOX';
}

export function getFeexPayShopId(): string {
  return (
    process.env.NEXT_PUBLIC_FEEXPAY_SHOP_ID ??
    process.env.FEEXPAY_SHOP_ID ??
    ''
  ).trim();
}

export function getFeexPayWidgetPublicConfig(): FeexPayWidgetConfig {
  const shopId = getFeexPayShopId();
  const publicToken = (process.env.NEXT_PUBLIC_FEEXPAY_PUBLIC_TOKEN ?? '').trim();
  const mode = getFeexPayMode();

  return {
    shopId,
    publicToken,
    mode,
    isConfigured: Boolean(
      shopId && SAFE_SHOP_ID_REGEX.test(shopId) && getFeexPayServerApiKey()
    ),
  };
}

/**
 * Resolves whether server-side FeexPay checkout is ready (both shop ID
 * and private server API key are configured). Never leaks key details to client.
 */
export async function resolveFeexPayWidgetConfig(): Promise<FeexPayWidgetConfig> {
  return getFeexPayWidgetPublicConfig();
}

export function getFeexPayServerApiKey(): string {
  return (process.env.FEEXPAY_API_KEY ?? '').trim();
}

export function getFeexPayWebhookSecret(): string {
  return (process.env.FEEXPAY_WEBHOOK_SECRET ?? '').trim();
}

/**
 * Verifies FeexPay webhook HMAC-SHA256 signature:
 * signed payload = `${timestamp}.${deliveryId}.${rawBody}`
 * header `x-feexpay-signature` contains `v1=<hex_digest>` (supports comma-separated rotation).
 */
export function verifyFeexPayWebhookSignature(params: {
  rawBody: string;
  timestamp: string | null;
  deliveryId: string | null;
  signatureHeader: string | null;
  secret: string;
  nowSec?: number;
  maxSkewSec?: number;
}): boolean {
  const {
    rawBody,
    timestamp,
    deliveryId,
    signatureHeader,
    secret,
    nowSec = Math.floor(Date.now() / 1000),
    maxSkewSec = 300,
  } = params;

  if (!secret || !timestamp || !deliveryId || !signatureHeader) {
    return false;
  }

  if (!/^\d+$/.test(timestamp)) {
    return false;
  }

  const parsedTs = Number(timestamp);
  if (!Number.isFinite(parsedTs) || Math.abs(nowSec - parsedTs) > maxSkewSec) {
    return false;
  }

  const message = `${timestamp}.${deliveryId}.${rawBody}`;
  const expectedHex = crypto
    .createHmac('sha256', secret)
    .update(message, 'utf8')
    .digest('hex');

  const expectedBuf = Buffer.from(expectedHex, 'hex');

  const candidates = signatureHeader.split(',');
  for (const rawPart of candidates) {
    const part = rawPart.trim();
    if (!part.startsWith('v1=')) continue;
    const providedHex = part.slice(3).trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(providedHex)) continue;
    const providedBuf = Buffer.from(providedHex, 'hex');
    if (
      providedBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(providedBuf, expectedBuf)
    ) {
      return true;
    }
  }

  return false;
}

function constantTimeStringEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a, 'utf8').digest();
  const hashB = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Supports both FeexPay's official HMAC-SHA256 headers (`x-feexpay-signature`)
 * and custom shared-secret headers configured in FeexPay's webhook form
 * (`Authorization: Bearer <secret>`, `Authorization: <secret>`, `x-webhook-secret`, `x-api-key`, `x-feexpay-secret`).
 */
export function verifyFeexPayWebhookAuthorization(params: {
  rawBody: string;
  headers: Headers;
  secret: string;
  nowSec?: number;
}): boolean {
  const { rawBody, headers, secret, nowSec } = params;
  if (!secret) return true;

  const sigHeader = headers.get('x-feexpay-signature');
  if (sigHeader) {
    return verifyFeexPayWebhookSignature({
      rawBody,
      timestamp: headers.get('x-feexpay-timestamp'),
      deliveryId: headers.get('x-feexpay-delivery-id'),
      signatureHeader: sigHeader,
      secret,
      nowSec,
    });
  }

  const candidateValues: string[] = [];
  const auth = headers.get('authorization');
  if (auth) {
    candidateValues.push(auth.trim());
    if (auth.toLowerCase().startsWith('bearer ')) {
      candidateValues.push(auth.slice(7).trim());
    }
  }

  for (const headerName of ['x-webhook-secret', 'x-api-key', 'x-feexpay-secret']) {
    const val = headers.get(headerName);
    if (val) candidateValues.push(val.trim());
  }

  return candidateValues.some(
    (candidate) => candidate.length > 0 && constantTimeStringEqual(candidate, secret)
  );
}

const feexPayStatusResponseSchema = z
  .object({
    reference: z.string().optional(),
    order_id: z.string().optional(),
    custom_id: z.string().optional(),
    customId: z.string().optional(),
    status: z.string(),
    amount: z.union([z.number(), z.string()]),
    reseau: z.string().optional().nullable(),
    network: z.string().optional().nullable(),
    type: z.string().optional().nullable(),
    callback_info: z.unknown().optional(),
    reason: z.string().optional().nullable(),
  })
  .passthrough();

function parseCallbackInfo(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return { raw: trimmed };
    }
  }
  return {};
}

function normalizeFeexPayStatus(rawStatus: string): 'SUCCESSFUL' | 'PENDING' | 'FAILED' {
  const upper = rawStatus.trim().toUpperCase();
  if (upper === 'SUCCESSFUL' || upper === 'SUCCESS') {
    return 'SUCCESSFUL';
  }
  if (upper === 'PENDING' || upper === 'IN_PROGRESS') {
    return 'PENDING';
  }
  return 'FAILED';
}

function buildFeexPayBaseUrl(apiKey: string, mode: FeexPayMode): string {
  if (apiKey.startsWith('test_key_') || mode === 'SANDBOX') {
    return 'https://sandbox-api.feexpay.me';
  }
  return 'https://api.feexpay.me';
}

function buildFeexPayVerificationUrl(
  reference: string,
  apiKey: string,
  mode: FeexPayMode
): string {
  const encodedRef = encodeURIComponent(reference);
  // Legacy v1 SDK tokens (`fp_...`) use getrequesttopay/integration
  if (apiKey.startsWith('fp_')) {
    return `https://api.feexpay.me/api/transactions/getrequesttopay/integration/${encodedRef}`;
  }
  const baseUrl = buildFeexPayBaseUrl(apiKey, mode);
  return `${baseUrl}/api/transactions/public/single/status/${encodedRef}`;
}

export async function fetchFeexPayTransactionStatus(
  reference: string,
  options?: {
    apiKey?: string;
    mode?: FeexPayMode;
    fetchImpl?: typeof fetch;
  }
): Promise<FeexPayVerificationResult> {
  const cleanRef = reference.trim();
  if (!isValidFeexPayReference(cleanRef)) {
    return {
      ok: false,
      code: 'INVALID_REFERENCE',
      error: 'Référence de transaction FeexPay invalide.',
    };
  }

  const apiKey = (options?.apiKey ?? getFeexPayServerApiKey()).trim();
  if (!apiKey) {
    return {
      ok: false,
      code: 'NOT_CONFIGURED',
      error: 'Clé API FeexPay manquante côté serveur (FEEXPAY_API_KEY).',
    };
  }

  const mode = options?.mode ?? getFeexPayMode();
  const fetchFn = options?.fetchImpl ?? fetch;
  const endpointUrl = buildFeexPayVerificationUrl(cleanRef, apiKey, mode);

  try {
    const response = await fetchFn(endpointUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 404) {
      return {
        ok: false,
        code: 'NOT_FOUND',
        error: 'Transaction introuvable chez FeexPay.',
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        code: 'UPSTREAM_ERROR',
        error: `Erreur de vérification FeexPay (HTTP ${response.status}).`,
      };
    }

    const rawJson: unknown = await response.json();
    const parsed = feexPayStatusResponseSchema.safeParse(rawJson);
    if (!parsed.success) {
      return {
        ok: false,
        code: 'INVALID_RESPONSE',
        error: 'Réponse de vérification FeexPay invalide.',
      };
    }

    const data = parsed.data;
    const numericAmount =
      typeof data.amount === 'number' ? data.amount : Number(data.amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return {
        ok: false,
        code: 'INVALID_RESPONSE',
        error: 'Montant de transaction FeexPay invalide.',
      };
    }

    const operator =
      (data.reseau ?? data.network ?? data.type ?? 'FEEXPAY')?.trim() || 'FEEXPAY';

    return {
      ok: true,
      transaction: {
        reference: (data.reference ?? cleanRef).trim(),
        rawStatus: data.status.trim().toUpperCase(),
        normalizedStatus: normalizeFeexPayStatus(data.status),
        amountFcfa: Math.trunc(numericAmount),
        operator: operator.toUpperCase(),
        customId: (data.custom_id ?? data.customId ?? null) || null,
        orderId: data.order_id ?? null,
        callbackInfo: parseCallbackInfo(data.callback_info),
        reason: data.reason ?? null,
      },
    };
  } catch (error) {
    console.error('FeexPay status check failed:', error);
    return {
      ok: false,
      code: 'UPSTREAM_ERROR',
      error: 'Impossible de joindre l’API FeexPay pour vérifier la transaction.',
    };
  }
}

/**
 * Formats Benin phone numbers into FeexPay's international digit format
 * (`22901XXXXXXXX` for 10-digit / 8-digit inputs; `moov` strictly enforces `22901` + 8 digits).
 */
export function formatBeninPhoneForFeexPay(
  rawPhone: string,
  channel: FeexPayChannel
): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 8) {
    return `22901${digits}`;
  }
  if (digits.length === 10 && digits.startsWith('01')) {
    return `229${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('229')) {
    if (channel === 'moov' || channel === 'celtiis') {
      return `22901${digits.slice(3)}`;
    }
    return digits;
  }
  return digits;
}

export function isSafeFeexPayRedirectUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return host === 'feexpay.me' || host.endsWith('.feexpay.me');
  } catch {
    return false;
  }
}

const CHANNEL_ENDPOINTS: Record<FeexPayChannel, string> = {
  mtn: '/api/transactions/public/requesttopay/mtn',
  moov: '/api/transactions/public/requesttopay/moov',
  celtiis: '/api/transactions/public/requesttopay/celtiis_bj',
  card: '/api/transactions/public/requesttopay/init',
};

const CHANNEL_OPERATORS: Record<FeexPayChannel, string> = {
  mtn: 'MTN',
  moov: 'MOOV',
  celtiis: 'CELTIIS',
  card: 'CARD',
};

const feexPayInitResponseSchema = z
  .object({
    reference: z.string().optional(),
    status: z.string().optional(),
    payment_url: z.string().optional(),
    message: z.string().optional(),
    data: z
      .object({
        reference: z.string().optional(),
        status: z.string().optional(),
        payment_url: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export async function initiateFeexPayDeposit(
  params: {
    bookingId: string;
    bookingReference: string;
    amountFcfa: number;
    phone: string;
    channel: FeexPayChannel;
    description?: string;
  },
  options?: {
    apiKey?: string;
    shopId?: string;
    mode?: FeexPayMode;
    fetchImpl?: typeof fetch;
  }
): Promise<FeexPayInitResult> {
  const apiKey = (options?.apiKey ?? getFeexPayServerApiKey()).trim();
  const shopId = (options?.shopId ?? getFeexPayShopId()).trim();
  const operator = CHANNEL_OPERATORS[params.channel];

  if (!apiKey || !shopId || !SAFE_SHOP_ID_REGEX.test(shopId)) {
    return {
      ok: false,
      operator,
      error: 'Paiement en ligne momentanément indisponible.',
    };
  }

  const mode = options?.mode ?? getFeexPayMode();
  const fetchFn = options?.fetchImpl ?? fetch;
  const baseUrl = buildFeexPayBaseUrl(apiKey, mode);
  const endpointUrl = `${baseUrl}${CHANNEL_ENDPOINTS[params.channel]}`;
  const formattedPhone = formatBeninPhoneForFeexPay(params.phone, params.channel);
  const description = (
    params.description ?? `Acompte ${params.bookingReference}`
  ).slice(0, 40);

  try {
    const response = await fetchFn(endpointUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        shop: shopId,
        amount: Math.trunc(params.amountFcfa),
        phoneNumber: formattedPhone,
        description,
        callback_info: {
          bookingId: params.bookingId,
          reference: params.bookingReference,
        },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });

    const rawText = await response.text();
    let rawJson: unknown = null;
    try {
      rawJson = JSON.parse(rawText);
    } catch {
      rawJson = null;
    }

    if (!response.ok) {
      console.error(
        `FeexPay init (${params.channel}) failed HTTP ${response.status}:`,
        rawText.slice(0, 300)
      );
      return {
        ok: false,
        operator,
        error:
          'Le paiement en ligne n’a pas pu être lancé. Réessayez ou confirmez sur WhatsApp.',
      };
    }

    const parsed = feexPayInitResponseSchema.safeParse(rawJson);
    if (!parsed.success) {
      return {
        ok: false,
        operator,
        error:
          'Réponse inattendue du service de paiement. Confirmez plutôt sur WhatsApp.',
      };
    }

    const reference = (
      parsed.data.reference ??
      parsed.data.data?.reference ??
      ''
    ).trim();
    const rawStatus = (
      parsed.data.status ??
      parsed.data.data?.status ??
      'PENDING'
    ).trim();
    const rawPaymentUrl = (
      parsed.data.payment_url ??
      parsed.data.data?.payment_url ??
      ''
    ).trim();

    if (!reference || !isValidFeexPayReference(reference)) {
      return {
        ok: false,
        operator,
        error:
          'Référence de paiement non reçue. Confirmez votre créneau sur WhatsApp.',
      };
    }

    if (params.channel === 'card') {
      if (!rawPaymentUrl || !isSafeFeexPayRedirectUrl(rawPaymentUrl)) {
        return {
          ok: false,
          operator,
          error:
            'Lien de paiement carte indisponible. Utilisez Mobile Money ou WhatsApp.',
        };
      }
      return {
        ok: true,
        status: 'PENDING',
        reference,
        paymentUrl: rawPaymentUrl,
        operator,
      };
    }

    return {
      ok: true,
      status: normalizeFeexPayStatus(rawStatus),
      reference,
      operator,
    };
  } catch (error) {
    console.error(`FeexPay init (${params.channel}) network error:`, error);
    return {
      ok: false,
      operator,
      error:
        'Impossible de joindre le service de paiement. Confirmez directement sur WhatsApp.',
    };
  }
}
