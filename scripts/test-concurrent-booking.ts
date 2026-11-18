import { eq } from 'drizzle-orm';
import { getDb, isDatabaseConfigured } from '@/src/db';
import { bookings } from '@/src/db/schema';
import { createBooking } from '@/src/lib/bookings';
import { addDaysToDateStr, getPortoNovoDateStr } from '@/src/lib/timezone';

async function main() {
  if (!isDatabaseConfigured()) {
    console.error('DATABASE_URL is not configured. Set it in .env.local or environment.');
    process.exit(1);
  }

  const db = getDb();
  const targetDate = addDaysToDateStr(getPortoNovoDateStr(), 14);
  const targetHour = 3;

  console.log(`Testing simultaneous bookings on ${targetDate} at ${targetHour}h...`);

  const [first, second] = await Promise.all([
    createBooking({
      date: targetDate,
      hour: targetHour,
      teamName: 'Test Concurrence A',
      phone: '0197000001',
    }),
    createBooking({
      date: targetDate,
      hour: targetHour,
      teamName: 'Test Concurrence B',
      phone: '0197000002',
    }),
  ]);

  const results = [first, second];
  const successes = results.filter((r) => r.ok);
  const takenErrors = results.filter((r) => !r.ok && r.code === 'SLOT_TAKEN');

  // Clean up test booking row
  for (const s of successes) {
    if (s.ok) {
      await db.delete(bookings).where(eq(bookings.id, s.booking.id));
    }
  }

  if (successes.length !== 1 || takenErrors.length !== 1) {
    console.error('Concurrency check failed:', results);
    process.exit(1);
  }

  console.log('SUCCESS: 1 booking created, 1 rejected with 23P01 ("Ce créneau vient d\'être pris").');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
