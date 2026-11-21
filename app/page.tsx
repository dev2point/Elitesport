import type { Metadata } from 'next';
import Link from 'next/link';
import { BookingSteps } from '@/src/components/BookingSteps';
import { LandingHero } from '@/src/components/LandingHero';
import { LegalFooter } from '@/src/components/LegalFooter';
import { PWAInstallButton } from '@/src/components/PWAInstallButton';
import { PriceStrip } from '@/src/components/PriceStrip';
import { SkipLink } from '@/src/components/SkipLink';

export const metadata: Metadata = {
  title: 'Élite Sport Godomey — Le terrain de Godomey, ouvert 24h/24',
  description:
    "Élite Sport Godomey — Godomey, Cotonou, Bénin. Un créneau d'une heure, réservé depuis votre téléphone.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SkipLink />

      <div className="h-1 w-full bg-line" aria-hidden="true" />

      <header className="border-b border-border-subtle bg-canvas">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3.5 py-3.5 sm:px-4">
          <div className="min-w-0">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-sm font-display text-xl font-bold leading-none text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              Élite Sport Godomey
            </Link>
            <p className="mt-1 text-sm text-text-secondary">
              Godomey, Cotonou, Bénin
            </p>
          </div>
          <PWAInstallButton />
        </div>
      </header>

      <main id="main">
        <LandingHero />
        <BookingSteps />
        <PriceStrip />

        <section className="mx-auto max-w-5xl px-3.5 pb-16 sm:px-4 md:pb-24">
          <p className="text-center text-sm text-text-secondary">
            Réservation en ligne, confirmation par WhatsApp.
          </p>
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}
