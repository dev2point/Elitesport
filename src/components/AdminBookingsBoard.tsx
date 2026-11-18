'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
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
import type {
  AdminBookingItem,
  AdminRevenueSummary,
} from '@/src/lib/admin-bookings';
import type { BookingStatus } from '@/src/db/schema';
import { formatFcfa, formatShortFcfa } from '@/src/lib/pricing';

interface AdminBookingsBoardProps {
  selectedDate: string;
  todayStr: string;
  dateLabel: string;
  prevDateStr: string;
  nextDateStr: string;
  lastUpdatedLabel: string;
  bookings: AdminBookingItem[];
  revenueStats: AdminRevenueSummary;
  loadError?: string | null;
}

const STATUS_META: Record<
  BookingStatus,
  { label: string; badgeClass: string }
> = {
  pending: {
    label: "En attente d'acompte",
    badgeClass: 'bg-[#e8590c]/15 text-[#9e3602] border border-[#e8590c]/35',
  },
  confirmed: {
    label: 'Confirmée',
    badgeClass: 'bg-[#1f5d3a]/15 text-[#1f5d3a] border border-[#1f5d3a]/35',
  },
  completed: {
    label: 'Terminée',
    badgeClass: 'bg-[#16231b]/10 text-[#16231b] border border-[#16231b]/20',
  },
  cancelled: {
    label: 'Annulée',
    badgeClass: 'bg-[#16231b]/[0.06] text-[#16231b]/70 border border-[#16231b]/15',
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
  revenueStats,
  loadError = null,
}: AdminBookingsBoardProps) {
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  return (
    <div className="space-y-5 pb-10">
      {/* Revenue Dashboard (Jour, Semaine, Mois) from confirmed/completed bookings */}
      <section aria-label="Revenus confirmés et terminés" className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-[#16231b]">
            Revenus (confirmés &amp; terminés)
          </h2>
          <span className="text-xs text-[#16231b]/70">En FCFA</span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white border border-[#16231b]/15 rounded-xl p-2.5 sm:p-3.5 min-w-0">
            <p className="text-xs font-medium text-[#16231b]/70">
              {isToday ? "Aujourd'hui" : 'Ce jour'}
            </p>
            <p className="font-display text-lg min-[400px]:text-xl sm:text-2xl font-bold text-[#1f5d3a] tabular-nums mt-0.5 truncate">
              {formatShortFcfa(revenueStats.day.totalFcfa)}
            </p>
            <p className="text-[11px] text-[#16231b]/70 mt-0.5 tabular-nums truncate">
              {revenueStats.day.count} match{revenueStats.day.count > 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-white border border-[#16231b]/15 rounded-xl p-2.5 sm:p-3.5 min-w-0">
            <p className="text-xs font-medium text-[#16231b]/70">Semaine</p>
            <p className="font-display text-lg min-[400px]:text-xl sm:text-2xl font-bold text-[#16231b] tabular-nums mt-0.5 truncate">
              {formatShortFcfa(revenueStats.week.totalFcfa)}
            </p>
            <p className="text-[11px] text-[#16231b]/70 mt-0.5 tabular-nums truncate">
              {revenueStats.week.count} match{revenueStats.week.count > 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-white border border-[#16231b]/15 rounded-xl p-2.5 sm:p-3.5 min-w-0">
            <p className="text-xs font-medium text-[#16231b]/70">Mois</p>
            <p className="font-display text-lg min-[400px]:text-xl sm:text-2xl font-bold text-[#16231b] tabular-nums mt-0.5 truncate">
              {formatShortFcfa(revenueStats.month.totalFcfa)}
            </p>
            <p className="text-[11px] text-[#16231b]/70 mt-0.5 tabular-nums truncate">
              {revenueStats.month.count} match{revenueStats.month.count > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </section>

      {/* Date header & navigation */}
      <section className="bg-white border border-[#16231b]/15 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
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
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#16231b]/20 text-sm font-semibold text-[#16231b] hover:bg-[#16231b]/5 inline-flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Actualiser</span>
          </button>
        </div>

        <p className="mt-1 text-xs text-[#16231b]/70 tabular-nums">
          Mise à jour auto toutes les 30 s · Dernière lecture : {lastUpdatedLabel}
        </p>

        <div className="mt-3.5 grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <Link
            href={`/admin?date=${prevDateStr}`}
            className="min-h-[48px] px-3.5 py-2 rounded-xl bg-[#f8f7f2] border border-[#16231b]/18 hover:border-[#1f5d3a] text-sm font-semibold text-[#16231b] inline-flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c]"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Jour préc.</span>
          </Link>

          <Link
            href={`/admin?date=${nextDateStr}`}
            className="min-h-[48px] px-3.5 py-2 rounded-xl bg-[#f8f7f2] border border-[#16231b]/18 hover:border-[#1f5d3a] text-sm font-semibold text-[#16231b] inline-flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c]"
          >
            <span>Jour suiv.</span>
            <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </Link>

          {!isToday && (
            <Link
              href="/admin"
              className="col-span-2 sm:col-span-1 min-h-[48px] px-4 py-2 rounded-xl bg-[#1f5d3a] text-white text-sm font-semibold inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c]"
            >
              Revenir à aujourd&apos;hui
            </Link>
          )}
        </div>
      </section>

      {/* Errors */}
      {(loadError || actionError) && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-white border border-[#e8590c] text-sm font-semibold text-[#9e3602]"
        >
          {loadError || actionError}
        </div>
      )}

      {/* Chronological bookings list */}
      <section aria-label="Réservations du jour" className="space-y-3">
        {!loadError && bookings.length === 0 ? (
          <div className="bg-white border border-[#16231b]/15 rounded-2xl p-6 text-center">
            <p className="font-display text-xl font-bold text-[#16231b]">
              Aucune réservation ce jour
            </p>
            <p className="mt-1 text-sm text-[#16231b]/70">
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
                    ? 'border-[#16231b]/12 opacity-80'
                    : 'border-[#16231b]/15'
                }`}
              >
                {/* Time + Status */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`font-display text-2xl font-bold tabular-nums leading-none ${
                      isCancelled
                        ? 'line-through text-[#16231b]/65'
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
                <div className="mt-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-bold text-[#16231b] leading-snug truncate">
                      {booking.teamName}
                    </h3>
                    <p className="text-xs text-[#16231b]/70 mt-0.5 tabular-nums">
                      Réf. {booking.reference} ·{' '}
                      {booking.source === 'online' ? 'En ligne' : 'Saisie manuelle'}
                    </p>
                  </div>

                  <Link
                    href={`/reservation/${booking.id}`}
                    className="min-h-[44px] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#1f5d3a] hover:bg-[#1f5d3a]/8 inline-flex items-center gap-1 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c]"
                  >
                    <span>Fiche</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>

                {/* Amounts */}
                <div className="mt-2.5 py-2.5 border-y border-[#16231b]/10 flex flex-wrap items-center justify-between gap-2 text-sm tabular-nums">
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
                    className="min-h-[46px] px-3 py-2 rounded-xl bg-[#f8f7f2] border border-[#16231b]/18 hover:border-[#1f5d3a] text-sm font-semibold text-[#16231b] inline-flex items-center justify-center gap-1.5 tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c]"
                  >
                    <Phone className="w-4 h-4 text-[#1f5d3a] shrink-0" aria-hidden="true" />
                    <span className="truncate">{booking.phone}</span>
                  </a>

                  {booking.whatsappDigits ? (
                    <a
                      href={`https://wa.me/${booking.whatsappDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[46px] px-3 py-2 rounded-xl bg-[#f8f7f2] border border-[#16231b]/18 hover:border-[#1f5d3a] text-sm font-semibold text-[#1f5d3a] inline-flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c]"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <span className="min-h-[46px] px-3 py-2 rounded-xl bg-[#f8f7f2] text-xs text-[#16231b]/60 inline-flex items-center justify-center">
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
                        className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#1f5d3a] hover:bg-[#17482c] disabled:opacity-60 text-white font-display text-lg font-bold tracking-wide flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] cursor-pointer"
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
                        className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#16231b] hover:bg-[#24382c] disabled:opacity-60 text-white font-display text-lg font-bold tracking-wide flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] cursor-pointer"
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
                        className="w-full min-h-[46px] px-4 py-2 rounded-xl border border-[#e8590c]/50 text-[#9e3602] hover:bg-[#e8590c]/10 disabled:opacity-60 text-sm font-bold flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] cursor-pointer"
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
                          className="min-h-[48px] px-3 py-2 rounded-xl bg-[#c94705] hover:bg-[#b23d03] disabled:opacity-60 text-white text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16231b] cursor-pointer"
                        >
                          {isBusy ? 'Annulation...' : 'Oui, annuler'}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setConfirmCancelId(null)}
                          className="min-h-[48px] px-3 py-2 rounded-xl border border-[#16231b]/20 text-[#16231b] text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] cursor-pointer"
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
