-- ============================================================================
-- KHADE 0003 — Bookings, payments, reviews
-- ============================================================================

-- ── bookings ────────────────────────────────────────────────────────────────
create table public.bookings (
  id             uuid primary key default uuid_generate_v4(),
  customer_id    uuid not null references public.users (id) on delete restrict,
  business_id    uuid not null references public.businesses (id) on delete restrict,
  staff_id       uuid references public.business_staff (id) on delete set null, -- null = "any available"
  service_id     uuid not null references public.services (id) on delete restrict,
  status         booking_status  not null default 'pending',
  payment_status payment_status  not null default 'unpaid',
  -- Scheduling. end_at is derived from service duration on insert (trigger).
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  -- Money snapshot at time of booking (services may change later).
  price          numeric(12,2) not null check (price >= 0),
  currency       text not null default 'USD',
  promo_code_id  uuid,           -- FK added in 0004 (promo_codes defined later)
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  notes          text,           -- customer note to business
  cancellation_reason text,
  cancelled_by   uuid references public.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint bookings_time_order check (ends_at > starts_at)
);
comment on table public.bookings is 'Customer booking of a service. Core marketplace transaction.';
create index bookings_customer_idx on public.bookings (customer_id);
create index bookings_business_idx on public.bookings (business_id, starts_at);
create index bookings_staff_idx on public.bookings (staff_id, starts_at);
create index bookings_status_idx on public.bookings (status);

-- Prevent double-booking the same staff member for overlapping active slots.
-- Uses a btree_gist exclusion over (staff_id, time range) for active statuses.
create extension if not exists btree_gist;
alter table public.bookings
  add constraint bookings_no_staff_overlap
  exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at) with &&
  )
  where (staff_id is not null and status in ('pending', 'confirmed'));

-- ── payments ────────────────────────────────────────────────────────────────
-- We store references and status only — never raw card data (Stripe tokenises).
create table public.payments (
  id                uuid primary key default uuid_generate_v4(),
  booking_id        uuid not null references public.bookings (id) on delete cascade,
  customer_id       uuid not null references public.users (id) on delete restrict,
  amount            numeric(12,2) not null check (amount >= 0),
  currency          text not null default 'USD',
  method            payment_method not null,
  status            payment_status not null default 'unpaid',
  gateway           text,          -- 'stripe' | local gateway name
  gateway_reference text,          -- payment intent / charge id
  receipt_url       text,
  refunded_amount   numeric(12,2) not null default 0 check (refunded_amount >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index payments_booking_idx on public.payments (booking_id);
create index payments_customer_idx on public.payments (customer_id);

-- ── reviews ─────────────────────────────────────────────────────────────────
create table public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid not null unique references public.bookings (id) on delete cascade,
  customer_id uuid not null references public.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  body        text,
  -- verified = the reviewer actually completed a booking (always true here since
  -- a review requires a booking_id, but kept explicit per spec & for moderation).
  is_verified boolean not null default true,
  is_flagged  boolean not null default false,
  flagged_reason text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index reviews_business_idx on public.reviews (business_id);
create index reviews_flagged_idx on public.reviews (is_flagged) where is_flagged;
