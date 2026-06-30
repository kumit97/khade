-- ============================================================================
-- KHADE 0004 — Engagement & growth tables
-- promo_codes, loyalty, notifications, favorites, fraud flags, admin audit log
-- ============================================================================

-- ── promo_codes ─────────────────────────────────────────────────────────────
create table public.promo_codes (
  id              uuid primary key default uuid_generate_v4(),
  code            text not null unique,
  description     text,
  type            promo_type not null,
  value           numeric(12,2) not null check (value >= 0), -- pct (0-100) or fixed amount
  currency        text default 'USD',
  -- Scope: null business_id = platform-wide (admin). Otherwise business-specific.
  business_id     uuid references public.businesses (id) on delete cascade,
  max_redemptions integer,        -- null = unlimited
  redeemed_count  integer not null default 0,
  per_user_limit  integer not null default 1,
  min_spend       numeric(12,2) not null default 0,
  starts_at       timestamptz,
  expires_at      timestamptz,
  is_active       boolean not null default true,
  created_by      uuid references public.users (id) on delete set null,
  created_at      timestamptz not null default now()
);
create index promo_codes_code_idx on public.promo_codes (lower(code));
create index promo_codes_business_idx on public.promo_codes (business_id);

-- Now that promo_codes exists, wire up the bookings FK declared in 0003.
alter table public.bookings
  add constraint bookings_promo_code_fk
  foreign key (promo_code_id) references public.promo_codes (id) on delete set null;

-- ── loyalty ─────────────────────────────────────────────────────────────────
-- Running balance is materialised on users; the ledger is the source of truth.
create table public.loyalty_transactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users (id) on delete cascade,
  business_id uuid references public.businesses (id) on delete set null,
  booking_id  uuid references public.bookings (id) on delete set null,
  points      integer not null,  -- positive = earned, negative = redeemed
  reason      loyalty_reason not null,
  note        text,
  created_at  timestamptz not null default now()
);
create index loyalty_tx_user_idx on public.loyalty_transactions (user_id);

create table public.loyalty_balances (
  user_id     uuid not null references public.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  points      integer not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (user_id, business_id)
);

-- ── notifications ───────────────────────────────────────────────────────────
create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users (id) on delete cascade,
  type        notification_type not null,
  title       text not null,
  body        text,
  data        jsonb not null default '{}'::jsonb, -- deep-link payload
  is_read     boolean not null default false,
  sent_push   boolean not null default false,     -- whether FCM delivery attempted
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, is_read);

-- ── favorites ───────────────────────────────────────────────────────────────
create table public.favorites (
  user_id     uuid not null references public.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, business_id)
);

-- ── fraud_flags ─────────────────────────────────────────────────────────────
-- Populated by stubbed monitoring hooks on payment/booking creation.
create table public.fraud_flags (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid references public.bookings (id) on delete cascade,
  payment_id  uuid references public.payments (id) on delete cascade,
  user_id     uuid references public.users (id) on delete set null,
  reason      fraud_flag_reason not null,
  details     jsonb not null default '{}'::jsonb,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index fraud_flags_unresolved_idx on public.fraud_flags (resolved) where not resolved;

-- ── admin_audit_log ─────────────────────────────────────────────────────────
create table public.admin_audit_log (
  id          uuid primary key default uuid_generate_v4(),
  admin_id    uuid references public.users (id) on delete set null,
  action      text not null,        -- e.g. 'business.verify', 'user.suspend'
  entity_type text,
  entity_id   uuid,
  before      jsonb,
  after       jsonb,
  ip_address  inet,
  created_at  timestamptz not null default now()
);
create index admin_audit_entity_idx on public.admin_audit_log (entity_type, entity_id);

-- ── support_tickets ─────────────────────────────────────────────────────────
create table public.support_tickets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.users (id) on delete set null,
  subject     text not null,
  body        text,
  status      text not null default 'open', -- open | pending | resolved | closed
  assigned_to uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
