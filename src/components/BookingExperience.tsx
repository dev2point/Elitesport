'use client';

import { useEffect, useState, useTransition } from 'react';
import { CheckCircle2, Clock, MessageCircle, X } from 'lucide-react';
import { fetchDaySlotsAction, reserveSlotAction } from '@/src/actions/bookings';
import type { CreatedBookingSummary, DaySlot } from '@/src/lib/bookings';
import { formatFcfa, formatShortFcfa } from '@/src/lib/pricing';
import type { DayOption } from '@/src/lib/timezone';

interface BookingExperienceProps {
  days: DayOption[];
  initialDate: string;
  initialSlots: DaySlot[];
  initialError?: string | null;
  managerWhatsapp: string;
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
}: BookingExperienceProps) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [slots, setSlots] = useState<DaySlot[]>(initialSlots);
  const [loadError, setLoadError] = useState<string | null>(initialError);
  const [selectedSlot, setSelectedSlot] = useState<DaySlot | null>(null);

  const [teamName, setTeamName] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] =
    useState<CreatedBookingSummary | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

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

  const freeCount = slots.filter((s) => s.state === 'free').length;
  const whatsappHref = confirmedBooking
    ? buildWhatsappHref(managerWhatsapp, confirmedBooking)
    : null;

  return (
    <div className={selectedSlot || confirmedBooking ? 'pb-72' : 'pb-12'}>
      {/* 7-day horizontal scroller */}
      <section aria-label="Choix du jour" className="mt-4">
        <div className="flex items-baseline justify-between mb-2.5">
          <h2 className="font-display text-lg font-bold tracking-wide text-[#16231b]">
            Choisir un jour
          </h2>
          <span className="text-xs font-medium text-[#16231b]/70 tabular-nums">
            {activeDay?.fullLabel}
          </span>
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
                className={`snap-start shrink-0 min-w-[68px] min-h-[64px] px-3 py-2 rounded-xl flex flex-col items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] ${
                  isActive
                    ? 'bg-[#1f5d3a] text-[#f8f7f2] border border-[#1f5d3a] shadow-sm'
                    : 'bg-white text-[#16231b] border border-[#16231b]/15 hover:border-[#1f5d3a]/50'
                }`}
              >
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wide ${
                    isActive ? 'text-[#f8f7f2]/85' : 'text-[#16231b]/65'
                  }`}
                >
                  {day.weekdayShort}
                </span>
                <span className="font-display text-2xl font-bold leading-none mt-0.5 tabular-nums">
                  {day.dayNumber}
                </span>
                <span
                  className={`text-[11px] mt-0.5 ${
                    isActive ? 'text-[#f8f7f2]/85' : 'text-[#16231b]/60'
                  }`}
                >
                  {day.monthShort}
                </span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="mt-1 h-0.5 w-6 bg-[#e8590c] rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Tariff info strip (unboxed text, zero-pill rule) */}
      <section className="mt-5 py-3 border-y border-[#16231b]/12 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs sm:text-sm text-[#16231b]/80">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums">
          <span className="font-semibold text-[#16231b]">Tarifs :</span>
          <span>06h–17h · 5 000 FCFA</span>
          <span aria-hidden="true">·</span>
          <span>18h–05h · 7 500 FCFA</span>
          <span aria-hidden="true">·</span>
          <span>Acompte 30 %</span>
        </div>
        <span className="font-semibold text-[#1f5d3a] tabular-nums">
          {isLoadingDay
            ? 'Mise à jour...'
            : `${freeCount} créneau${freeCount > 1 ? 'x' : ''} libre${
                freeCount > 1 ? 's' : ''
              }`}
        </span>
      </section>

      {/* Error banner */}
      {loadError && (
        <div
          role="alert"
          className="mt-4 p-4 rounded-xl bg-white border border-[#e8590c] text-[#16231b] text-sm"
        >
          <p className="font-semibold text-[#e8590c]">Connexion indisponible</p>
          <p className="mt-1 text-[#16231b]/80">{loadError}</p>
          <button
            type="button"
            onClick={() => handleSelectDate(selectedDate)}
            className="mt-3 min-h-[44px] px-4 py-2 rounded-lg bg-[#1f5d3a] text-white text-sm font-semibold"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* 24-hour slot grid (3 columns on mobile) */}
      <section aria-label="Créneaux disponibles" className="mt-4">
        {slots.length > 0 && (
          <div
            className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-2.5 transition-opacity duration-150 ${
              isLoadingDay ? 'opacity-60' : 'opacity-100'
            }`}
          >
            {slots.map((slot) => {
              const isFree = slot.state === 'free';
              const isTaken = slot.state === 'taken';
              const isPast = slot.state === 'past';
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
                        ? 'Déjà pris'
                        : 'Créneau passé'
                  }`}
                  className={`min-h-[78px] p-2.5 rounded-xl flex flex-col justify-between text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] ${
                    isSelected
                      ? 'bg-[#1f5d3a] text-[#f8f7f2] border-2 border-[#e8590c] shadow-sm'
                      : isFree
                        ? 'bg-white text-[#16231b] border border-[#1f5d3a]/25 hover:border-[#1f5d3a] active:scale-[0.98]'
                        : isTaken
                          ? 'bg-[#16231b]/[0.06] text-[#16231b]/50 border border-[#16231b]/10 cursor-not-allowed'
                          : 'bg-[#16231b]/[0.03] text-[#16231b]/35 border border-transparent cursor-not-allowed'
                  }`}
                >
                  <div className="w-full flex items-center justify-between gap-1">
                    <span
                      className={`font-display text-lg font-bold leading-none tabular-nums ${
                        isTaken ? 'line-through decoration-2' : ''
                      }`}
                    >
                      {slot.label}
                    </span>
                  </div>

                  <div className="mt-2 w-full flex flex-col gap-0.5">
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        isSelected
                          ? 'text-[#f8f7f2]'
                          : isFree
                            ? 'text-[#1f5d3a]'
                            : 'text-[#16231b]/45'
                      }`}
                    >
                      {formatShortFcfa(slot.priceFcfa)}
                    </span>
                    <span
                      className={`text-[11px] font-medium leading-tight ${
                        isSelected
                          ? 'text-[#f8f7f2]/90'
                          : isFree
                            ? 'text-[#16231b]/65'
                            : isTaken
                              ? 'text-[#16231b]/60 font-semibold'
                              : 'text-[#16231b]/40'
                      }`}
                    >
                      {isSelected
                        ? 'Sélectionné'
                        : isFree
                          ? 'Libre'
                          : isTaken
                            ? 'Pris'
                            : 'Passé'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Sticky bottom booking form */}
      {selectedSlot && !confirmedBooking && (
        <div
          role="dialog"
          aria-label="Finaliser la réservation"
          className="fixed bottom-0 inset-x-0 z-40 bg-white border-t-2 border-[#e8590c] shadow-[0_-10px_28px_rgba(22,35,27,0.16)]"
        >
          <div className="max-w-xl mx-auto px-4 pt-3 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl font-bold text-[#16231b] leading-tight tabular-nums">
                  {activeDay?.fullLabel} · {selectedSlot.label}
                </p>
                <p className="text-xs sm:text-sm font-medium text-[#16231b]/75 mt-0.5 tabular-nums">
                  Total : {formatFcfa(selectedSlot.priceFcfa)} · Acompte 30 % :{' '}
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
                className="min-h-[44px] min-w-[44px] -mt-1 -mr-2 flex items-center justify-center rounded-lg text-[#16231b]/70 hover:text-[#16231b] hover:bg-[#16231b]/5"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                    className="w-full min-h-[48px] px-3 rounded-xl bg-[#f8f7f2] border border-[#16231b]/20 text-base text-[#16231b] placeholder:text-[#16231b]/40 focus:outline-none focus:border-[#1f5d3a] focus:ring-2 focus:ring-[#1f5d3a]/20"
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
                    className="w-full min-h-[48px] px-3 rounded-xl bg-[#f8f7f2] border border-[#16231b]/20 text-base text-[#16231b] placeholder:text-[#16231b]/40 tabular-nums focus:outline-none focus:border-[#1f5d3a] focus:ring-2 focus:ring-[#1f5d3a]/20"
                  />
                </div>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="text-sm font-semibold text-[#c93800] bg-[#e8590c]/10 border border-[#e8590c]/30 rounded-lg px-3 py-2"
                >
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[50px] px-4 py-3 rounded-xl bg-[#e8590c] hover:bg-[#cf4c07] active:scale-[0.99] disabled:opacity-60 text-white font-display text-lg font-bold tracking-wide transition-colors cursor-pointer"
              >
                {isSubmitting
                  ? 'Blocage en cours...'
                  : 'Bloquer ce créneau (15 min)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Post-booking sticky confirmation */}
      {confirmedBooking && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-0 inset-x-0 z-40 bg-white border-t-2 border-[#1f5d3a] shadow-[0_-10px_28px_rgba(22,35,27,0.18)]"
        >
          <div className="max-w-xl mx-auto px-4 pt-3.5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-[#1f5d3a]">
                <CheckCircle2 className="w-6 h-6 shrink-0" aria-hidden="true" />
                <h3 className="font-display text-2xl font-bold leading-none text-[#16231b]">
                  Créneau bloqué 15 minutes
                </h3>
              </div>

              <div className="flex items-center gap-1.5 text-sm font-bold text-[#e8590c] tabular-nums shrink-0">
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span>
                  {formatCountdown(confirmedBooking.expiresAtIso, nowMs)}
                </span>
              </div>
            </div>

            <div className="mt-3 py-2.5 border-y border-[#16231b]/10 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:text-sm">
              <div>
                <span className="text-[#16231b]/60">Équipe : </span>
                <span className="font-semibold text-[#16231b]">
                  {confirmedBooking.teamName}
                </span>
              </div>
              <div className="tabular-nums">
                <span className="text-[#16231b]/60">Réf. : </span>
                <span className="font-bold text-[#16231b]">
                  {confirmedBooking.reference}
                </span>
              </div>
              <div className="col-span-2 tabular-nums">
                <span className="text-[#16231b]/60">Créneau : </span>
                <span className="font-semibold text-[#16231b]">
                  {confirmedBooking.dateLabel} · {confirmedBooking.timeLabel}
                </span>
              </div>
              <div className="tabular-nums">
                <span className="text-[#16231b]/60">Tarif : </span>
                <span className="font-semibold text-[#16231b]">
                  {formatFcfa(confirmedBooking.priceFcfa)}
                </span>
              </div>
              <div className="tabular-nums">
                <span className="text-[#16231b]/60">Acompte 30 % : </span>
                <span className="font-bold text-[#1f5d3a]">
                  {formatFcfa(confirmedBooking.depositFcfa)}
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[50px] px-4 py-3 rounded-xl bg-[#1f5d3a] hover:bg-[#17482c] text-white font-display text-lg font-bold tracking-wide flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>Confirmer sur WhatsApp</span>
                </a>
              ) : (
                <p className="text-xs font-medium text-[#e8590c] bg-[#e8590c]/10 rounded-lg px-3 py-2">
                  Numéro WhatsApp du gérant non configuré
                  (NEXT_PUBLIC_MANAGER_WHATSAPP). Conservez votre référence{' '}
                  {confirmedBooking.reference}.
                </p>
              )}

              <button
                type="button"
                onClick={() => setConfirmedBooking(null)}
                className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-[#16231b]/15 text-sm font-semibold text-[#16231b] hover:bg-[#16231b]/5 transition-colors"
              >
                Fermer et voir les créneaux
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
