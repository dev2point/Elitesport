import type { Metadata } from 'next';
import { BookingSteps } from '@/src/components/BookingSteps';
import { FinalCtaBanner } from '@/src/components/FinalCtaBanner';
import { LandingHero } from '@/src/components/LandingHero';
import { LandingShowcase } from '@/src/components/LandingShowcase';
import { LegalFooter } from '@/src/components/LegalFooter';
import { PriceStrip } from '@/src/components/PriceStrip';
import { SkipLink } from '@/src/components/SkipLink';
import { isDatabaseConfigured } from '@/src/db';
import { getDaySlots } from '@/src/lib/bookings';
import { getPortoNovoDateStr, getUpcoming7Days } from '@/src/lib/timezone';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'TERRAIN — Réserve ton terrain de football au Bénin',
  description:
    'Trouve et réserve les meilleurs terrains de football à Cotonou et au Bénin. Choisis ton créneau, invite ton équipe et profite du jeu.',
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
  const now = new Date();
  const days = getUpcoming7Days(now);
  const availableTodayCount = await getSafeAvailableTodayCount();

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#17231D]">
      <SkipLink />

      <main id="main">
        <LandingHero days={days} availableTodayCount={availableTodayCount} />
        <LandingShowcase />
        <PriceStrip />
        <BookingSteps />
        <FinalCtaBanner />
      </main>

      <LegalFooter />
    </div>
  );
}
