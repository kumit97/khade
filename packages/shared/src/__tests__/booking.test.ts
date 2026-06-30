import { describe, it, expect } from 'vitest';
import { evaluateCancellation, canTransition } from '../booking';

const now = new Date('2026-06-30T12:00:00Z');

describe('evaluateCancellation', () => {
  it('full refund well before the window', () => {
    const r = evaluateCancellation(
      { starts_at: '2026-07-05T12:00:00Z', status: 'confirmed' },
      24,
      now,
    );
    expect(r).toMatchObject({ allowed: true, refundFraction: 1 });
  });

  it('no refund inside the window', () => {
    const r = evaluateCancellation(
      { starts_at: '2026-06-30T20:00:00Z', status: 'confirmed' },
      24,
      now,
    );
    expect(r).toMatchObject({ allowed: true, refundFraction: 0 });
  });

  it('cannot cancel a completed booking', () => {
    const r = evaluateCancellation(
      { starts_at: '2026-06-29T12:00:00Z', status: 'completed' },
      24,
      now,
    );
    expect(r.allowed).toBe(false);
  });
});

describe('canTransition', () => {
  it('allows pending → confirmed', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true);
  });
  it('blocks completed → confirmed', () => {
    expect(canTransition('completed', 'confirmed')).toBe(false);
  });
});
