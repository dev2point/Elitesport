import { MapPin } from 'lucide-react';
import { BookingExperience } from '@/src/components/BookingExperience';
import { LegalFooter } from '@/src/components/LegalFooter';
import { Navbar } from '@/src/components/Navbar';
import { SkipLink } from '@/src/components/SkipLink';
import { isDatabaseConfigured } from '@/src/db';
import { extractDbErrorDetails, getDaySlots, type DaySlot } from '@/src/lib/bookings';
import { resolveFeexPayWidgetConfig } from '@/src/lib/feexpay';
import {
  DEPOSIT_PERCENTAGE,
  formatFcfa,
  getSlotPricing,
  HOURLY_RATE_FCFA,
  PENDING_HOLD_MINUTES,
} from '@/src/lib/pricing';
import { getPortoNovoDateStr, getUpcoming7Days, isValidDateStr } from '@/src/lib/timezone';

export const dynamic = 'force-dynamic';

interface ReserverPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function ReserverPage({ searchParams }: ReserverPageProps) {
  const resolvedParams = await searchParams;
  const now = new Date();
  const days = getUpcoming7Days(now);
  const todayStr = getPortoNovoDateStr(now);

  const requestedDate = resolvedParams?.date;
  const isAllowedDate =
    typeof requestedDate === 'string' &&
    isValidDateStr(requestedDate) &&
    days.some((d) => d.dateStr === requestedDate);

  const initialDate = isAllowedDate ? requestedDate : todayStr;

  let initialSlots: DaySlot[] = [];
  let initialError: string | null = null;

  if (!isDatabaseConfigured()) {
    initialError =
      'La base de données Supabase (DATABASE_URL) n’est pas encore configurée.';
  } else {
    try {
      initialSlots = await getDaySlots(initialDate, undefined, now);
    } catch (error) {
      const details = extractDbErrorDetails(error);
      console.error('Failed to load initial day slots:', details.code ?? 'UNKNOWN', details.message);
      initialError =
        details.code === '42P01'
          ? 'La table « bookings » est introuvable dans la base Supabase connectée. Créez-la dans Supabase SQL Editor ou vérifiez DATABASE_URL.'
          : 'Impossible de charger les disponibilités du terrain pour le moment.';
    }
  }

  const managerWhatsapp = process.env.NEXT_PUBLIC_MANAGER_WHATSAPP ?? '';
  const feexPayConfig = await resolveFeexPayWidgetConfig();
  const samplePricing = getSlotPricing(18);

  return (
    <div className="min-h-screen bg-[#f8f7f2] text-[#16231b]">
      <SkipLink />
      <Navbar />

      <section className="relative overflow-hidden bg-[#16231b] text-[#f8f7f2] border-b border-[#16231b]/15">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(31,93,58,0.55),_transparent_65%)]"
        />
        <div className="relative mx-auto max-w-5xl px-3.5 sm:px-4 py-6 sm:py-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm font-medium text-[#f8f7f2]/80">
                <MapPin className="w-3.5 h-3.5 text-[#e8590c] shrink-0" aria-hidden="true" />
                <span>Godomey, Cotonou</span>
                <span aria-hidden="true">·</span>
                <span>Terrain synthétique</span>
                <span aria-hidden="true">·</span>
                <span>Ouvert 24h/24</span>
              </p>

              <h1 className="mt-2 font-display text-3xl min-[380px]:text-4xl sm:text-5xl font-bold tracking-tight leading-[0.95] text-white text-balance">
                Choisissez votre heure de jeu
              </h1>

              <p className="mt-2 text-sm sm:text-base text-[#f8f7f2]/80 leading-relaxed">
                Disponibilités en direct sur 7 jours. Sélectionnez un créneau libre pour
                le bloquer {PENDING_HOLD_MINUTES} minutes.
              </p>
            </div>

            {/* Clean unboxed tariff summary */}
            <dl className="grid grid-cols-3 gap-4 sm:gap-6 pt-4 border-t border-white/15 md:border-t-0 md:pt-0 md:border-l md:pl-6 shrink-0 tabular-nums">
              <div>
                <dt className="text-[11px] sm:text-xs text-[#f8f7f2]/70">
                  Tarif unique / 1h
                </dt>
                <dd className="mt-0.5 font-display text-xl sm:text-2xl font-bold text-white whitespace-nowrap">
                  {formatFcfa(HOURLY_RATE_FCFA)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] sm:text-xs text-[#f8f7f2]/70">
                  Acompte ({DEPOSIT_PERCENTAGE} %)
                </dt>
                <dd className="mt-0.5 font-display text-xl sm:text-2xl font-bold text-[#ff8747] whitespace-nowrap">
                  {formatFcfa(samplePricing.depositFcfa)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] sm:text-xs text-[#f8f7f2]/70">
                  Solde terrain
                </dt>
                <dd className="mt-0.5 font-display text-xl sm:text-2xl font-bold text-white whitespace-nowrap">
                  {formatFcfa(samplePricing.remainingFcfa)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <main id="main" className="mx-auto max-w-5xl px-3.5 sm:px-4">
        <BookingExperience
          days={days}
          initialDate={initialDate}
          initialSlots={initialSlots}
          initialError={initialError}
          managerWhatsapp={managerWhatsapp}
          feexPayConfig={feexPayConfig}
        />
      </main>

      <LegalFooter />
    </div>
  );
}