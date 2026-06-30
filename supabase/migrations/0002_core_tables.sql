-- ============================================================================
-- KHADE 0002 — Core identity & catalogue tables
-- users, businesses, business_staff, services
-- ============================================================================

-- ── users ───────────────────────────────────────────────────────────────────
-- 1:1 extension of auth.users. Passwords/identities live in auth.* (Supabase
-- Auth), never here — per security requirements.
create table public.users (
  id            uuid primary key references auth.users (id) on delete cascade,
  role          user_role   not null default 'customer',
  full_name     text,
  phone         text,
  avatar_url    text,
  email         text,                 -- denormalised copy for display/search
  wallet_balance numeric(12,2) not null default 0 check (wallet_balance >= 0),
  fcm_token     text,                 -- push target (FCM)
  is_suspended  boolean     not null default false,
  metadata      jsonb       not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.users is 'Platform profile extending auth.users. One row per account.';

-- ── businesses ──────────────────────────────────────────────────────────────
create table public.businesses (
  id                  uuid primary key default uuid_generate_v4(),
  owner_id            uuid not null references public.users (id) on delete restrict,
  name                text not null,
  slug                text unique,
  description         text,
  category            business_category not null,
  verification_status verification_status not null default 'pending',
  email               text,
  phone               text,
  -- Location
  address_line1       text,
  address_line2       text,
  city                text,
  region              text,
  country             text,
  postal_code         text,
  location            geography(point, 4326), -- lon/lat for nearby search
  -- Presentation
  logo_url            text,
  cover_url           text,
  gallery             jsonb not null default '[]'::jsonb, -- array of storage paths
  -- Ops
  timezone            text not null default 'UTC',
  is_featured         boolean not null default false,
  rating_avg          numeric(3,2) not null default 0,   -- maintained by trigger
  rating_count        integer not null default 0,
  cancellation_window_hours integer not null default 24, -- GUESS: see README
  commission_pct      numeric(5,2),  -- null → platform default
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
comment on table public.businesses is 'Service provider profile. Owned by exactly one user (owner_id).';
create index businesses_category_idx on public.businesses (category);
create index businesses_verification_idx on public.businesses (verification_status);
create index businesses_location_idx on public.businesses using gist (location);
create index businesses_featured_idx on public.businesses (is_featured) where is_featured;

-- ── business_staff ──────────────────────────────────────────────────────────
create table public.business_staff (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid not null references public.businesses (id) on delete cascade,
  user_id       uuid references public.users (id) on delete set null, -- null = unlinked staff record
  display_name  text not null,
  title         text,
  avatar_url    text,
  is_active     boolean not null default true,
  -- Working hours: array of {weekday:0-6, start:"09:00", end:"17:00"} objects.
  working_hours jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.business_staff is 'Staff members of a business. May be linked to a user account (role=staff).';
create index business_staff_business_idx on public.business_staff (business_id);
create index business_staff_user_idx on public.business_staff (user_id);

-- ── services ────────────────────────────────────────────────────────────────
create table public.services (
  id               uuid primary key default uuid_generate_v4(),
  business_id      uuid not null references public.businesses (id) on delete cascade,
  name             text not null,
  description      text,
  category         business_category,
  price            numeric(12,2) not null check (price >= 0),
  currency         text not null default 'USD',
  duration_minutes integer not null check (duration_minutes > 0),
  image_url        text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table public.services is 'Bookable services offered by a business.';
create index services_business_idx on public.services (business_id);
create index services_active_idx on public.services (business_id, is_active);

-- Many-to-many: which staff can perform which service.
create table public.staff_services (
  staff_id   uuid not null references public.business_staff (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  primary key (staff_id, service_id)
);
