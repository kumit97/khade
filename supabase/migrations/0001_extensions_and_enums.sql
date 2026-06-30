-- ============================================================================
-- KHADE 0001 — Extensions & enums
-- Postgres enums for every status field, per spec Phase 1.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";  -- crypt()/gen_salt() used by seed.sql
create extension if not exists "postgis"; -- geospatial: nearby-business search

-- Account / role model. Supabase auth.users holds credentials; we extend it.
create type user_role as enum ('customer', 'business_owner', 'staff', 'admin');

-- Business lifecycle on the platform.
create type verification_status as enum ('pending', 'in_review', 'verified', 'rejected', 'suspended');

create type business_category as enum (
  'barber',
  'salon',
  'makeup_artist',
  'nail_tech',
  'massage_therapist',
  'spa',
  'esthetician',
  'tattoo_artist',
  'skincare_clinic'
);

-- Booking lifecycle. Drives availability, notifications and payouts.
create type booking_status as enum (
  'pending',      -- created, awaiting business acceptance
  'confirmed',    -- accepted by business
  'completed',    -- service delivered
  'cancelled',    -- cancelled by either party
  'no_show',      -- customer did not attend
  'rejected'      -- declined by business
);

create type payment_status as enum (
  'unpaid',
  'authorized',
  'paid',
  'refunded',
  'partially_refunded',
  'failed'
);

create type payment_method as enum ('card', 'wallet', 'local_gateway', 'cash');

create type promo_type as enum ('percentage', 'fixed_amount');

create type loyalty_reason as enum ('earned_booking', 'redeemed', 'adjustment', 'expired', 'signup_bonus');

create type notification_type as enum (
  'booking_confirmation',
  'booking_reminder',
  'booking_cancelled',
  'booking_rescheduled',
  'payment_receipt',
  'review_request',
  'promo',
  'system'
);

create type fraud_flag_reason as enum (
  'rapid_repeat_booking',
  'billing_location_mismatch',
  'velocity_payments',
  'manual_review'
);
