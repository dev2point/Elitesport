import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LegalFooter } from '@/src/components/LegalFooter';
import { PWAInstallButton } from '@/src/components/PWAInstallButton';
import { SkipLink } from '@/src/components/SkipLink';
import { ReservationSuccessCard } from '@/src/components/ReservationSuccessCard';
import { isDatabaseConfigured } from '@/src/db';
import { getBookingById } from '@/src/lib/bookings';

export const dynamic = 'force-dynamic';

interface ReservationPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReservationPage({ params }: ReservationPageProps) {
  const { id } = await params;

  const booking = isDatabaseConfigured() ? await getBookingById(id) : null;
  const managerWhatsapp = process.env.NEXT_PUBLIC_MANAGER_WHATSAPP ?? '';

  return (
    <div className="min-h-screen bg-[#f8f7f2] text-[#16231b]">
      <SkipLink />

      <div className="h-1 w-full bg-[#e8590c]" aria-hidden="true" />

      <header className="bg-[#1f5d3a] text-[#f8f7f2] border-b border-[#16231b]/15">
        <div className="max-w-xl mx-auto px-3.5 sm:px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight leading-none truncate">
              Élite Sport Godomey
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#f8f7f2]/85 truncate">
              Fiche de réservation
            </p>
          </div>
          <PWAInstallButton />
        </div>
      </header>

      <main id="main" className="max-w-xl mx-auto px-3.5 sm:px-4 py-6">
        {booking ? (
          <ReservationSuccessCard
            booking={booking}
            managerWhatsapp={managerWhatsapp}
          />
        ) : (
          <section className="bg-white border border-[#16231b]/15 rounded-2xl p-6 text-center">
            <h2 className="font-display text-2xl font-bold text-[#16231b]">
              Réservation introuvable
            </h2>
            <p className="mt-2 text-sm text-[#16231b]/75">
              Vérifiez le lien reçu ou effectuez une nouvelle réservation.
            </p>
            <Link
              href="/reserver"
              className="mt-5 min-h-[48px] px-5 py-2.5 rounded-xl bg-[#1f5d3a] text-white text-sm font-bold inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8590c]"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Voir les créneaux</span>
            </Link>
          </section>
        )}
      </main>

      <LegalFooter />
    </div>
  );
}
