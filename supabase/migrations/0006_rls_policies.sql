-- ============================================================================
-- KHADE 0006 — Row-Level Security
-- Principle: customers see only their own data; business owners/staff see only
-- their business's data; admins (via is_admin()) see everything.
-- Server-side enforcement — the UI never decides access.
-- ============================================================================

alter table public.users               enable row level security;
alter table public.businesses          enable row level security;
alter table public.business_staff      enable row level security;
alter table public.services            enable row level security;
alter table public.staff_services      enable row level security;
alter table public.bookings            enable row level security;
alter table public.payments            enable row level security;
alter table public.reviews             enable row level security;
alter table public.promo_codes         enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.loyalty_balances    enable row level security;
alter table public.notifications       enable row level security;
alter table public.favorites           enable row level security;
alter table public.fraud_flags         enable row level security;
alter table public.admin_audit_log     enable row level security;
alter table public.support_tickets     enable row level security;

-- ── users ────────────────────────────────────────────────────────────────────
create policy users_self_select on public.users
  for select using (id = auth.uid() or public.is_admin());
create policy users_self_update on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy users_admin_all on public.users
  for all using (public.is_admin()) with check (public.is_admin());

-- ── businesses ───────────────────────────────────────────────────────────────
-- Anyone (even anon) may read verified businesses (discovery). Owners read their
-- own regardless of status. Admins read all.
create policy businesses_public_read on public.businesses
  for select using (
    verification_status = 'verified'
    or owner_id = auth.uid()
    or public.is_admin()
  );
create policy businesses_owner_insert on public.businesses
  for insert with check (owner_id = auth.uid());
create policy businesses_owner_update on public.businesses
  for update using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
create policy businesses_admin_delete on public.businesses
  for delete using (public.is_admin());

-- ── business_staff ───────────────────────────────────────────────────────────
create policy staff_read on public.business_staff
  for select using (
    public.works_for_business(business_id) or public.is_admin()
    or exists (select 1 from public.businesses b
               where b.id = business_id and b.verification_status = 'verified')
  );
create policy staff_write on public.business_staff
  for all using (public.owns_business(business_id) or public.is_admin())
  with check (public.owns_business(business_id) or public.is_admin());

-- ── services ─────────────────────────────────────────────────────────────────
create policy services_public_read on public.services
  for select using (
    is_active
    or public.works_for_business(business_id)
    or public.is_admin()
  );
create policy services_owner_write on public.services
  for all using (public.owns_business(business_id) or public.is_admin())
  with check (public.owns_business(business_id) or public.is_admin());

-- ── staff_services ───────────────────────────────────────────────────────────
create policy staff_services_read on public.staff_services
  for select using (true);
create policy staff_services_write on public.staff_services
  for all using (
    public.owns_business((select business_id from public.services s where s.id = service_id))
    or public.is_admin()
  )
  with check (
    public.owns_business((select business_id from public.services s where s.id = service_id))
    or public.is_admin()
  );

-- ── bookings ─────────────────────────────────────────────────────────────────
-- Visible to the customer who made it, to the business it targets, and admins.
create policy bookings_read on public.bookings
  for select using (
    customer_id = auth.uid()
    or public.works_for_business(business_id)
    or public.is_admin()
  );
create policy bookings_customer_insert on public.bookings
  for insert with check (customer_id = auth.uid());
-- Customers may update their own (reschedule/cancel); business may update theirs
-- (accept/decline/complete). Admins anything.
create policy bookings_update on public.bookings
  for update using (
    customer_id = auth.uid()
    or public.works_for_business(business_id)
    or public.is_admin()
  )
  with check (
    customer_id = auth.uid()
    or public.works_for_business(business_id)
    or public.is_admin()
  );

-- ── payments ─────────────────────────────────────────────────────────────────
create policy payments_read on public.payments
  for select using (
    customer_id = auth.uid()
    or public.works_for_business(
         (select business_id from public.bookings bk where bk.id = booking_id))
    or public.is_admin()
  );
-- Writes happen via server (service role) from Stripe webhooks; customers may
-- create their own intent rows.
create policy payments_customer_insert on public.payments
  for insert with check (customer_id = auth.uid());

-- ── reviews ──────────────────────────────────────────────────────────────────
create policy reviews_public_read on public.reviews
  for select using (not is_flagged or public.is_admin() or customer_id = auth.uid());
create policy reviews_customer_insert on public.reviews
  for insert with check (
    customer_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.customer_id = auth.uid() and b.status = 'completed'
    )
  );
create policy reviews_customer_update on public.reviews
  for update using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());
create policy reviews_admin_delete on public.reviews
  for delete using (public.is_admin());

-- ── promo_codes ──────────────────────────────────────────────────────────────
-- Active codes are readable (so the app can validate); business-scoped codes are
-- managed by the owning business, platform codes by admins.
create policy promo_read on public.promo_codes
  for select using (
    is_active
    or public.owns_business(business_id)
    or public.is_admin()
  );
create policy promo_business_write on public.promo_codes
  for all using (
    (business_id is not null and public.owns_business(business_id))
    or public.is_admin()
  )
  with check (
    (business_id is not null and public.owns_business(business_id))
    or public.is_admin()
  );

-- ── loyalty ──────────────────────────────────────────────────────────────────
create policy loyalty_tx_read on public.loyalty_transactions
  for select using (
    user_id = auth.uid() or public.works_for_business(business_id) or public.is_admin()
  );
create policy loyalty_bal_read on public.loyalty_balances
  for select using (
    user_id = auth.uid() or public.works_for_business(business_id) or public.is_admin()
  );

-- ── notifications ────────────────────────────────────────────────────────────
create policy notifications_self on public.notifications
  for select using (user_id = auth.uid() or public.is_admin());
create policy notifications_self_update on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── favorites ────────────────────────────────────────────────────────────────
create policy favorites_self on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── fraud_flags / audit log: admin-only ──────────────────────────────────────
create policy fraud_admin on public.fraud_flags
  for select using (public.is_admin());
create policy audit_admin on public.admin_audit_log
  for select using (public.is_admin());

-- ── support_tickets ──────────────────────────────────────────────────────────
create policy tickets_self on public.support_tickets
  for select using (user_id = auth.uid() or public.is_admin());
create policy tickets_self_insert on public.support_tickets
  for insert with check (user_id = auth.uid());
create policy tickets_admin_update on public.support_tickets
  for update using (public.is_admin()) with check (public.is_admin());
