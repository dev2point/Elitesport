import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AdminBookingsBoard } from '@/src/components/AdminBookingsBoard';
import { AdminLogoutButton } from '@/src/components/AdminLogoutButton';
import { isDatabaseConfigured } from '@/src/db';
import { requireAdminSession } from '@/src/lib/admin-auth';
import {
  getAdminDayBookings,
  type AdminBookingItem,
} from '@/src/lib/admin-bookings';
import { extractDbErrorDetails } from '@/src/lib/bookings';
import {
  addDaysToDateStr,
  formatDateLongFr,
  formatPortoNovoTimeHHMM,
  getPortoNovoDateStr,
  isValidDateStr,
} from '@/src/lib/timezone';

export const dynamic = 'force-dynamic';

interface AdminHomePageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const { user } = await requireAdminSession();
  const resolvedParams = await searchParams;

  const now = new Date();
  const todayStr = getPortoNovoDateStr(now);
  const requestedDate = resolvedParams?.date;
  const selectedDate =
    typeof requestedDate === 'string' && isValidDateStr(requestedDate)
      ? requestedDate
      : todayStr;

  const prevDateStr = addDaysToDateStr(selectedDate, -1);
  const nextDateStr = addDaysToDateStr(selectedDate, 1);
  const dateLabel = formatDateLongFr(selectedDate);
  const lastUpdatedLabel = formatPortoNovoTimeHHMM(now);

  let bookings: AdminBookingItem[] = [];
  let loadError: string | null = null;

  if (!isDatabaseConfigured()) {
    loadError = 'La base de données (DATABASE_URL) n’est pas configurée.';
  } else {
    try {
      bookings = await getAdminDayBookings(selectedDate, undefined, now);
    } catch (error) {
      const details = extractDbErrorDetails(error);
      console.error(
        'Failed to load admin day bookings:',
        details.code ?? 'UNKNOWN',
        details.message
      );
      loadError =
        details.code === '42P01'
          ? 'La table « bookings » est introuvable dans Supabase.'
          : 'Impossible de charger les réservations du jour.';
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f2] text-[#16231b]">
      <div className="h-1 w-full bg-[#e8590c]" aria-hidden="true" />

      <header className="bg-[#1f5d3a] text-[#f8f7f2] border-b border-[#16231b]/15">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight leading-none truncate">
              Élite Sport Godomey
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#f8f7f2]/85 truncate">
              Gérant · {user.name}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium text-[#f8f7f2] hover:bg-white/10 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Page publique</span>
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-5">
        <AdminBookingsBoard
          selectedDate={selectedDate}
          todayStr={todayStr}
          dateLabel={dateLabel}
          prevDateStr={prevDateStr}
          nextDateStr={nextDateStr}
          lastUpdatedLabel={lastUpdatedLabel}
          bookings={bookings}
          loadError={loadError}
        />
      </main>
    </div>
  );
}
