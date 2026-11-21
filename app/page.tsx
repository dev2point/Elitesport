import type { Metadata } from 'next';
import { BookingSteps } from '@/src/components/BookingSteps';
import { FinalCtaBanner } from '@/src/components/FinalCtaBanner';
import { LandingHero } from '@/src/components/LandingHero';
import { LandingShowcase } from '@/src/components/LandingShowcase';
import { LegalFooter } from '@/src/components/LegalFooter';
import { Navbar } from '@/src/components/Navbar';
import { PriceStrip } from '@/src/components/PriceStrip';
import { SkipLink } from '@/src/components/SkipLink';
import { isDatabaseConfigured } from '@/src/db';
import { getDaySlots } from '@/src/lib/bookings';
import { getPortoNovoDateStr } from '@/src/lib/timezone';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Élite Sport Godomey — Le terrain de Godomey, ouvert 24h/24',
  description:
    'Élite Sport Godomey — Terrain de football synthétique à Godomey, Cotonou, Bénin. Réservez votre créneau d’une heure en direct, 24h/24.',
};

async function getSafeAvailableTodayCount(): Promise<number | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const now = new Date();
    const todayStr = getPortoNovoDateStr(now);
    const slotsPromise = getDaySlots(todayStr, undefined, now);
    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => resolve(null), 1200);
    });

    const slots = await Promise.race([slotsPromise, timeoutPromise]);
    if (!slots) {
      return null;
    }
    return slots.filter((slot) => slot.state === 'free').length;
  } catch {
    return null;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export default async function HomePage() {
  const availableTodayCount = await getSafeAvailableTodayCount();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SkipLink />
      <Navbar />

      <main id="main">
        <LandingHero availableTodayCount={availableTodayCount} />
        <LandingShowcase />
        <PriceStrip />
        <BookingSteps />
        <FinalCtaBanner />
      </main>

      <LegalFooter />
    </div>
  );
}
