-- ============================================================================
-- KHADE 0005 — Functions & triggers
-- updated_at, booking time derivation, rating rollup, loyalty, fraud hooks,
-- availability + nearby search, new-user provisioning.
-- ============================================================================

-- ── generic updated_at ───────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'users','businesses','business_staff','services','bookings',
    'payments','reviews','support_tickets'
  ] loop
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$s
       for each row execute function public.set_updated_at();', t);
  end loop;
end$$;

-- ── new auth user → public.users provisioning ────────────────────────────────
-- Keeps the profile row in lock-step with Supabase Auth signups.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.phone,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ── derive booking end time from service duration ────────────────────────────
create or replace function public.booking_derive_end()
returns trigger language plpgsql as $$
declare dur int;
begin
  select duration_minutes into dur from public.services where id = new.service_id;
  if dur is null then
    raise exception 'service % not found', new.service_id;
  end if;
  new.ends_at = new.starts_at + make_interval(mins => dur);
  return new;
end;
$$;

create trigger trg_booking_derive_end
  before insert or update of starts_at, service_id on public.bookings
  for each row execute function public.booking_derive_end();

-- ── maintain businesses.rating_avg / rating_count ────────────────────────────
create or replace function public.refresh_business_rating()
returns trigger language plpgsql as $$
declare bid uuid;
begin
  bid = coalesce(new.business_id, old.business_id);
  update public.businesses b set
    rating_avg = coalesce((select round(avg(rating)::numeric, 2)
                           from public.reviews where business_id = bid), 0),
    rating_count = (select count(*) from public.reviews where business_id = bid)
  where b.id = bid;
  return null;
end;
$$;

create trigger trg_reviews_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_business_rating();

-- ── loyalty: keep materialised balance in sync with the ledger ───────────────
create or replace function public.apply_loyalty_transaction()
returns trigger language plpgsql as $$
begin
  if new.business_id is not null then
    insert into public.loyalty_balances (user_id, business_id, points)
    values (new.user_id, new.business_id, new.points)
    on conflict (user_id, business_id)
    do update set points = public.loyalty_balances.points + excluded.points,
                  updated_at = now();
  end if;
  return new;
end;
$$;

create trigger trg_loyalty_apply
  after insert on public.loyalty_transactions
  for each row execute function public.apply_loyalty_transaction();

-- ── fraud monitoring hook (STUB) ─────────────────────────────────────────────
-- MVP heuristic: flag >=3 bookings by the same customer within 5 minutes.
-- Full scoring (billing/location mismatch, payment velocity) is a V2 extension
-- point — see fraud_flag_reason enum and packages/shared/src/fraud.ts.
create or replace function public.booking_fraud_check()
returns trigger language plpgsql as $$
declare recent int;
begin
  select count(*) into recent
  from public.bookings
  where customer_id = new.customer_id
    and created_at > now() - interval '5 minutes';

  if recent >= 3 then
    insert into public.fraud_flags (booking_id, user_id, reason, details)
    values (new.id, new.customer_id, 'rapid_repeat_booking',
            jsonb_build_object('count_last_5min', recent));
  end if;
  return new;
end;
$$;

create trigger trg_booking_fraud_check
  after insert on public.bookings
  for each row execute function public.booking_fraud_check();

-- ── availability: free time slots for a staff member on a given day ──────────
-- Returns slot start times (every `slot_interval_minutes`) where the staff is
-- within working hours and not already booked. Used by the booking flow to
-- show real availability and prevent double-booking.
create or replace function public.available_slots(
  p_staff_id uuid,
  p_service_id uuid,
  p_day date,
  p_tz text default 'UTC',
  slot_interval_minutes int default 15
)
returns table (slot_start timestamptz)
language plpgsql stable as $$
declare
  dur int;
  wh jsonb;
  rec jsonb;
  day_dow int;
  win_start timestamptz;
  win_end timestamptz;
  cursor_ts timestamptz;
begin
  select duration_minutes into dur from public.services where id = p_service_id;
  select working_hours into wh from public.business_staff where id = p_staff_id;
  if dur is null or wh is null then return; end if;

  day_dow = extract(dow from p_day);  -- 0=Sunday

  for rec in select * from jsonb_array_elements(wh) loop
    if (rec ->> 'weekday')::int <> day_dow then continue; end if;

    win_start = (p_day::text || ' ' || (rec ->> 'start'))::timestamp at time zone p_tz;
    win_end   = (p_day::text || ' ' || (rec ->> 'end'))::timestamp at time zone p_tz;

    cursor_ts = win_start;
    while cursor_ts + make_interval(mins => dur) <= win_end loop
      if not exists (
        select 1 from public.bookings b
        where b.staff_id = p_staff_id
          and b.status in ('pending', 'confirmed')
          and tstzrange(b.starts_at, b.ends_at)
              && tstzrange(cursor_ts, cursor_ts + make_interval(mins => dur))
      ) then
        slot_start = cursor_ts;
        return next;
      end if;
      cursor_ts = cursor_ts + make_interval(mins => slot_interval_minutes);
    end loop;
  end loop;
end;
$$;

-- ── nearby businesses (geospatial) ───────────────────────────────────────────
create or replace function public.nearby_businesses(
  p_lng double precision,
  p_lat double precision,
  p_radius_meters int default 10000,
  p_category business_category default null
)
returns table (
  id uuid,
  name text,
  category business_category,
  rating_avg numeric,
  distance_meters double precision
)
language sql stable as $$
  select b.id, b.name, b.category, b.rating_avg,
         st_distance(b.location, st_point(p_lng, p_lat)::geography) as distance_meters
  from public.businesses b
  where b.verification_status = 'verified'
    and b.location is not null
    and st_dwithin(b.location, st_point(p_lng, p_lat)::geography, p_radius_meters)
    and (p_category is null or b.category = p_category)
  order by distance_meters asc;
$$;

-- ── role helpers (used by RLS) ───────────────────────────────────────────────
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = uid and role = 'admin');
$$;

create or replace function public.owns_business(p_business_id uuid, uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.businesses where id = p_business_id and owner_id = uid
  );
$$;

-- True if the user owns the business OR is active staff of it.
create or replace function public.works_for_business(p_business_id uuid, uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select public.owns_business(p_business_id, uid)
      or exists (
        select 1 from public.business_staff s
        where s.business_id = p_business_id and s.user_id = uid and s.is_active
      );
$$;
