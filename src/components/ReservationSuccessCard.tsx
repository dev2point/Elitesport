'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  Clock,
  MessageCircle,
  XCircle,
} from 'lucide-react';
import type { BookingDetails } from '@/src/lib/bookings';
import {
  buildBookingIcsDataUri,
  buildGoogleCalendarUrl,
} from '@/src/lib/calendar';
import { formatFcfa } from '@/src/lib/pricing';

interface ReservationSuccessCardProps {
  booking: BookingDetails;
  managerWhatsapp: string;
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

function buildWhatsappHref(
  managerWhatsapp: string,
  booking: BookingDetails
): string | null {
  const digits = managerWhatsapp.replace(/\D/g, '');
  if (!digits) return null;

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

export function ReservationSuccessCard({
  booking,
  managerWhatsapp,
}: ReservationSuccessCardProps) {
  const router = useRouter();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const isPending = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';
  const isCompleted = booking.status === 'completed';
  const isCancelled = booking.status === 'cancelled';

  useEffect(() => {
    if (!isPending) return;
    const tick = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    const poll = setInterval(() => {
      router.refresh();
    }, 15_000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [isPending, router]);

  const calendarInput = {
    id: booking.id,
    reference: booking.reference,
    teamName: booking.teamName,
    startsAtIso: booking.startsAtIso,
    endsAtIso: booking.endsAtIso,
    priceFcfa: booking.priceFcfa,
    depositFcfa: booking.depositFcfa,
  };

  const icsHref = buildBookingIcsDataUri(calendarInput);
  const googleCalHref = buildGoogleCalendarUrl(calendarInput);
  const whatsappHref = buildWhatsappHref(managerWhatsapp, booking);

  return (
    <section className="bg-white border border-[#16231b]/15 rounded-2xl p-5 shadow-sm">
      {/* Status Banner */}
      {isConfirmed || isCompleted ? (
        <div className="flex items-start gap-3 pb-4 border-b border-[#16231b]/10">
          <CheckCircle2
            className="w-7 h-7 text-[#1f5d3a] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <h2 className="font-display text-3xl font-bold text-[#16231b] leading-none">
              {isCompleted ? 'Match terminé' : 'Réservation confirmée'}
            </h2>
            <p className="mt-1.5 text-sm text-[#16231b]/75">
              Votre créneau est validé. Présentez cette fiche au terrain 10 min
              avant le coup d&apos;envoi.
            </p>
          </div>
        </div>
      ) : isPending ? (
        <div className="pb-4 border-b border-[#16231b]/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock
                className="w-6 h-6 text-[#b84304] shrink-0"
                aria-hidden="true"
              />
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#16231b] leading-none">
                Créneau bloqué 15 minutes
              </h2>
            </div>
            {booking.expiresAtIso && (
              <span className="font-display text-xl font-bold text-[#b84304] tabular-nums">
                {formatCountdown(booking.expiresAtIso, nowMs)}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-[#16231b]/75">
            Envoyez l&apos;acompte de 30 % via WhatsApp avant la fin du délai
            pour valider définitivement votre créneau.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 pb-4 border-b border-[#16231b]/10">
          <XCircle
            className="w-7 h-7 text-[#b84304] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#16231b] leading-none">
              Réservation annulée ou expirée
            </h2>
            <p className="mt-1.5 text-sm text-[#16231b]/75">
              Ce créneau a été libéré. Vous pouvez choisir un autre horaire
              disponible.
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <dl className="mt-4 divide-y divide-[#16231b]/10 text-sm">
        <div className="py-2.5 flex items-center justify-between gap-4">
          <dt className="text-[#16231b]/65">Référence</dt>
          <dd className="font-bold text-[#16231b] tabular-nums">
            {booking.reference}
          </dd>
        </div>
        <div className="py-2.5 flex items-center justify-between gap-4">
          <dt className="text-[#16231b]/65">Équipe</dt>
          <dd className="font-semibold text-[#16231b] text-right">
            {booking.teamName}
          </dd>
        </div>
        <div className="py-2.5 flex items-center justify-between gap-4">
          <dt className="text-[#16231b]/65">Date</dt>
          <dd className="font-semibold text-[#16231b] text-right">
            {booking.dateLabel}
          </dd>
        </div>
        <div className="py-2.5 flex items-center justify-between gap-4">
          <dt className="text-[#16231b]/65">Créneau</dt>
          <dd className="font-display text-lg font-bold text-[#16231b] tabular-nums">
            {booking.timeLabel}
          </dd>
        </div>
        <div className="py-2.5 flex items-center justify-between gap-4">
          <dt className="text-[#16231b]/65">Lieu</dt>
          <dd className="font-medium text-[#16231b] text-right">
            Élite Sport Godomey, Cotonou
          </dd>
        </div>
        <div className="py-2.5 flex items-center justify-between gap-4">
          <dt className="text-[#16231b]/65">Tarif total</dt>
          <dd className="font-bold text-[#16231b] tabular-nums">
            {formatFcfa(booking.priceFcfa)}
          </dd>
        </div>
        <div className="py-2.5 flex items-center justify-between gap-4">
          <dt className="text-[#16231b]/65">Acompte (30 %)</dt>
          <dd className="font-bold text-[#1f5d3a] tabular-nums">
            {formatFcfa(booking.depositFcfa)}
          </dd>
        </div>
        <div className="py-2.5 flex items-center justify-between gap-4">
          <dt className="text-[#16231b]/65">Solde sur place</dt>
          <dd className="font-semibold text-[#16231b] tabular-nums">
            {formatFcfa(booking.remainingFcfa)}
          </dd>
        </div>
      </dl>

      {/* Primary Actions */}
      <div className="mt-5 space-y-2.5">
        {isPending && whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[50px] px-4 py-3 rounded-xl bg-[#1f5d3a] hover:bg-[#17482c] text-white font-display text-lg font-bold tracking-wide flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] transition-colors"
          >
            <MessageCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>Confirmer sur WhatsApp</span>
          </a>
        )}

        {!isCancelled && (
          <>
            <a
              href={icsHref}
              download={`reservation-${booking.reference}.ics`}
              className={`w-full min-h-[50px] px-4 py-3 rounded-xl font-display text-lg font-bold tracking-wide flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] transition-colors ${
                isConfirmed
                  ? 'bg-[#1f5d3a] hover:bg-[#17482c] text-white'
                  : 'bg-[#f8f7f2] hover:bg-[#16231b]/5 text-[#16231b] border border-[#16231b]/20'
              }`}
            >
              <CalendarPlus className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>Ajouter au calendrier</span>
            </a>

            <a
              href={googleCalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-[#1f5d3a] hover:underline flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c]"
            >
              Ouvrir dans Google Agenda
            </a>
          </>
        )}

        <Link
          href="/reserver"
          className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-[#16231b]/18 text-sm font-semibold text-[#16231b] hover:bg-[#16231b]/5 flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Retour aux créneaux</span>
        </Link>
      </div>
    </section>
  );
}
