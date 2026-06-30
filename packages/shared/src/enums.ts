// Mirrors the Postgres enums defined in supabase/migrations/0001. Keep in sync.

export const USER_ROLES = ['customer', 'business_owner', 'staff', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const VERIFICATION_STATUSES = [
  'pending',
  'in_review',
  'verified',
  'rejected',
  'suspended',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const BUSINESS_CATEGORIES = [
  'barber',
  'salon',
  'makeup_artist',
  'nail_tech',
  'massage_therapist',
  'spa',
  'esthetician',
  'tattoo_artist',
  'skincare_clinic',
] as const;
export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
  'rejected',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'unpaid',
  'authorized',
  'paid',
  'refunded',
  'partially_refunded',
  'failed',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ['card', 'wallet', 'local_gateway', 'cash'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PROMO_TYPES = ['percentage', 'fixed_amount'] as const;
export type PromoType = (typeof PROMO_TYPES)[number];

export const NOTIFICATION_TYPES = [
  'booking_confirmation',
  'booking_reminder',
  'booking_cancelled',
  'booking_rescheduled',
  'payment_receipt',
  'review_request',
  'promo',
  'system',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Human-friendly labels for UI rendering. */
export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  barber: 'Barber',
  salon: 'Salon',
  makeup_artist: 'Makeup Artist',
  nail_tech: 'Nail Tech',
  massage_therapist: 'Massage Therapist',
  spa: 'Spa',
  esthetician: 'Esthetician',
  tattoo_artist: 'Tattoo Artist',
  skincare_clinic: 'Skincare Clinic',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
  rejected: 'Rejected',
};
