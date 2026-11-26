export const HOURLY_RATE_FCFA = 25000;
export const DAY_RATE_FCFA = HOURLY_RATE_FCFA;
export const NIGHT_RATE_FCFA = HOURLY_RATE_FCFA;
export const PENDING_HOLD_MINUTES = 15;

export interface SlotPricing {
  priceFcfa: number;
  isNightRate: boolean;
}

/**
 * Integer FCFA pricing for a 1-hour slot starting at `hour` (0..23)
 * in Africa/Porto-Novo local time.
 * Flat rate 24h/24: 25 000 FCFA / hour, payable in full before confirmation.
 */
export function getSlotPricing(hour: number): SlotPricing {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new RangeError(`Invalid slot hour: ${hour}`);
  }

  return {
    priceFcfa: HOURLY_RATE_FCFA,
    isNightRate: hour >= 18 || hour <= 5,
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
