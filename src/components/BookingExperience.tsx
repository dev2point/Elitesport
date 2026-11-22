'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  Moon,
  RefreshCw,
  Sun,
  Sunrise,
  Sunset,
  X,
} from 'lucide-react';
import { fetchDaySlotsAction, reserveSlotAction } from '@/src/actions/bookings';
import type { CreatedBookingSummary, DaySlot } from '@/src/lib/bookings';
import { buildBookingIcsDataUri } from '@/src/lib/calendar';
import type { FeexPayWidgetConfig } from '@/src/lib/feexpay';
import {
  DEPOSIT_PERCENTAGE,
  HOURLY_RATE_FCFA,
  PENDING_HOLD_MINUTES,
  formatFcfa,
  formatShortFcfa,
  getSlotPricing,
} from '@/src/lib/pricing';
import type { DayOption } from '@/src/lib/timezone';
import { FeexPayDepositWidget } from './FeexPayDepositWidget';

interface BookingExperienceProps {
  days: DayOption[];
  initialDate: string;
  initialSlots: DaySlot[];
  initialError?: string | null;
  managerWhatsapp: string;
  feexPayConfig: FeexPayWidgetConfig;
}

type PeriodFilter = 'all' | 'morning' | 'afternoon' | 'evening' | 'night';

interface PeriodGroup {
  id: Exclude<PeriodFilter, 'all'>;
  label: string;
  rangeLabel: string;
  icon: typeof Sun;
  minHour: number;
  maxHour: number;
}

const PERIOD_GROUPS: readonly PeriodGroup[] = [
  {
    id: 'morning',
    label: 'Matin',
    rangeLabel: '06h – 11h',
    icon: Sunrise,
    minHour: 6,
    maxHour: 11,
  },
  {
    id: 'afternoon',
    label: 'Après-midi',
    rangeLabel: '12h – 17h',
    icon: Sun,
    minHour: 12,
    maxHour: 17,
  },
  {
    id: 'evening',
    label: 'Soirée · Éclairage LED',
    rangeLabel: '18h – 23h',
    icon: Sunset,
    minHour: 18,
    maxHour: 23,
  },
  {
    id: 'night',
    label: 'Nuit',
    rangeLabel: '00h – 05h',
    icon: Moon,
    minHour: 0,
    maxHour: 5,
  },
] as const;

const FILTER_TABS: ReadonlyArray<{ id: PeriodFilter; label: string }> = [
  { id: 'all', label: 'Tous' },
  { id: 'morning', label: 'Matin' },
  { id: 'afternoon', label: 'Après-midi' },
  { id: 'evening', label: 'Soirée LED' },
  { id: 'night', label: 'Nuit' },
];

function useIsDesktopLg(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isDesktop;
}

