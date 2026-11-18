import { isDatabaseConfigured } from '@/src/db';
import { extractDbErrorDetails, getDaySlots, type DaySlot } from '@/src/lib/bookings';
import { getPortoNovoDateStr, getUpcoming7Days, isValidDateStr } from '@/src/lib/timezone';
import { BookingExperience } from '@/src/components/BookingExperience';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
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

  return (
    <div className="min-h-screen bg-[#f8f7f2] text-[#16231b]">
      {/* Pitch boundary orange top accent line */}
      <div className="h-1 w-full bg-[#e8590c]" aria-hidden="true" />

      <header className="bg-[#1f5d3a] text-[#f8f7f2] border-b border-[#16231b]/15">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-none">
            Élite Sport Godomey
          </h1>
          <p className="mt-1.5 text-sm text-[#f8f7f2]/85">
            Godomey, Cotonou · Terrain synthétique · Ouvert 24h/24
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        <BookingExperience
          days={days}
          initialDate={initialDate}
          initialSlots={initialSlots}
          initialError={initialError}
          managerWhatsapp={managerWhatsapp}
        />
      </main>
    </div>
  );
}
