export const HOURLY_RATE_FCFA = 25000;
export const DAY_RATE_FCFA = HOURLY_RATE_FCFA;
export const NIGHT_RATE_FCFA = HOURLY_RATE_FCFA;
export const DEPOSIT_PERCENTAGE = 30;
export const PENDING_HOLD_MINUTES = 15;

export interface SlotPricing {
  priceFcfa: number;
  depositFcfa: number;
  remainingFcfa: number;
  isNightRate: boolean;
}

/**
 * Computes integer FCFA pricing for a 1-hour slot starting at `hour` (0..23)
 * in Africa/Porto-Novo local time.
 * Flat rate 24h/24: 25 000 FCFA / hour, 30% deposit (7 500 FCFA).
 */
export function getSlotPricing(hour: number): SlotPricing {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new RangeError(`Invalid slot hour: ${hour}`);
  }

  const isNightRate = hour >= 18 || hour <= 5;
  const priceFcfa = HOURLY_RATE_FCFA;
  const depositFcfa = Math.round((priceFcfa * DEPOSIT_PERCENTAGE) / 100);
  const remainingFcfa = priceFcfa - depositFcfa;

  return {
    priceFcfa,
    depositFcfa,
    remainingFcfa,
    isNightRate,
  };
}

export function formatFcfa(amount: number): string {
  const safeInt = Math.trunc(amount);
  const formatted = safeInt
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

export function formatShortFcfa(amount: number): string {
  const safeInt = Math.trunc(amount);
  const formatted = safeInt
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} F`;
}
