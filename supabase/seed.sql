-- ============================================================================
-- KHADE — local seed data (development only).
-- Loaded by `supabase db reset`. Uses fixed UUIDs for predictable testing.
-- NOTE: auth.users rows are created with a placeholder encrypted password so the
-- handle_new_auth_user trigger provisions matching public.users rows. For real
-- logins create users through Supabase Auth instead.
-- ============================================================================

-- Seed auth users (trigger will mirror into public.users).
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'admin@khade.test', crypt('password', gen_salt('bf')),
   now(), '{"full_name":"Khade Admin","role":"admin"}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'owner@khade.test', crypt('password', gen_salt('bf')),
   now(), '{"full_name":"Bella Owner","role":"business_owner"}', now(), now()),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'customer@khade.test', crypt('password', gen_salt('bf')),
   now(), '{"full_name":"Casey Customer","role":"customer"}', now(), now())
on conflict (id) do nothing;

-- Business owned by Bella, verified & featured.
insert into public.businesses
  (id, owner_id, name, slug, description, category, verification_status,
   city, country, location, is_featured, timezone)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '22222222-2222-2222-2222-222222222222',
   'Glow Studio', 'glow-studio',
   'Premium hair & makeup studio in the heart of downtown.',
   'salon', 'verified', 'New York', 'US',
   st_point(-73.9857, 40.7484)::geography, true, 'America/New_York')
on conflict (id) do nothing;

-- Staff
insert into public.business_staff
  (id, business_id, display_name, title, is_active, working_hours)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Maya', 'Senior Stylist', true,
   '[{"weekday":1,"start":"09:00","end":"17:00"},
     {"weekday":2,"start":"09:00","end":"17:00"},
     {"weekday":3,"start":"09:00","end":"17:00"},
     {"weekday":4,"start":"09:00","end":"17:00"},
     {"weekday":5,"start":"09:00","end":"17:00"}]'::jsonb)
on conflict (id) do nothing;

-- Services
insert into public.services
  (id, business_id, name, description, category, price, duration_minutes)
values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Signature Haircut',
   'Wash, cut & style.', 'salon', 65.00, 60),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bridal Makeup',
   'Full glam for your big day.', 'makeup_artist', 180.00, 90)
on conflict (id) do nothing;

insert into public.staff_services (staff_id, service_id) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd')
on conflict do nothing;

-- A platform-wide promo code (admin scope).
insert into public.promo_codes (code, description, type, value, created_by, is_active)
values ('WELCOME10', '10% off your first booking', 'percentage', 10,
        '11111111-1111-1111-1111-111111111111', true)
on conflict (code) do nothing;