function buildWhatsappHref(
  managerWhatsapp: string,
  booking: CreatedBookingSummary
): string | null {
  const digits = managerWhatsapp.replace(/\D/g, '');
  if (!digits) {
    return null;
  }

  const message = [
    'Bonjour Élite Sport Godomey,',
    'Je souhaite confirmer ma réservation par acompte :',
    `- Référence : ${booking.reference}`,
    `- Équipe : ${booking.teamName}`,
    `- Date : ${booking.dateLabel}`,
    `- Créneau : ${booking.timeLabel}`,
    `- Tarif total : ${formatFcfa(booking.priceFcfa)}`,
    `- Acompte (30 %) : ${formatFcfa(booking.depositFcfa)}`,
  ].join('\n');

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function formatCountdown(expiresAtIso: string, nowMs: number): string {
  const remainingSec = Math.max(
    0,
    Math.floor((new Date(expiresAtIso).getTime() - nowMs) / 1000)
  );
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
}

export function BookingExperience({
  days,
  initialDate,
  initialSlots,
  initialError = null,
  managerWhatsapp,
  feexPayConfig,
}: BookingExperienceProps) {
  const router = useRouter();
  const isDesktop = useIsDesktopLg();

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [slots, setSlots] = useState<DaySlot[]>(initialSlots);
  const [loadError, setLoadError] = useState<string | null>(initialError);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [selectedSlot, setSelectedSlot] = useState<DaySlot | null>(null);

  const [teamName, setTeamName] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] =
    useState<CreatedBookingSummary | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [onlinePayAvailable, setOnlinePayAvailable] = useState<boolean>(
    feexPayConfig.isConfigured
  );

  const [isLoadingDay, startDayTransition] = useTransition();
  const [isSubmitting, startSubmitTransition] = useTransition();

  useEffect(() => {
    if (!confirmedBooking) return;
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [confirmedBooking]);

  const activeDay = days.find((d) => d.dateStr === selectedDate) ?? days[0];
  const freeCount = slots.filter((s) => s.state === 'free').length;
  const takenCount = slots.filter((s) => s.state === 'taken').length;
  const basePricing = getSlotPricing(18);

  function handleSelectDate(dateStr: string) {
    if (dateStr === selectedDate && !loadError) return;
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setFormError(null);
    setLoadError(null);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('date', dateStr);
      window.history.replaceState(null, '', url.toString());
    }

    startDayTransition(async () => {
      const result = await fetchDaySlotsAction(dateStr);
      if (result.ok) {
        setSlots(result.slots);
        setLoadError(null);
      } else {
        setLoadError(result.error ?? 'Impossible de charger les créneaux.');
      }
    });
  }

  function handleRefreshDay() {
    setLoadError(null);
    startDayTransition(async () => {
      const result = await fetchDaySlotsAction(selectedDate);
      if (result.ok) {
        setSlots(result.slots);
        setLoadError(null);
      } else {
        setLoadError(result.error ?? 'Impossible de charger les créneaux.');
      }
    });
  }

  function handleSelectSlot(slot: DaySlot) {
    if (slot.state !== 'free') return;
    setConfirmedBooking(null);
    setFormError(null);
    setSelectedSlot((prev) =>
      prev && prev.hour === slot.hour && prev.date === slot.date ? null : slot
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedSlot) return;
    setFormError(null);

    const currentSlot = selectedSlot;

    startSubmitTransition(async () => {
      const result = await reserveSlotAction({
        date: currentSlot.date,
        hour: currentSlot.hour,
        teamName,
        phone,
      });

      if (result.ok) {
        setNowMs(Date.now());
        setConfirmedBooking(result.booking);
        setSelectedSlot(null);
        setTeamName('');
        setPhone('');

        const refreshed = await fetchDaySlotsAction(currentSlot.date);
        if (refreshed.ok) {
          setSlots(refreshed.slots);
        }
        return;
      }

      setFormError(result.error);

      if (result.code === 'SLOT_TAKEN' || result.code === 'PAST_SLOT') {
        const refreshed = await fetchDaySlotsAction(currentSlot.date);
        if (refreshed.ok) {
          setSlots(refreshed.slots);
          setSelectedSlot(null);
        }
      }
    });
  }

  const whatsappHref = confirmedBooking
    ? buildWhatsappHref(managerWhatsapp, confirmedBooking)
    : null;

  const icsHref = confirmedBooking
    ? buildBookingIcsDataUri({
        id: confirmedBooking.id,
        reference: confirmedBooking.reference,
        teamName: confirmedBooking.teamName,
        startsAtIso: new Date(
          `${confirmedBooking.date}T${confirmedBooking.hour
            .toString()
            .padStart(2, '0')}:00:00+01:00`
        ).toISOString(),
        endsAtIso: new Date(
          new Date(
            `${confirmedBooking.date}T${confirmedBooking.hour
              .toString()
              .padStart(2, '0')}:00:00+01:00`
          ).getTime() +
            60 * 60 * 1000
        ).toISOString(),
        priceFcfa: confirmedBooking.priceFcfa,
        depositFcfa: confirmedBooking.depositFcfa,
      })
    : null;

  const visibleGroups = PERIOD_GROUPS.filter(
    (g) => periodFilter === 'all' || periodFilter === g.id
  );

  const renderFormContent = () => {
    if (!selectedSlot) return null;
    return (
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#b84304]">
              Créneau sélectionné
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-[#16231b] leading-tight tabular-nums">
              {activeDay?.fullLabel} · {selectedSlot.label}
            </p>
            <p className="mt-1 text-xs sm:text-sm font-medium text-[#16231b]/80 tabular-nums">
              Total : {formatFcfa(selectedSlot.priceFcfa)} · Acompte{' '}
              {DEPOSIT_PERCENTAGE} % :{' '}
              <span className="font-bold text-[#1f5d3a]">
                {formatFcfa(selectedSlot.depositFcfa)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedSlot(null);
              setFormError(null);
            }}
            aria-label="Fermer le formulaire"
            className="min-h-[44px] min-w-[44px] -mt-1 -mr-2 flex items-center justify-center rounded-xl text-[#16231b]/75 hover:text-[#16231b] hover:bg-[#16231b]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <label
                htmlFor="teamName"
                className="block text-xs font-semibold text-[#16231b] mb-1"
              >
                Nom de l&apos;équipe
              </label>
              <input
                id="teamName"
                name="teamName"
                type="text"
                required
                minLength={2}
                maxLength={60}
                autoComplete="organization"
                placeholder="Ex : FC Godomey"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full min-h-[48px] px-3.5 rounded-xl bg-[#f8f7f2] border border-[#16231b]/25 text-base text-[#16231b] placeholder:text-[#16231b]/45 focus:outline-none focus:border-[#1f5d3a] focus-visible:ring-2 focus-visible:ring-[#e8590c]"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold text-[#16231b] mb-1"
              >
                Téléphone (+229 optionnel)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                required
                autoComplete="tel"
                placeholder="Ex : 0197000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full min-h-[48px] px-3.5 rounded-xl bg-[#f8f7f2] border border-[#16231b]/25 text-base text-[#16231b] placeholder:text-[#16231b]/45 tabular-nums focus:outline-none focus:border-[#1f5d3a] focus-visible:ring-2 focus-visible:ring-[#e8590c]"
              />
            </div>
          </div>

          {formError && (
            <p
              role="alert"
              className="text-sm font-semibold text-[#9e3602] bg-[#e8590c]/12 border border-[#e8590c]/35 rounded-xl px-3.5 py-2.5"
            >
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[50px] px-4 py-3 rounded-xl bg-[#c94705] hover:bg-[#b23d03] active:scale-[0.99] disabled:opacity-60 text-white font-display text-lg font-bold tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16231b] cursor-pointer"
          >
            {isSubmitting
              ? 'Blocage en cours...'
              : `Bloquer ce créneau (${PENDING_HOLD_MINUTES} min)`}
          </button>
        </form>
      </div>
    );
  };

  const renderConfirmedContent = () => {
    if (!confirmedBooking) return null;
    return (
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-[#1f5d3a] min-w-0">
            <CheckCircle2 className="w-6 h-6 shrink-0" aria-hidden="true" />
            <h3 className="font-display text-xl sm:text-2xl font-bold leading-none text-[#16231b] truncate">
              Créneau bloqué {PENDING_HOLD_MINUTES} min
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-sm font-bold text-[#b84304] tabular-nums shrink-0">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>{formatCountdown(confirmedBooking.expiresAtIso, nowMs)}</span>
          </div>
        </div>

        <div className="mt-3 py-2.5 border-y border-[#16231b]/10 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:text-sm">
          <div className="truncate">
            <span className="text-[#16231b]/65">Équipe : </span>
            <span className="font-semibold text-[#16231b]">
              {confirmedBooking.teamName}
            </span>
          </div>
          <div className="tabular-nums text-right sm:text-left">
            <span className="text-[#16231b]/65">Réf. : </span>
            <span className="font-bold text-[#16231b]">
              {confirmedBooking.reference}
            </span>
          </div>
          <div className="col-span-2 tabular-nums">
            <span className="text-[#16231b]/65">Créneau : </span>
            <span className="font-semibold text-[#16231b]">
              {confirmedBooking.dateLabel} · {confirmedBooking.timeLabel}
            </span>
          </div>
          <div className="tabular-nums">
            <span className="text-[#16231b]/65">Tarif : </span>
            <span className="font-semibold text-[#16231b]">
              {formatFcfa(confirmedBooking.priceFcfa)}
            </span>
          </div>
          <div className="tabular-nums text-right sm:text-left">
            <span className="text-[#16231b]/65">
              Acompte {DEPOSIT_PERCENTAGE} % :{' '}
            </span>
            <span className="font-bold text-[#1f5d3a]">
              {formatFcfa(confirmedBooking.depositFcfa)}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2.5">
          <FeexPayDepositWidget
            booking={{
              id: confirmedBooking.id,
              reference: confirmedBooking.reference,
              teamName: confirmedBooking.teamName,
              phone: confirmedBooking.phone,
              depositFcfa: confirmedBooking.depositFcfa,
            }}
            feexPayConfig={feexPayConfig}
            autoOpen={true}
            onAvailabilityChange={setOnlinePayAvailable}
            onVerifiedConfirmed={() => {
              router.push(`/reservation/${confirmedBooking.id}`);
            }}
          />

          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#1f5d3a] hover:bg-[#17482c] text-white font-display text-base sm:text-lg font-bold tracking-wide flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] transition-colors"
            >
              <MessageCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>
                {onlinePayAvailable
                  ? 'Confirmer sur WhatsApp (Plan B)'
                  : 'Confirmer sur WhatsApp'}
              </span>
            </a>
          ) : (
            <p className="text-xs font-semibold text-[#9e3602] bg-[#e8590c]/10 rounded-xl px-3 py-2">
              Numéro WhatsApp du gérant non configuré
              (NEXT_PUBLIC_MANAGER_WHATSAPP). Conservez votre référence{' '}
              {confirmedBooking.reference}.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            {icsHref && (
              <a
                href={icsHref}
                download={`reservation-${confirmedBooking.reference}.ics`}
                className="min-h-[46px] px-3 py-2 rounded-xl border border-[#16231b]/20 text-xs sm:text-sm font-semibold text-[#16231b] hover:bg-[#16231b]/5 inline-flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c]"
              >
                <CalendarPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">Calendrier</span>
              </a>
            )}

            <Link
              href={`/reservation/${confirmedBooking.id}`}
              className="min-h-[46px] px-3 py-2 rounded-xl border border-[#1f5d3a]/30 text-xs sm:text-sm font-semibold text-[#1f5d3a] hover:bg-[#1f5d3a]/5 inline-flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c]"
            >
              <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Fiche complète</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setConfirmedBooking(null)}
            className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-[#16231b]/15 text-sm font-semibold text-[#16231b] hover:bg-[#16231b]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] transition-colors cursor-pointer"
          >
            Fermer et voir les créneaux
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className={
        !isDesktop && (selectedSlot || confirmedBooking) ? 'pb-80' : 'pb-14'
      }
    >
      <div className="pt-6 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
        {/* Main Day & Slot Selection Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Horizontal 7-Day Selector */}
          <section aria-label="Choix du jour">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#16231b]">
                  1. Choisir un jour
                </h2>
                <p className="text-xs sm:text-sm text-[#3c4a41] tabular-nums">
                  {activeDay?.fullLabel}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefreshDay}
                disabled={isLoadingDay}
                className="min-h-[44px] px-3 rounded-xl border border-[#16231b]/15 bg-white hover:border-[#1f5d3a] text-xs sm:text-sm font-semibold text-[#16231b] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] cursor-pointer disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoadingDay ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>Actualiser</span>
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 snap-x">
              {days.map((day) => {
                const isActive = day.dateStr === selectedDate;
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => handleSelectDate(day.dateStr)}
                    aria-pressed={isActive}
                    className={`snap-start shrink-0 min-w-[76px] sm:min-w-[84px] min-h-[72px] px-3 py-2.5 rounded-2xl flex flex-col items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] cursor-pointer ${
                      isActive
                        ? 'bg-[#1f5d3a] text-[#f8f7f2] border border-[#1f5d3a] shadow-sm'
                        : 'bg-white text-[#16231b] border border-[#16231b]/14 hover:border-[#1f5d3a]'
                    }`}
                  >
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wide ${
                        isActive ? 'text-[#f8f7f2]/85' : 'text-[#5a665d]'
                      }`}
                    >
                      {day.weekdayShort}
                    </span>
                    <span className="font-display text-2xl font-bold leading-none mt-1 tabular-nums">
                      {day.dayNumber}
                    </span>
                    <span
                      className={`text-[11px] mt-0.5 ${
                        isActive ? 'text-[#f8f7f2]/85' : 'text-[#5a665d]'
                      }`}
                    >
                      {day.monthShort}
                    </span>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-0.5 w-6 bg-[#e8590c] rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Period Filter Tabs & Clean Legend */}
          <section aria-label="Filtres et légende des créneaux">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#16231b]/12">
              <div
                role="tablist"
                aria-label="Filtrer par moment de la journée"
                className="flex items-center gap-1 p-1 rounded-xl bg-[#efeee8] overflow-x-auto no-scrollbar"
              >
                {FILTER_TABS.map((tab) => {
                  const active = periodFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setPeriodFilter(tab.id)}
                      className={`relative min-h-[38px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] cursor-pointer ${
                        active
                          ? 'text-[#16231b]'
                          : 'text-[#3c4a41] hover:text-[#16231b]'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="slot-period-tab-bg"
                          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-0 rounded-lg bg-white shadow-xs"
                          aria-hidden="true"
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Unboxed status counts (zero-pill rule) */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-[#3c4a41] tabular-nums">
                <span className="font-bold text-[#1f5d3a]">
                  {isLoadingDay
                    ? 'Chargement…'
                    : `${freeCount} libre${freeCount > 1 ? 's' : ''}`}
                </span>
                <span aria-hidden="true" className="text-[#6b7a70]">
                  ·
                </span>
                <span>
                  {takenCount} réservé{takenCount > 1 ? 's' : ''}
                </span>
                <span aria-hidden="true" className="text-[#6b7a70]">
                  ·
                </span>
                <span>{formatFcfa(HOURLY_RATE_FCFA)} / 1h</span>
              </div>
            </div>
          </section>

          {/* Error banner */}
          {loadError && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-white border border-[#e8590c] text-[#16231b] text-sm"
            >
              <p className="font-bold text-[#b84304]">Connexion indisponible</p>
              <p className="mt-1 text-[#16231b]/85">{loadError}</p>
              <button
                type="button"
                onClick={handleRefreshDay}
                className="mt-3 min-h-[44px] px-4 py-2 rounded-xl bg-[#1f5d3a] text-white text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] cursor-pointer"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* 3. Grouped 24h Slot Grid */}
          <section aria-label="Créneaux disponibles" className="space-y-6">
            {slots.length > 0 &&
              visibleGroups.map((group) => {
                const GroupIcon = group.icon;
                const groupSlots = slots.filter(
                  (s) => s.hour >= group.minHour && s.hour <= group.maxHour
                );
                const groupFreeCount = groupSlots.filter(
                  (s) => s.state === 'free'
                ).length;

                return (
                  <div
                    key={group.id}
                    className={`transition-opacity duration-150 ${
                      isLoadingDay ? 'opacity-60' : 'opacity-100'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <GroupIcon
                          className="w-4 h-4 text-[#b84304] shrink-0"
                          aria-hidden="true"
                        />
                        <h3 className="font-display text-lg sm:text-xl font-bold text-[#16231b] truncate">
                          {group.label}
                        </h3>
                        <span className="text-xs text-[#5a665d] tabular-nums whitespace-nowrap">
                          ({group.rangeLabel})
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-[#1f5d3a] tabular-nums whitespace-nowrap shrink-0">
                        {groupFreeCount} libre{groupFreeCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 min-[360px]:grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {groupSlots.map((slot) => {
                        const isFree = slot.state === 'free';
                        const isTaken = slot.state === 'taken';
                        const isSelected =
                          selectedSlot?.date === slot.date &&
                          selectedSlot?.hour === slot.hour;

                        return (
                          <button
                            key={`${slot.date}-${slot.hour}`}
                            type="button"
                            disabled={!isFree}
                            onClick={() => handleSelectSlot(slot)}
                            aria-pressed={isSelected}
                            aria-label={`${slot.label}, ${formatFcfa(slot.priceFcfa)}, ${
                              isFree
                                ? 'Libre'
                                : isTaken
                                  ? 'Déjà réservé'
                                  : 'Créneau passé'
                            }`}
                            className={`min-h-[82px] min-w-0 p-3 rounded-2xl flex flex-col justify-between text-left transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] ${
                              isSelected
                                ? 'bg-[#1f5d3a] text-[#f8f7f2] border-2 border-[#e8590c] shadow-sm cursor-pointer'
                                : isFree
                                  ? 'bg-white text-[#16231b] border border-[#16231b]/15 hover:border-[#1f5d3a] hover:shadow-xs active:scale-[0.98] cursor-pointer'
                                  : isTaken
                                    ? 'bg-[#efeee8] text-[#5a665d] border border-[#16231b]/10 cursor-not-allowed'
                                    : 'bg-[#efeee8]/55 text-[#5a665d]/75 border border-transparent cursor-not-allowed'
                            }`}
                          >
                            <div className="w-full min-w-0 flex items-center justify-between gap-1">
                              <span
                                className={`font-display text-lg font-bold leading-none tabular-nums whitespace-nowrap ${
                                  isTaken ? 'line-through decoration-2' : ''
                                }`}
                              >
                                {slot.label}
                              </span>
                              {isSelected && (
                                <Check
                                  className="w-4 h-4 text-[#ff8747] shrink-0"
                                  aria-hidden="true"
                                />
                              )}
                            </div>

                            <div className="mt-2 w-full flex flex-col gap-0.5">
                              <span
                                className={`text-xs font-bold tabular-nums ${
                                  isSelected
                                    ? 'text-white'
                                    : isFree
                                      ? 'text-[#1f5d3a]'
                                      : 'text-[#5a665d]/80'
                                }`}
                              >
                                {formatShortFcfa(slot.priceFcfa)}
                              </span>
                              <span
                                className={`text-[11px] font-semibold leading-tight ${
                                  isSelected
                                    ? 'text-[#f8f7f2]/95'
                                    : isFree
                                      ? 'text-[#3c4a41]'
                                      : isTaken
                                        ? 'text-[#9e3602]'
                                        : 'text-[#5a665d]/75'
                                }`}
                              >
                                {isSelected
                                  ? 'Sélectionné'
                                  : isFree
                                    ? 'Libre'
                                    : isTaken
                                      ? 'Réservé'
                                      : 'Passé'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </section>
        </div>

        {/* Desktop Sticky Reservation Panel */}
        <aside
          aria-label="Récapitulatif et paiement"
          className="hidden lg:block lg:col-span-4 lg:sticky lg:top-20"
        >
          <div className="rounded-2xl bg-white border border-[#16231b]/15 p-5 shadow-xs">
            {isDesktop && confirmedBooking ? (
              renderConfirmedContent()
            ) : isDesktop && selectedSlot ? (
              renderFormContent()
            ) : (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#b84304]">
                  Votre réservation
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-[#16231b] leading-tight">
                  Touchez un créneau libre
                </h2>
                <p className="mt-2 text-sm text-[#3c4a41] leading-relaxed">
                  Sélectionnez une heure disponible pour le{' '}
                  <span className="font-semibold text-[#16231b]">
                    {activeDay?.fullLabel}
                  </span>
                  , indiquez le nom de votre équipe et réglez l&apos;acompte par
                  Mobile Money ou WhatsApp.
                </p>

                <dl className="mt-5 pt-4 border-t border-[#16231b]/10 space-y-2.5 text-sm tabular-nums">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[#3c4a41]">Durée du match</dt>
                    <dd className="font-bold text-[#16231b]">1 heure</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[#3c4a41]">Tarif terrain (24h/24)</dt>
                    <dd className="font-bold text-[#16231b]">
                      {formatFcfa(HOURLY_RATE_FCFA)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[#3c4a41]">
                      Acompte ({DEPOSIT_PERCENTAGE} %)
                    </dt>
                    <dd className="font-bold text-[#1f5d3a]">
                      {formatFcfa(basePricing.depositFcfa)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[#3c4a41]">Solde au terrain</dt>
                    <dd className="font-bold text-[#16231b]">
                      {formatFcfa(basePricing.remainingFcfa)}
                    </dd>
                  </div>
                </dl>

                <p className="mt-5 pt-4 border-t border-[#16231b]/10 text-xs text-[#5a665d] leading-relaxed">
                  Blocage automatique pendant {PENDING_HOLD_MINUTES} minutes.
                  MTN MoMo, Moov Money, Carte et WhatsApp acceptés.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Sheet Form (< 1024px only) */}
      <AnimatePresence>
        {!isDesktop && selectedSlot && !confirmedBooking && (
          <motion.div
            key="sticky-booking-form"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="false"
            aria-label="Finaliser la réservation"
            className="lg:hidden fixed bottom-0 inset-x-0 z-40 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white border-t-2 border-[#e8590c] shadow-[0_-10px_28px_rgba(22,35,27,0.18)]"
          >
            <div className="max-w-xl mx-auto px-3.5 sm:px-4 pt-3 pb-4">
              {renderFormContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Sheet Confirmation & FeexPay (< 1024px only) */}
      <AnimatePresence>
        {!isDesktop && confirmedBooking && (
          <motion.div
            key="sticky-booking-confirmation"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="status"
            aria-live="polite"
            className="lg:hidden fixed bottom-0 inset-x-0 z-40 max-h-[88dvh] overflow-y-auto rounded-t-2xl bg-white border-t-2 border-[#1f5d3a] shadow-[0_-10px_28px_rgba(22,35,27,0.2)]"
          >
            <div className="max-w-xl mx-auto px-3.5 sm:px-4 pt-3.5 pb-4">
              {renderConfirmedContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
