import { describe, it, expect } from 'vitest';
import { applyPromo, computePrice, loyaltyPointsFor } from '../pricing';
import type { PromoCode } from '../types';

const basePromo: PromoCode = {
  id: 'p1',
  code: 'SAVE',
  description: null,
  type: 'percentage',
  value: 10,
  currency: 'USD',
  business_id: null,
  max_redemptions: null,
  redeemed_count: 0,
  per_user_limit: 1,
  min_spend: 0,
  starts_at: null,
  expires_at: null,
  is_active: true,
  created_by: null,
  created_at: '2026-01-01T00:00:00Z',
};

describe('applyPromo', () => {
  it('applies a percentage discount', () => {
    expect(applyPromo(basePromo, 100).discount).toBe(10);
  });

  it('applies a fixed discount capped at subtotal', () => {
    const promo = { ...basePromo, type: 'fixed_amount' as const, value: 200 };
    expect(applyPromo(promo, 50).discount).toBe(50);
  });

  it('rejects expired codes', () => {
    const promo = { ...basePromo, expires_at: '2020-01-01T00:00:00Z' };
    expect(applyPromo(promo, 100)).toMatchObject({ valid: false, reason: 'expired' });
  });

  it('rejects when min spend not met', () => {
    const promo = { ...basePromo, min_spend: 150 };
    expect(applyPromo(promo, 100).reason).toBe('min_spend_not_met');
  });

  it('rejects fully redeemed codes', () => {
    const promo = { ...basePromo, max_redemptions: 5, redeemed_count: 5 };
    expect(applyPromo(promo, 100).reason).toBe('fully_redeemed');
  });
});

describe('computePrice', () => {
  it('splits commission and payout', () => {
    const b = computePrice(100, basePromo, 15);
    expect(b.total).toBe(90);
    expect(b.platformCommission).toBe(13.5);
    expect(b.businessPayout).toBe(76.5);
  });
});

describe('loyaltyPointsFor', () => {
  it('floors to whole points', () => {
    expect(loyaltyPointsFor(65.9)).toBe(65);
  });
});
