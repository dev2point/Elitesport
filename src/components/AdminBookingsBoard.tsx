'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Phone,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  cancelBookingAction,
  completeBookingAction,
  confirmBookingAction,
} from '@/src/actions/admin-bookings';
import type { AdminBookingItem } from '@/src/lib/admin-bookings';
import type { BookingStatus } from '@/src/db/schema';
import { formatFcfa } from '@/src/lib/pricing';

interface AdminBookingsBoardProps {
  selectedDate: string;
  todayStr: string;
  dateLabel: string;
  prevDateStr: string;
  nextDateStr: string;
  lastUpdatedLabel: string;
  bookings: AdminBookingItem[];
  loadError?: string | null;
}

const STATUS_META: Record<
  BookingStatus,
  { label: string; badgeClass: string }
> = {
  pending: {
    label: "En attente d'acompte",
    badgeClass: 'bg-[#e8590c]/14 text-[#b84304] border border-[#e8590c]/30',
  },
  confirmed: {
    label: 'Confirmée',
    badgeClass: 'bg-[#1f5d3a]/14 text-[#1f5d3a] border border-[#1f5d3a]/30',
  },
  completed: {
    label: 'Terminée',
    badgeClass: 'bg-[#16231b]/10 text-[#16231b] border border-[#16231b]/20',
  },
  cancelled: {
    label: 'Annulée',
    badgeClass: 'bg-[#16231b]/[0.05] text-[#16231b]/60 border border-[#16231b]/12',
  },
};

