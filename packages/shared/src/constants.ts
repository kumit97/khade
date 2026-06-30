// Platform-wide configuration defaults.
// Business-logic values flagged as GUESS are MVP placeholders — confirm with
// product before launch (see README → "Assumptions to confirm").

/** Platform commission taken on each completed booking. GUESS: 15%. */
export const DEFAULT_COMMISSION_PCT = Number(
  process.env.KHADE_PLATFORM_COMMISSION_PCT ?? 15,
);

/** Default currency when a business/service does not specify one. */
export const DEFAULT_CURRENCY = process.env.KHADE_DEFAULT_CURRENCY ?? 'USD';

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
