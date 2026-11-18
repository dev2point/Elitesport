import { z } from 'zod';
import { isValidDateStr } from './timezone';

/**
 * Normalizes and validates a Beninese phone number:
 * - Optional +229 or 00229 prefix
 * - 8 to 10 digits (handles both legacy 8-digit and 10-digit 01xxxxxxxx numbers)
 */
export function normalizeBeninPhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s.\-()]/g, '');
  let localDigits = cleaned;

  if (localDigits.startsWith('+229')) {
    localDigits = localDigits.slice(4);
  } else if (localDigits.startsWith('00229')) {
    localDigits = localDigits.slice(5);
  }

  if (!/^\d{8,10}$/.test(localDigits)) {
    return null;
  }

  return `+229${localDigits}`;
}

export const createBookingSchema = z.object({
  date: z
    .string()
    .trim()
    .refine(isValidDateStr, { message: 'Date invalide.' }),
  hour: z.coerce
    .number()
    .int()
    .min(0, 'Créneau invalide.')
    .max(23, 'Créneau invalide.'),
  teamName: z
    .string()
    .trim()
    .min(2, "Le nom de l'équipe doit contenir au moins 2 caractères.")
    .max(60, "Le nom de l'équipe est trop long (60 caractères max)."),
  phone: z
    .string()
    .trim()
    .transform((val, ctx) => {
      const normalized = normalizeBeninPhone(val);
      if (!normalized) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Numéro béninois invalide (8 à 10 chiffres, +229 optionnel).',
        });
        return z.NEVER;
      }
      return normalized;
    }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const adminLoginSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide.').toLowerCase(),
  password: z.string().min(1, 'Mot de passe requis.'),
});

export const adminSetupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères.')
    .max(80, 'Le nom est trop long.'),
  email: z.string().trim().email('Adresse e-mail invalide.').toLowerCase(),
  password: z
    .string()
    .min(10, 'Le mot de passe doit contenir au moins 10 caractères.')
    .max(128, 'Mot de passe trop long.'),
});

export const bookingIdSchema = z
  .string()
  .uuid('Identifiant de réservation invalide.');