export function AdminBookingsBoard({
  selectedDate,
  todayStr,
  dateLabel,
  prevDateStr,
  nextDateStr,
  lastUpdatedLabel,
  bookings,
  loadError = null,
}: AdminBookingsBoardProps) {
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Automatic refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30_000);
    return () => clearInterval(interval);
  }, [router]);

  function handleManualRefresh() {
    setActionError(null);
    startRefreshTransition(() => {
      router.refresh();
    });
  }

  async function handleAction(
    bookingId: string,
    kind: 'confirm' | 'cancel' | 'complete'
  ) {
    setActionError(null);
    setBusyBookingId(bookingId);
    try {
      const result =
        kind === 'confirm'
          ? await confirmBookingAction(bookingId)
          : kind === 'cancel'
            ? await cancelBookingAction(bookingId)
            : await completeBookingAction(bookingId);

      if (!result.ok) {
        setActionError(result.error);
      }
      setConfirmCancelId(null);
      router.refresh();
    } catch {
      setActionError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setBusyBookingId(null);
    }
  }

  const isToday = selectedDate === todayStr;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const activeConfirmed = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'completed'
  );
  const dayTotalFcfa = activeConfirmed.reduce((acc, b) => acc + b.priceFcfa, 0);

  return (
    <div className="space-y-5 pb-10">
      {/* Date header & navigation */}
      <section className="bg-white border border-[#16231b]/12 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1f5d3a]">
              {isToday ? "Aujourd'hui" : 'Planning du jour'}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#16231b] leading-tight">
              {dateLabel}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#16231b]/18 text-sm font-semibold text-[#16231b] hover:bg-[#16231b]/5 inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Actualiser</span>
          </button>
        </div>

        <p className="mt-1 text-xs text-[#16231b]/60 tabular-nums">
          Mise à jour auto toutes les 30 s · Dernière lecture : {lastUpdatedLabel}
        </p>

        <div className="mt-3.5 grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <Link
            href={`/admin?date=${prevDateStr}`}
            className="min-h-[48px] px-3.5 py-2 rounded-xl bg-[#f8f7f2] border border-[#16231b]/15 hover:border-[#1f5d3a] text-sm font-semibold text-[#16231b] inline-flex items-center justify-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Jour préc.</span>
          </Link>

          <Link
            href={`/admin?date=${nextDateStr}`}
            className="min-h-[48px] px-3.5 py-2 rounded-xl bg-[#f8f7f2] border border-[#16231b]/15 hover:border-[#1f5d3a] text-sm font-semibold text-[#16231b] inline-flex items-center justify-center gap-1.5"
          >
            <span>Jour suiv.</span>
            <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </Link>

          {!isToday && (
            <Link
              href="/admin"
              className="col-span-2 sm:col-span-1 min-h-[48px] px-4 py-2 rounded-xl bg-[#1f5d3a] text-white text-sm font-semibold inline-flex items-center justify-center"
            >
              Revenir à aujourd&apos;hui
            </Link>
          )}
        </div>
      </section>

      {/* Compact day summary */}
      <section
        aria-label="Résumé du jour"
        className="grid grid-cols-3 gap-2 sm:gap-3"
      >
        <div className="bg-white border border-[#16231b]/12 rounded-xl p-3">
          <p className="text-xs text-[#16231b]/65">En attente</p>
          <p className="font-display text-2xl font-bold text-[#e8590c] tabular-nums mt-0.5">
            {pendingCount}
          </p>
        </div>
        <div className="bg-white border border-[#16231b]/12 rounded-xl p-3">
          <p className="text-xs text-[#16231b]/65">Confirmées</p>
          <p className="font-display text-2xl font-bold text-[#1f5d3a] tabular-nums mt-0.5">
            {activeConfirmed.length}
          </p>
        </div>
        <div className="bg-white border border-[#16231b]/12 rounded-xl p-3">
          <p className="text-xs text-[#16231b]/65">Total validé</p>
          <p className="font-display text-xl sm:text-2xl font-bold text-[#16231b] tabular-nums mt-0.5 truncate">
            {formatFcfa(dayTotalFcfa)}
          </p>
        </div>
      </section>

      {/* Errors */}
      {(loadError || actionError) && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-white border border-[#e8590c] text-sm font-semibold text-[#c93800]"
        >
          {loadError || actionError}
        </div>
      )}

      {/* Chronological bookings list */}
      <section aria-label="Réservations du jour" className="space-y-3">
        {!loadError && bookings.length === 0 ? (
          <div className="bg-white border border-[#16231b]/12 rounded-2xl p-6 text-center">
            <p className="font-display text-xl font-bold text-[#16231b]">
              Aucune réservation ce jour
            </p>
            <p className="mt-1 text-sm text-[#16231b]/65">
              Les réservations en ligne apparaîtront ici automatiquement.
            </p>
          </div>
        ) : (
          bookings.map((booking) => {
            const statusMeta = STATUS_META[booking.status];
            const isBusy = busyBookingId === booking.id;
            const isConfirmingCancel = confirmCancelId === booking.id;
            const isCancelled = booking.status === 'cancelled';

            return (
              <article
                key={booking.id}
                className={`bg-white border rounded-2xl p-4 transition-opacity ${
                  isCancelled
                    ? 'border-[#16231b]/10 opacity-75'
                    : 'border-[#16231b]/15'
                }`}
              >
                {/* Time + Status */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`font-display text-2xl font-bold tabular-nums leading-none ${
                      isCancelled
                        ? 'line-through text-[#16231b]/55'
                        : 'text-[#16231b]'
                    }`}
                  >
                    {booking.timeLabel}
                  </span>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusMeta.badgeClass}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                {/* Team & metadata */}
                <div className="mt-2.5">
                  <h3 className="font-display text-xl font-bold text-[#16231b] leading-snug">
                    {booking.teamName}
                  </h3>
                  <p className="text-xs text-[#16231b]/65 mt-0.5 tabular-nums">
                    Réf. {booking.reference} ·{' '}
                    {booking.source === 'online' ? 'En ligne' : 'Saisie manuelle'}
                  </p>
                </div>

                {/* Amounts */}
                <div className="mt-3 py-2.5 border-y border-[#16231b]/10 flex flex-wrap items-center justify-between gap-2 text-sm tabular-nums">
                  <span>
                    Montant :{' '}
                    <strong className="text-[#16231b]">
                      {formatFcfa(booking.priceFcfa)}
                    </strong>
                  </span>
                  <span>
                    Acompte 30 % :{' '}
                    <strong className="text-[#1f5d3a]">
                      {formatFcfa(booking.depositFcfa)}
                    </strong>
                  </span>
                </div>

                {/* Clickable phone & WhatsApp */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${booking.phone}`}
                    className="min-h-[46px] px-3 py-2 rounded-xl bg-[#f8f7f2] border border-[#16231b]/15 hover:border-[#1f5d3a] text-sm font-semibold text-[#16231b] inline-flex items-center justify-center gap-1.5 tabular-nums"
                  >
                    <Phone className="w-4 h-4 text-[#1f5d3a] shrink-0" aria-hidden="true" />
                    <span className="truncate">{booking.phone}</span>
                  </a>

                  {booking.whatsappDigits ? (
                    <a
                      href={`https://wa.me/${booking.whatsappDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[46px] px-3 py-2 rounded-xl bg-[#f8f7f2] border border-[#16231b]/15 hover:border-[#1f5d3a] text-sm font-semibold text-[#1f5d3a] inline-flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <span className="min-h-[46px] px-3 py-2 rounded-xl bg-[#f8f7f2] text-xs text-[#16231b]/50 inline-flex items-center justify-center">
                      Pas de WhatsApp
                    </span>
                  )}
                </div>

                {/* Manager actions */}
                {(booking.status === 'pending' ||
                  booking.status === 'confirmed') && (
                  <div className="mt-3 pt-3 border-t border-[#16231b]/10 space-y-2">
                    {booking.status === 'pending' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAction(booking.id, 'confirm')}
                        className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#1f5d3a] hover:bg-[#17482c] disabled:opacity-60 text-white font-display text-lg font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Check className="w-5 h-5 shrink-0" aria-hidden="true" />
                        <span>
                          {isBusy
                            ? 'Enregistrement...'
                            : 'Confirmer (acompte reçu)'}
                        </span>
                      </button>
                    )}

                    {booking.status === 'confirmed' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAction(booking.id, 'complete')}
                        className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#16231b] hover:bg-[#24382c] disabled:opacity-60 text-white font-display text-lg font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Check className="w-5 h-5 shrink-0" aria-hidden="true" />
                        <span>
                          {isBusy ? 'Mise à jour...' : 'Marquer terminée'}
                        </span>
                      </button>
                    )}

                    {!isConfirmingCancel ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setConfirmCancelId(booking.id)}
                        className="w-full min-h-[46px] px-4 py-2 rounded-xl border border-[#e8590c]/45 text-[#b84304] hover:bg-[#e8590c]/10 disabled:opacity-60 text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Annuler cette réservation</span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleAction(booking.id, 'cancel')}
                          className="min-h-[48px] px-3 py-2 rounded-xl bg-[#e8590c] hover:bg-[#cf4c07] disabled:opacity-60 text-white text-sm font-bold cursor-pointer"
                        >
                          {isBusy ? 'Annulation...' : "Oui, annuler"}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setConfirmCancelId(null)}
                          className="min-h-[48px] px-3 py-2 rounded-xl border border-[#16231b]/20 text-[#16231b] text-sm font-semibold cursor-pointer"
                        >
                          Garder
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
