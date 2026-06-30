import type { PromoCode } from './types';
import {
  DEFAULT_COMMISSION_PCT,
  LOYALTY_POINTS_PER_CURRENCY_UNIT,
} from './constants';

export interface PriceBreakdown {
  subtotal: number;
  discount: number;
  total: number;
  platformCommission: number;
  businessPayout: number;
}

/** Round to 2 decimal places, avoiding binary float drift. */
const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface PromoValidationResult {
  valid: boolean;
  reason?: string;
  discount: number;
}

/**
 * Validate a promo code against an order and compute the discount. Pure — the
 * caller is responsible for incrementing redemption counts transactionally.
 */
export function applyPromo(
  promo: PromoCode | null,
  subtotal: number,
  now: Date = new Date(),
): PromoValidationResult {
  if (!promo) return { valid: false, reason: 'no_promo', discount: 0 };
  if (!promo.is_active) return { valid: false, reason: 'inactive', discount: 0 };
  if (promo.starts_at && new Date(promo.starts_at) > now)
    return { valid: false, reason: 'not_started', discount: 0 };
  if (promo.expires_at && new Date(promo.expires_at) < now)
    return { valid: false, reason: 'expired', discount: 0 };
  if (promo.max_redemptions != null && promo.redeemed_count >= promo.max_redemptions)
    return { valid: false, reason: 'fully_redeemed', discount: 0 };
  if (subtotal < promo.min_spend)
    return { valid: false, reason: 'min_spend_not_met', discount: 0 };

  const raw =
    promo.type === 'percentage'
      ? (subtotal * promo.value) / 100
      : promo.value;
  // Discount can never exceed the subtotal.
  const discount = money(Math.min(raw, subtotal));
  return { valid: true, discount };
}

export function computePrice(
  subtotal: number,
  promo: PromoCode | null,
  commissionPct: number = DEFAULT_COMMISSION_PCT,
): PriceBreakdown {
  const { discount } = applyPromo(promo, subtotal);
  const total = money(subtotal - discount);
  const platformCommission = money((total * commissionPct) / 100);
  return {
    subtotal: money(subtotal),
    discount,
    total,
    platformCommission,
    businessPayout: money(total - platformCommission),
  };
}

export function loyaltyPointsFor(total: number): number {
  return Math.floor(total * LOYALTY_POINTS_PER_CURRENCY_UNIT);
}
