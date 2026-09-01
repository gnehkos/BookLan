-- ============================================================================
-- BookLan — complete Supabase schema, storage and seed data
--
-- Run this whole file in the Supabase SQL editor (Project > SQL Editor > New
-- query > paste > Run). Safe to re-run.
--
-- ⚠  THIS DROPS AND RECREATES EVERY BOOKLAN TABLE. Existing users, bookings
--    and reviews are deleted. That is intended for a clean demo reset.
--
-- This is the single source of truth. It includes the storage bucket for
-- profile photos, the reviews table, the 'completed' booking status, and every
-- operator whose logo ships in public/logos/.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Drop existing tables (children first) so this script is re-runnable
-- ----------------------------------------------------------------------------
drop table if exists reviews cascade;
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

-- `seat_numbers` is an array: one booking can hold several seats.
-- `status` includes 'completed' so a finished trip stops counting as active —
-- without it, an arrived booking blocks the passenger from booking again.
create table bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  trip_id uuid not null references active_trips (id) on delete cascade,
  seat_numbers integer[] not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  dropoff_station_id uuid not null references stations (id) on delete restrict,
  ticket_id text unique not null,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'completed', 'cancelled')),
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
  seat_numbers integer[] not null,
  ticket_id text unique not null,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'completed', 'cancelled')),
  total_price double precision not null,
  payment_status text not null default 'unpaid' check (payment_status in ('paid', 'unpaid')),
  -- Which of the operator's stations the passenger chose to be set down at.
  -- Nullable: bookings made before the drop-off step existed have none.
  dropoff_station_id uuid references stations (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Passenger reviews, written after a trip finishes.
create table reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  booking_id uuid references bookings (id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  -- One review per booking, so the same trip can't be rated twice.
  unique (booking_id)
);

create index if not exists reviews_company_id_idx on reviews (company_id);

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
-- STORAGE — profile photos
-- Without this bucket, uploading a profile photo fails.
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars public read" on storage.objects;
drop policy if exists "avatars anon upload" on storage.objects;
drop policy if exists "avatars anon update" on storage.objects;

create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars anon upload" on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "avatars anon update" on storage.objects
  for update using (bucket_id = 'avatars') with check (bucket_id = 'avatars');

-- ============================================================================
-- ROW LEVEL SECURITY
-- Sprint MVP has no Supabase Auth session (phone login is handled in the app
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
alter table reviews enable row level security;

create policy "anon full access" on users for all using (true) with check (true);
create policy "anon full access" on companies for all using (true) with check (true);
create policy "anon full access" on active_trips for all using (true) with check (true);
create policy "anon full access" on stations for all using (true) with check (true);
create policy "anon full access" on bookings for all using (true) with check (true);
create policy "anon full access" on schedules for all using (true) with check (true);
create policy "anon full access" on advanced_bookings for all using (true) with check (true);
create policy "anon full access" on reviews for all using (true) with check (true);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Companies
--
-- Names are chosen so they slugify to the logo filenames in public/logos/
-- (lowercase, non-alphanumerics collapsed to dashes) — that is how CompanyLogo
-- finds the artwork. Renaming a company here means renaming its file too.
-- ----------------------------------------------------------------------------
insert into companies (id, name, vehicle_type) values
  ('11111111-1111-1111-1111-111111111111', 'Vireak Buntham',   'bus'),
  ('22222222-2222-2222-2222-222222222222', 'Larryta',          'van'),
  ('33333333-3333-3333-3333-333333333333', 'Capitol Tour',     'bus'),
  ('44444444-4444-4444-4444-444444444444', 'Mekong Express',   'van'),
  ('55555555-5555-5555-5555-555555555555', 'Giant Ibis',       'bus'),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh Sorya', 'bus'),
  ('77777777-7777-7777-7777-777777777777', 'Rith Mony',        'bus'),
  ('88888888-8888-8888-8888-888888888888', 'Bayon',            'van'),
  ('99999999-9999-9999-9999-999999999999', 'Seila Angkor',     'bus'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kumho Samco',      'bus'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'iBus Cambodia',    'van');

-- ----------------------------------------------------------------------------
-- Active trips (buses already on the road, for the flag-it-down booking flow)
-- ----------------------------------------------------------------------------
insert into active_trips
  (company_id, route, origin, destination, national_road, distance_km, seats_total, seats_available, price_per_km, status)
values
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh - Siem Reap',     'Phnom Penh', 'Siem Reap',     'NR6', 12, 45,  5, 0.10, 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Phnom Penh - Siem Reap',     'Phnom Penh', 'Siem Reap',     'NR6', 28, 15,  3, 0.09, 'active'),
  ('33333333-3333-3333-3333-333333333333', 'Phnom Penh - Kampot',        'Phnom Penh', 'Kampot',        'NR3', 15, 45,  8, 0.08, 'active'),
  ('44444444-4444-4444-4444-444444444444', 'Phnom Penh - Sihanoukville', 'Phnom Penh', 'Sihanoukville', 'NR4', 40, 15,  6, 0.10, 'active'),
  ('55555555-5555-5555-5555-555555555555', 'Phnom Penh - Siem Reap',     'Phnom Penh', 'Siem Reap',     'NR6', 18, 45, 12, 0.11, 'active'),
  ('55555555-5555-5555-5555-555555555555', 'Phnom Penh - Kampot',        'Phnom Penh', 'Kampot',        'NR3', 22, 45,  9, 0.10, 'active'),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh - Battambang',    'Phnom Penh', 'Battambang',    'NR5', 31, 45, 15, 0.08, 'active'),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh - Kampong Cham',  'Phnom Penh', 'Kampong Cham',  'NR6',  9, 45,  7, 0.09, 'active'),
  ('77777777-7777-7777-7777-777777777777', 'Phnom Penh - Sihanoukville', 'Phnom Penh', 'Sihanoukville', 'NR4', 26, 45, 11, 0.09, 'active'),
  ('77777777-7777-7777-7777-777777777777', 'Phnom Penh - Svay Rieng',    'Phnom Penh', 'Svay Rieng',    'NR1', 14, 45,  6, 0.10, 'active'),
  ('88888888-8888-8888-8888-888888888888', 'Phnom Penh - Kep',           'Phnom Penh', 'Kep',           'NR3', 20, 15,  4, 0.12, 'active'),
  ('88888888-8888-8888-8888-888888888888', 'Phnom Penh - Takeo',         'Phnom Penh', 'Takeo',         'NR2',  8, 15,  5, 0.11, 'active'),
  ('99999999-9999-9999-9999-999999999999', 'Phnom Penh - Siem Reap',     'Phnom Penh', 'Siem Reap',     'NR6', 24, 45, 10, 0.10, 'active'),
  ('99999999-9999-9999-9999-999999999999', 'Phnom Penh - Kratie',        'Phnom Penh', 'Kratie',        'NR7', 16, 45,  8, 0.10, 'active'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Phnom Penh - Prey Veng',     'Phnom Penh', 'Prey Veng',     'NR1', 11, 45,  9, 0.09, 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Phnom Penh - Sihanoukville', 'Phnom Penh', 'Sihanoukville', 'NR4', 19, 15,  3, 0.12, 'active');

-- ----------------------------------------------------------------------------
-- Stations (drop-off points for on-road bookings and advance bookings)
-- ----------------------------------------------------------------------------
insert into stations (company_id, name, province, address, lat, lng) values
  -- Every (company, destination) pair in `schedules` needs at least one station,
  -- otherwise the drop-off step is a dead end for that departure. Several
  -- operators run more than one branch in a province, which is the whole point
  -- of asking the passenger to choose.
  ('11111111-1111-1111-1111-111111111111', 'Vireak Buntham Siem Reap Main',    'Siem Reap',     'NR6, Chreav, Siem Reap',        13.3671, 103.8448),
  ('11111111-1111-1111-1111-111111111111', 'Vireak Buntham Sivatha Branch',    'Siem Reap',     'Sivatha Blvd, Siem Reap',       13.3625, 103.8560),
  ('22222222-2222-2222-2222-222222222222', 'Larryta Siem Reap Station',        'Siem Reap',     'Charles de Gaulle, Siem Reap',  13.3700, 103.8500),
  ('33333333-3333-3333-3333-333333333333', 'Capitol Tour Kampot Station',      'Kampot',        'NR3, Kampot',                   10.6100, 104.1800),
  ('33333333-3333-3333-3333-333333333333', 'Capitol Tour Riverside Branch',    'Kampot',        'Riverside Rd, Kampot',          10.6180, 104.1750),
  ('44444444-4444-4444-4444-444444444444', 'Mekong Express Sihanoukville',     'Sihanoukville', 'Ekareach St, Sihanoukville',    10.6277, 103.5230),
  ('44444444-4444-4444-4444-444444444444', 'Mekong Express Port Branch',       'Sihanoukville', 'Port Rd, Sihanoukville',        10.6100, 103.5300),
  ('55555555-5555-5555-5555-555555555555', 'Giant Ibis Siem Reap',             'Siem Reap',     'Sivatha Blvd, Siem Reap',       13.3596, 103.8556),
  ('55555555-5555-5555-5555-555555555555', 'Giant Ibis Kampot',                'Kampot',        'Old Market, Kampot',            10.6060, 104.1830),
  ('66666666-6666-6666-6666-666666666666', 'Sorya Battambang Terminal',        'Battambang',    'NR5, Battambang',               13.0957, 103.2022),
  ('66666666-6666-6666-6666-666666666666', 'Sorya Battambang Central',         'Battambang',    'Street 3, Battambang',          13.1020, 103.1980),
  ('66666666-6666-6666-6666-666666666666', 'Sorya Kampong Cham Terminal',      'Kampong Cham',  'NR7, Kampong Cham',             11.9934, 105.4635),
  ('77777777-7777-7777-7777-777777777777', 'Rith Mony Sihanoukville',          'Sihanoukville', 'NR4, Sihanoukville',            10.6350, 103.5150),
  ('77777777-7777-7777-7777-777777777777', 'Rith Mony Svay Rieng',             'Svay Rieng',    'NR1, Svay Rieng',               11.0879, 105.7993),
  ('88888888-8888-8888-8888-888888888888', 'Bayon Kep Station',                'Kep',           'Kep Beach Rd, Kep',             10.4831, 104.3167),
  ('88888888-8888-8888-8888-888888888888', 'Bayon Takeo Station',              'Takeo',         'NR2, Takeo',                    10.9909, 104.7850),
  ('99999999-9999-9999-9999-999999999999', 'Seila Angkor Siem Reap',           'Siem Reap',     'NR6, Siem Reap',                13.3550, 103.8600),
  ('99999999-9999-9999-9999-999999999999', 'Seila Angkor Kratie',              'Kratie',        'NR7, Kratie',                   12.4881, 106.0189),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kumho Samco Prey Veng',            'Prey Veng',     'NR1, Prey Veng',                11.4869, 105.3253),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'iBus Sihanoukville Station',       'Sihanoukville', 'Ekareach St, Sihanoukville',    10.6200, 103.5260);

-- ----------------------------------------------------------------------------
-- Schedules (advance booking / Plan Trip — one row per departure time)
-- ----------------------------------------------------------------------------
insert into schedules
  (company_id, origin, destination, departure_time, arrival_time, duration_hours, price_per_seat, seats_total, seats_available, days_available)
values
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh', 'Siem Reap',     '07:00', '13:00', 6,    12.00, 45, 45, 'daily'),
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh', 'Siem Reap',     '09:00', '15:00', 6,    12.00, 45, 45, 'daily'),
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh', 'Siem Reap',     '13:00', '19:00', 6,    12.00, 45, 45, 'daily'),
  ('33333333-3333-3333-3333-333333333333', 'Phnom Penh', 'Kampot',        '08:00', '11:00', 3,     8.00, 45, 45, 'daily'),
  ('33333333-3333-3333-3333-333333333333', 'Phnom Penh', 'Kampot',        '14:00', '17:00', 3,     8.00, 45, 45, 'daily'),
  ('44444444-4444-4444-4444-444444444444', 'Phnom Penh', 'Sihanoukville', '07:30', '11:30', 4,    10.00, 15, 15, 'daily'),
  ('44444444-4444-4444-4444-444444444444', 'Phnom Penh', 'Sihanoukville', '12:00', '16:00', 4,    10.00, 15, 15, 'daily'),
  ('55555555-5555-5555-5555-555555555555', 'Phnom Penh', 'Siem Reap',     '06:30', '12:30', 6,    18.00, 45, 45, 'daily'),
  ('55555555-5555-5555-5555-555555555555', 'Phnom Penh', 'Kampot',        '08:00', '11:30', 3.5,  13.00, 45, 45, 'daily'),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh', 'Battambang',    '07:15', '13:15', 6,    11.00, 45, 45, 'daily'),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh', 'Kampong Cham',  '09:30', '12:00', 2.5,   7.00, 45, 45, 'daily'),
  ('77777777-7777-7777-7777-777777777777', 'Phnom Penh', 'Sihanoukville', '07:00', '11:00', 4,    10.00, 45, 45, 'daily'),
  ('77777777-7777-7777-7777-777777777777', 'Phnom Penh', 'Svay Rieng',    '13:00', '16:00', 3,     8.00, 45, 45, 'daily'),
  ('88888888-8888-8888-8888-888888888888', 'Phnom Penh', 'Kep',           '08:30', '12:00', 3.5,  12.00, 15, 15, 'daily'),
  ('88888888-8888-8888-8888-888888888888', 'Phnom Penh', 'Takeo',         '14:00', '16:00', 2,     6.00, 15, 15, 'daily'),
  ('99999999-9999-9999-9999-999999999999', 'Phnom Penh', 'Siem Reap',     '08:00', '14:00', 6,    14.00, 45, 45, 'daily'),
  ('99999999-9999-9999-9999-999999999999', 'Phnom Penh', 'Kratie',        '07:45', '13:00', 5.25, 11.00, 45, 45, 'daily'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Phnom Penh', 'Prey Veng',     '10:00', '12:15', 2.25,  6.50, 45, 45, 'daily'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Phnom Penh', 'Sihanoukville', '15:00', '19:00', 4,    11.00, 15, 15, 'daily');

-- bookings, advanced_bookings and reviews intentionally start empty — they
-- fill up live as people book through the app.
