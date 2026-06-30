-- ============================================================================
-- KHADE 0007 — Security hardening (addresses Supabase database advisors)
-- ============================================================================

-- Pin search_path on trigger/util functions so they can't be influenced by a
-- caller's session search_path (advisor 0011_function_search_path_mutable).
-- The RLS helper functions (is_admin/owns_business/works_for_business) and
-- handle_new_auth_user already set search_path at creation time.
alter function public.set_updated_at() set search_path = public;
alter function public.booking_derive_end() set search_path = public;
alter function public.refresh_business_rating() set search_path = public;
alter function public.apply_loyalty_transaction() set search_path = public;
alter function public.booking_fraud_check() set search_path = public;
alter function public.available_slots(uuid, uuid, date, text, int) set search_path = public;

-- handle_new_auth_user is invoked only by the auth.users trigger (as a
-- SECURITY DEFINER function); it must not be callable as a PostgREST RPC by the
-- API roles (advisors 0028 / 0029).
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

-- ── Known residual advisor ──────────────────────────────────────────────────
-- `rls_disabled_in_public` on `public.spatial_ref_sys` cannot be resolved:
-- that table is owned by the PostGIS extension (not by us, so we can't ALTER
-- it), and PostGIS does not support `ALTER EXTENSION ... SET SCHEMA`, so it
-- can't be moved out of `public`. It holds only static SRID reference data and
-- is safe to expose read-only. This is an accepted PostGIS-on-Supabase caveat.
