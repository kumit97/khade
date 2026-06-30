// Platform-wide configuration defaults.
// Business-logic values flagged as GUESS are MVP placeholders — confirm with
// product before launch (see README → "Assumptions to confirm").

/** Platform commission taken on each completed booking. GUESS: 15%. */
export const DEFAULT_COMMISSION_PCT = Number(
  process.env.KHADE_PLATFORM_COMMISSION_PCT ?? 15,
);

/** Default currency when a business/service does not specify one.
 *  NGN — KHADE launches in Nigeria; Paystack settles in NGN. */
export const DEFAULT_CURRENCY = process.env.KHADE_DEFAULT_CURRENCY ?? 'NGN';

/** Supported currencies (Paystack: NGN, GHS, ZAR, KES, USD). */
export const SUPPORTED_CURRENCIES = ['NGN', 'GHS', 'ZAR', 'KES', 'USD'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** Paystack (and most African gateways) charge in the minor unit (kobo for
 *  NGN, pesewas for GHS, cents for ZAR/KES/USD): multiply the major amount by
 *  100. Use these instead of ad-hoc `* 100` so rounding stays consistent. */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}
export function fromMinorUnits(minor: number): number {
  return Math.round(minor) / 100;
}

/** Currency symbols for display. */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  GHS: 'GH₵',
  ZAR: 'R',
  KES: 'KSh',
  USD: '$',
};

export function formatMoney(amount: number, currency = DEFAULT_CURRENCY): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Default free-cancellation window (hours before start). GUESS: 24h. */
export const DEFAULT_CANCELLATION_WINDOW_HOURS = 24;

/** Loyalty points earned per unit of currency spent. GUESS: 1 pt / $1. */
export const LOYALTY_POINTS_PER_CURRENCY_UNIT = 1;

/** Granularity of bookable time slots, in minutes. */
export const SLOT_INTERVAL_MINUTES = 15;

/** Discovery defaults. */
export const DEFAULT_SEARCH_RADIUS_METERS = 10_000;
export const MAX_SEARCH_RADIUS_METERS = 50_000;

/** Rate-limit budgets (requests per window). Enforced server-side — see
 *  packages/shared/src/rateLimit.ts for the in-memory reference limiter. */
export const RATE_LIMITS = {
  authPerMinute: 10,
  bookingCreatePerMinute: 5,
} as const;

export const APP_NAMES = {
  customer: 'KHADE',
  business: 'KHADE for Business',
  admin: 'KHADE Admin',
} as const;
