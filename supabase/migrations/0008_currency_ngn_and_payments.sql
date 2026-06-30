-- ============================================================================
-- KHADE 0008 — Default currency → NGN, and payment integrity for Paystack
-- ============================================================================

-- Nigeria-first launch: new rows default to NGN.
alter table public.services    alter column currency set default 'NGN';
alter table public.bookings     alter column currency set default 'NGN';
alter table public.payments     alter column currency set default 'NGN';
alter table public.promo_codes  alter column currency set default 'NGN';

-- A gateway reference (Paystack transaction reference) must be unique so the
-- webhook and the verify endpoint are idempotent and can't double-credit.
create unique index if not exists payments_gateway_reference_key
  on public.payments (gateway_reference)
  where gateway_reference is not null;

-- Helps the webhook look a payment up by reference quickly.
create index if not exists payments_status_idx on public.payments (status);
