// Domain row types mirroring the public.* schema. Hand-authored for clarity;
// for a generated source of truth run `supabase gen types typescript`.

import type {
  BookingStatus,
  BusinessCategory,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  PromoType,
  UserRole,
  VerificationStatus,
} from './enums';

export type UUID = string;
export type ISOTimestamp = string;

export interface User {
  id: UUID;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  email: string | null;
  wallet_balance: number;
  fcm_token: string | null;
  is_suspended: boolean;
  metadata: Record<string, unknown>;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface Business {
  id: UUID;
  owner_id: UUID;
  name: string;
  slug: string | null;
  description: string | null;
  category: BusinessCategory;
  verification_status: VerificationStatus;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  postal_code: string | null;
  /** GeoJSON-ish; PostGIS geography serialised by the API. */
  location: unknown | null;
  logo_url: string | null;
  cover_url: string | null;
  gallery: string[];
  timezone: string;
  is_featured: boolean;
  rating_avg: number;
  rating_count: number;
  cancellation_window_hours: number;
  commission_pct: number | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface WorkingHourBlock {
  weekday: number; // 0 = Sunday
  start: string; // "09:00"
  end: string; // "17:00"
}

export interface BusinessStaff {
  id: UUID;
  business_id: UUID;
  user_id: UUID | null;
  display_name: string;
  title: string | null;
  avatar_url: string | null;
  is_active: boolean;
  working_hours: WorkingHourBlock[];
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface Service {
  id: UUID;
  business_id: UUID;
  name: string;
  description: string | null;
  category: BusinessCategory | null;
  price: number;
  currency: string;
  duration_minutes: number;
  image_url: string | null;
  is_active: boolean;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface Booking {
  id: UUID;
  customer_id: UUID;
  business_id: UUID;
  staff_id: UUID | null;
  service_id: UUID;
  status: BookingStatus;
  payment_status: PaymentStatus;
  starts_at: ISOTimestamp;
  ends_at: ISOTimestamp;
  price: number;
  currency: string;
  promo_code_id: UUID | null;
  discount_amount: number;
  notes: string | null;
  cancellation_reason: string | null;
  cancelled_by: UUID | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface Payment {
  id: UUID;
  booking_id: UUID;
  customer_id: UUID;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  gateway: string | null;
  gateway_reference: string | null;
  receipt_url: string | null;
  refunded_amount: number;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface Review {
  id: UUID;
  booking_id: UUID;
  customer_id: UUID;
  business_id: UUID;
  rating: number;
  body: string | null;
  is_verified: boolean;
  is_flagged: boolean;
  flagged_reason: string | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface PromoCode {
  id: UUID;
  code: string;
  description: string | null;
  type: PromoType;
  value: number;
  currency: string | null;
  business_id: UUID | null;
  max_redemptions: number | null;
  redeemed_count: number;
  per_user_limit: number;
  min_spend: number;
  starts_at: ISOTimestamp | null;
  expires_at: ISOTimestamp | null;
  is_active: boolean;
  created_by: UUID | null;
  created_at: ISOTimestamp;
}

export interface Notification {
  id: UUID;
  user_id: UUID;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  sent_push: boolean;
  created_at: ISOTimestamp;
}

export interface AvailableSlot {
  slot_start: ISOTimestamp;
}

export interface NearbyBusiness {
  id: UUID;
  name: string;
  category: BusinessCategory;
  rating_avg: number;
  distance_meters: number;
}
