-- ============================================================================
-- BookLan — Supabase schema + seed data
-- Run this whole file in the Supabase SQL editor (Project > SQL Editor > New query).
-- Safe to re-run: it drops and recreates every BookLan table below.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Drop existing tables (children first) so this script is re-runnable
-- ----------------------------------------------------------------------------
drop table if exists advanced_bookings cascade;
drop table if exists bookings cascade;
drop table if exists schedules cascade;
drop table if exists stations cascade;
drop table if exists active_trips cascade;
drop table if exists companies cascade;
drop table if exists users cascade;

-- ============================================================================
-- TABLES
-- ============================================================================

create table users (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text,
  profile_photo_url text,
  created_at timestamptz not null default now()
);

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vehicle_type text not null check (vehicle_type in ('bus', 'van'))
);

create table active_trips (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  route text not null,
  origin text not null,
  destination text not null,
  national_road text not null,
  distance_km integer not null,
  seats_total integer not null,
  seats_available integer not null,
  price_per_km double precision not null,
  status text not null default 'active' check (status in ('active', 'inactive'))
);

create table stations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  province text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  trip_id uuid not null references active_trips (id) on delete cascade,
  seat_number integer not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  dropoff_station_id uuid not null references stations (id) on delete restrict,
  ticket_id text unique not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  total_price double precision not null,
  payment_status text not null default 'unpaid' check (payment_status in ('paid', 'unpaid')),
  distance_remaining_km integer not null,
  created_at timestamptz not null default now()
);

create table schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  origin text not null,
  destination text not null,
  departure_time text not null,
  arrival_time text not null,
  duration_hours double precision not null,
  price_per_seat double precision not null,
  seats_total integer not null,
  seats_available integer not null,
  days_available text not null default 'daily'
);

create table advanced_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  schedule_id uuid not null references schedules (id) on delete cascade,
  travel_date date not null,
  seat_number integer not null,
  ticket_id text unique not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  total_price double precision not null,
  payment_status text not null default 'unpaid' check (payment_status in ('paid', 'unpaid')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- REALTIME — bookings must stream updates so the tracking screen and the
-- "driver simulation via Supabase dashboard" demo trick both work live.
-- ============================================================================
do $$
begin
  alter publication supabase_realtime add table bookings;
exception
  when duplicate_object then null;
end $$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- Sprint MVP has no Supabase Auth session (phone/OTP is faked in the app
-- layer), so every request comes in on the shared anon key. Policies below
-- are intentionally permissive for the demo — tighten before a real launch.
-- ============================================================================
alter table users enable row level security;
alter table companies enable row level security;
alter table active_trips enable row level security;
alter table stations enable row level security;
alter table bookings enable row level security;
alter table schedules enable row level security;
alter table advanced_bookings enable row level security;

create policy "anon full access" on users for all using (true) with check (true);
create policy "anon full access" on companies for all using (true) with check (true);
create policy "anon full access" on active_trips for all using (true) with check (true);
create policy "anon full access" on stations for all using (true) with check (true);
create policy "anon full access" on bookings for all using (true) with check (true);
create policy "anon full access" on schedules for all using (true) with check (true);
create policy "anon full access" on advanced_bookings for all using (true) with check (true);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Companies (fixed ids so the rest of the seed data can reference them)
-- ----------------------------------------------------------------------------
insert into companies (id, name, vehicle_type) values
  ('11111111-1111-1111-1111-111111111111', 'Vireak Buntham', 'bus'),
  ('22222222-2222-2222-2222-222222222222', 'Larita', 'van'),
  ('33333333-3333-3333-3333-333333333333', 'Capitol Tour', 'bus'),
  ('44444444-4444-4444-4444-444444444444', 'Mekong Express', 'van');

-- ----------------------------------------------------------------------------
-- Active trips (fake mid-route buses/vans for the on-road booking demo)
-- ----------------------------------------------------------------------------
insert into active_trips
  (company_id, route, origin, destination, national_road, distance_km, seats_total, seats_available, price_per_km, status)
values
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh - Siem Reap', 'Phnom Penh', 'Siem Reap', 'NR6', 12, 45, 5, 0.10, 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Phnom Penh - Siem Reap', 'Phnom Penh', 'Siem Reap', 'NR6', 28, 15, 3, 0.09, 'active'),
  ('33333333-3333-3333-3333-333333333333', 'Phnom Penh - Kampot', 'Phnom Penh', 'Kampot', 'NR3', 15, 45, 8, 0.08, 'active'),
  ('44444444-4444-4444-4444-444444444444', 'Phnom Penh - Sihanoukville', 'Phnom Penh', 'Sihanoukville', 'NR4', 40, 15, 6, 0.10, 'active');

-- ----------------------------------------------------------------------------
-- Stations (drop-off points for on-road bookings and advance bookings)
-- ----------------------------------------------------------------------------
insert into stations (company_id, name, province, address, lat, lng) values
  ('11111111-1111-1111-1111-111111111111', 'Vireak Buntham Siem Reap Main', 'Siem Reap', 'NR6, Siem Reap', 13.3671, 103.8448),
  ('11111111-1111-1111-1111-111111111111', 'Vireak Buntham Siem Reap Branch', 'Siem Reap', 'Sivatha Blvd, Siem Reap', 13.3625, 103.8560),
  ('22222222-2222-2222-2222-222222222222', 'Larita Siem Reap Station', 'Siem Reap', 'Charles de Gaulle, Siem Reap', 13.3700, 103.8500),
  ('33333333-3333-3333-3333-333333333333', 'Capitol Tour Kampot Station', 'Kampot', 'NR3, Kampot', 10.6100, 104.1800),
  ('44444444-4444-4444-4444-444444444444', 'Mekong Express Sihanoukville Station', 'Sihanoukville', 'Ekareach St', 10.6277, 103.5230);

-- ----------------------------------------------------------------------------
-- Schedules (advance booking, one row per departure time)
-- ----------------------------------------------------------------------------
insert into schedules
  (company_id, origin, destination, departure_time, arrival_time, duration_hours, price_per_seat, seats_total, seats_available, days_available)
values
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh', 'Siem Reap', '07:00', '13:00', 6, 12.00, 45, 45, 'daily'),
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh', 'Siem Reap', '09:00', '15:00', 6, 12.00, 45, 45, 'daily'),
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh', 'Siem Reap', '13:00', '19:00', 6, 12.00, 45, 45, 'daily'),
  ('33333333-3333-3333-3333-333333333333', 'Phnom Penh', 'Kampot', '08:00', '11:00', 3, 8.00, 45, 45, 'daily'),
  ('33333333-3333-3333-3333-333333333333', 'Phnom Penh', 'Kampot', '14:00', '17:00', 3, 8.00, 45, 45, 'daily'),
  ('44444444-4444-4444-4444-444444444444', 'Phnom Penh', 'Sihanoukville', '07:30', '11:30', 4, 10.00, 15, 15, 'daily'),
  ('44444444-4444-4444-4444-444444444444', 'Phnom Penh', 'Sihanoukville', '12:00', '16:00', 4, 10.00, 15, 15, 'daily');

-- bookings and advanced_bookings intentionally start empty — they fill up
-- live during the demo as judges book through the app.
