'use server';

import { revalidatePath } from 'next/cache';
import { AdminUnauthorizedError, assertAdminSession } from '@/src/lib/admin-auth';
import {
  transitionBookingStatus,
  type TransitionBookingResult,
} from '@/src/lib/admin-bookings';

async function runAuthorizedBookingAction(
  bookingId: string,
  action: 'confirm' | 'cancel' | 'complete'
): Promise<TransitionBookingResult> {
  try {
    await assertAdminSession();
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return {
        ok: false,
        error: 'Session gérant expirée. Veuillez vous reconnecter.',
      };
    }
    throw error;
  }

  const result = await transitionBookingStatus(bookingId, action);
  if (result.ok) {
    revalidatePath('/admin');
    revalidatePath('/');
  }
  return result;
}

export async function confirmBookingAction(
  bookingId: string
): Promise<TransitionBookingResult> {
  return runAuthorizedBookingAction(bookingId, 'confirm');
}

export async function cancelBookingAction(
  bookingId: string
): Promise<TransitionBookingResult> {
  return runAuthorizedBookingAction(bookingId, 'cancel');
}

export async function completeBookingAction(
  bookingId: string
): Promise<TransitionBookingResult> {
  return runAuthorizedBookingAction(bookingId, 'complete');
}
