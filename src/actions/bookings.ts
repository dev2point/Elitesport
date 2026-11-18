'use server';

import { revalidatePath } from 'next/cache';
import { isDatabaseConfigured } from '@/src/db';
import {
  createBooking,
  extractDbErrorDetails,
  getDaySlots,
  type CreateBookingResult,
  type DaySlot,
} from '@/src/lib/bookings';
import { getPortoNovoDateStr, isValidDateStr } from '@/src/lib/timezone';

export async function reserveSlotAction(input: {
  date: string;
  hour: number;
  teamName: string;
  phone: string;
}): Promise<CreateBookingResult> {
  const result = await createBooking(input);
  revalidatePath('/');
  return result;
}

export async function fetchDaySlotsAction(dateStr: string): Promise<{
  ok: boolean;
  slots: DaySlot[];
  error?: string;
}> {
  const targetDate = isValidDateStr(dateStr) ? dateStr : getPortoNovoDateStr();

  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      slots: [],
      error: 'Base de données non configurée (DATABASE_URL manquant).',
    };
  }

  try {
    const slots = await getDaySlots(targetDate);
    return { ok: true, slots };
  } catch (error) {
    const details = extractDbErrorDetails(error);
    console.error('fetchDaySlotsAction failed:', details.code ?? 'UNKNOWN', details.message);
    return {
      ok: false,
      slots: [],
      error:
        details.code === '42P01'
          ? 'La table « bookings » est introuvable dans la base Supabase connectée.'
          : 'Impossible de charger les créneaux. Vérifiez votre connexion.',
    };
  }
}
