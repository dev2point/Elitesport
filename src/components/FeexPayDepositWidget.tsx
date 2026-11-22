'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import type { FeexPayChannel, FeexPayWidgetConfig } from '@/src/lib/feexpay';
import { formatFcfa } from '@/src/lib/pricing';

interface FeexPayDepositWidgetProps {
  booking: {
    id: string;
    reference: string;
    teamName: string;
    phone: string;
    depositFcfa: number;
  };
  feexPayConfig: FeexPayWidgetConfig;
  autoOpen?: boolean;
  onVerifiedConfirmed?: () => void;
  onPaymentFailed?: (message: string) => void;
  onAvailabilityChange?: (available: boolean) => void;
}

const CHANNELS: ReadonlyArray<{
  id: FeexPayChannel;
  label: string;
}> = [
  { id: 'mtn', label: 'MTN MoMo' },
  { id: 'moov', label: 'Moov Money' },
  { id: 'celtiis', label: 'Celtiis' },
  { id: 'card', label: 'Carte' },
];

export function FeexPayDepositWidget({
  booking,
  feexPayConfig,
  onVerifiedConfirmed,
  onPaymentFailed,
  onAvailabilityChange,
}: FeexPayDepositWidgetProps) {
  const [channel, setChannel] = useState<FeexPayChannel>('mtn');
  const [payPhone, setPayPhone] = useState<string>(booking.phone);
  const [isInitiating, setIsInitiating] = useState(false);
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{
    kind: 'error' | 'info' | 'success';
    text: string;
  } | null>(null);

  useEffect(() => {
    onAvailabilityChange?.(feexPayConfig.isConfigured);
  }, [feexPayConfig.isConfigured, onAvailabilityChange]);

  async function verifyReferenceOnServer(reference: string, silent = false) {
    if (!silent) setIsChecking(true);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          reference,
        }),
      });

      const data = (await res.json()) as {
        ok: boolean;
        paymentStatus?: 'pending' | 'successful' | 'failed';
        error?: string;
      };

      if (res.ok && data.ok && data.paymentStatus === 'successful') {
        setPendingRef(null);
        setStatusNotice({
          kind: 'success',
          text: 'Acompte confirmé. Votre créneau est validé.',
        });
        onVerifiedConfirmed?.();
        return;
      }

      if (res.ok && data.ok && data.paymentStatus === 'failed') {
        setPendingRef(null);
        const failMsg =
          'Le paiement n’a pas abouti. Réessayez ou confirmez sur WhatsApp ci-dessous.';
        setStatusNotice({ kind: 'error', text: failMsg });
        onPaymentFailed?.(failMsg);
        return;
      }

      if (!silent) {
        setStatusNotice({
          kind: 'info',
          text: 'Paiement encore en attente. Validez le message USSD sur votre téléphone puis réessayez.',
        });
      }
    } catch {
      if (!silent) {
        setStatusNotice({
          kind: 'info',
          text: 'Vérification en attente. Vous pouvez aussi confirmer sur WhatsApp ci-dessous.',
        });
      }
    } finally {
      if (!silent) setIsChecking(false);
    }
  }

  // Poll payment verification while awaiting Mobile Money PIN approval
  useEffect(() => {
    if (!pendingRef) return;
    const timer = setInterval(() => {
      void verifyReferenceOnServer(pendingRef, true);
    }, 3500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRef, booking.id]);

  if (!feexPayConfig.isConfigured) {
    return null;
  }

  async function handleStartPayment() {
    setIsInitiating(true);
    setRedirectUrl(null);
    setStatusNotice(null);

    try {
      const res = await fetch('/api/payments/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          channel,
          phone: channel === 'card' ? undefined : payPhone,
        }),
      });

      const data = (await res.json()) as {
        ok: boolean;
        status?: 'pending' | 'successful' | 'redirect';
        reference?: string;
        paymentUrl?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        const msg =
          data.error ??
          'Le paiement en ligne n’a pas pu aboutir. Confirmez sur WhatsApp ci-dessous.';
        setStatusNotice({ kind: 'error', text: msg });
        onPaymentFailed?.(msg);
        return;
      }

      if (data.status === 'successful') {
        setStatusNotice({
          kind: 'success',
          text: 'Acompte confirmé. Votre créneau est validé.',
        });
        onVerifiedConfirmed?.();
        return;
      }

      if (data.status === 'redirect' && data.paymentUrl) {
        setRedirectUrl(data.paymentUrl);
        if (data.reference) setPendingRef(data.reference);
        setStatusNotice({
          kind: 'info',
          text: 'Redirection vers la page de paiement sécurisée…',
        });
        window.location.assign(data.paymentUrl);
        return;
      }

      if (data.reference) {
        setPendingRef(data.reference);
        setStatusNotice({
          kind: 'info',
          text: 'Demande envoyée sur votre téléphone. Saisissez votre code secret pour confirmer.',
        });
      }
    } catch {
      const msg =
        'Impossible de lancer le paiement en ligne. Confirmez directement sur WhatsApp.';
      setStatusNotice({ kind: 'error', text: msg });
      onPaymentFailed?.(msg);
    } finally {
      setIsInitiating(false);
    }
  }

  return (
    <div className="space-y-2.5 rounded-xl border border-[#16231b]/12 bg-[#f8f7f2] p-3">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#16231b]">
        <span>Payer l&apos;acompte par Mobile Money ou Carte</span>
      </div>

      {/* Operator selector */}
      <div
        role="radiogroup"
        aria-label="Choisir le moyen de paiement"
        className="grid grid-cols-2 min-[360px]:grid-cols-4 gap-1.5"
      >
        {CHANNELS.map((item) => {
          const active = channel === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setChannel(item.id);
                setStatusNotice(null);
              }}
              className={`min-h-[40px] px-2 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] cursor-pointer ${
                active
                  ? 'bg-[#1f5d3a] text-white'
                  : 'bg-white text-[#16231b] border border-[#16231b]/15 hover:border-[#1f5d3a]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {channel !== 'card' && (
        <div>
          <label
            htmlFor={`pay-phone-${booking.id}`}
            className="block text-[11px] font-semibold text-[#3c4a41] mb-1"
          >
            Numéro {CHANNELS.find((c) => c.id === channel)?.label}
          </label>
          <div className="relative">
            <Smartphone
              className="w-4 h-4 text-[#5a665d] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id={`pay-phone-${booking.id}`}
              type="tel"
              inputMode="tel"
              value={payPhone}
              onChange={(e) => setPayPhone(e.target.value)}
              placeholder="Ex : 0197000000"
              className="w-full min-h-[44px] pl-9 pr-3 rounded-xl bg-white border border-[#16231b]/20 text-sm font-medium text-[#16231b] tabular-nums focus:outline-none focus:border-[#1f5d3a] focus-visible:ring-2 focus-visible:ring-[#e8590c]"
            />
          </div>
        </div>
      )}

      {!pendingRef ? (
        <button
          type="button"
          onClick={() => void handleStartPayment()}
          disabled={isInitiating}
          className="w-full min-h-[50px] px-4 py-3 rounded-xl bg-[#c94705] hover:bg-[#b23d03] disabled:opacity-60 text-white font-display text-lg font-bold tracking-wide flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16231b] cursor-pointer"
        >
          {isInitiating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden="true" />
              <span>Envoi en cours…</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>Payer l&apos;acompte ({formatFcfa(booking.depositFcfa)})</span>
            </>
          )}
        </button>
      ) : (
        <div className="space-y-2">
          {redirectUrl && (
            <a
              href={redirectUrl}
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#c94705] hover:bg-[#b23d03] text-white font-display text-base font-bold flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Ouvrir la page de paiement carte</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => void verifyReferenceOnServer(pendingRef)}
            disabled={isChecking}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-white border border-[#1f5d3a] text-[#1f5d3a] hover:bg-[#1f5d3a]/5 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 shrink-0 ${isChecking ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Vérifier le paiement</span>
          </button>
        </div>
      )}

      {statusNotice && (
        <div
          role={statusNotice.kind === 'error' ? 'alert' : 'status'}
          className={`rounded-xl px-3 py-2 text-xs sm:text-sm font-medium flex items-start gap-2 ${
            statusNotice.kind === 'success'
              ? 'bg-[#1f5d3a]/10 border border-[#1f5d3a]/30 text-[#1f5d3a]'
              : statusNotice.kind === 'error'
                ? 'bg-[#e8590c]/12 border border-[#e8590c]/35 text-[#9e3602]'
                : 'bg-white border border-[#16231b]/15 text-[#16231b]'
          }`}
        >
          {statusNotice.kind === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <span>{statusNotice.text}</span>
        </div>
      )}
    </div>
  );
}
