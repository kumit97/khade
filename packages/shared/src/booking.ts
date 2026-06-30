import type { Booking } from './types';
import { DEFAULT_CANCELLATION_WINDOW_HOURS } from './constants';

export interface CancellationOutcome {
  allowed: boolean;
  /** Fraction of the price to refund, 0..1. */
  refundFraction: number;
  reason: string;
}

/**
 * Cancellation-policy logic. GUESS (confirm with product):
 *  - Outside the window  → full refund.
 *  - Inside the window   → cancellation allowed but no refund (late cancel).
 *  - Already started/done → not cancellable.
 */
export function evaluateCancellation(
  booking: Pick<Booking, 'starts_at' | 'status'>,
  windowHours: number = DEFAULT_CANCELLATION_WINDOW_HOURS,
  now: Date = new Date(),
): CancellationOutcome {
  if (booking.status === 'completed' || booking.status === 'no_show') {
    return { allowed: false, refundFraction: 0, reason: 'already_finalised' };
  }
  if (booking.status === 'cancelled' || booking.status === 'rejected') {
    return { allowed: false, refundFraction: 0, reason: 'already_cancelled' };
  }

  const start = new Date(booking.starts_at).getTime();
  if (start <= now.getTime()) {
    return { allowed: false, refundFraction: 0, reason: 'in_progress_or_past' };
  }

  const hoursUntil = (start - now.getTime()) / 3_600_000;
  if (hoursUntil >= windowHours) {
    return { allowed: true, refundFraction: 1, reason: 'within_policy_full_refund' };
  }
  return { allowed: true, refundFraction: 0, reason: 'late_cancel_no_refund' };
}

/** Valid status transitions, enforced in app code before writing. */
export const BOOKING_TRANSITIONS: Record<Booking['status'], Booking['status'][]> = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
  rejected: [],
};

export function canTransition(from: Booking['status'], to: Booking['status']): boolean {
  return BOOKING_TRANSITIONS[from]?.includes(to) ?? false;
}
