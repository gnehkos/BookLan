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
  -- Where the passenger waited, named rather than only as coordinates, so a
  -- receipt read months later still means something.
  pickup_name text,
  -- Milestones, for the detail panel in booking history.
  boarded_at timestamptz,
  completed_at timestamptz,
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
  departure_station_id uuid references stations (id) on delete set null,
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
-- Demo passengers. Reviews below are written by these accounts; the phone
-- numbers sit in a reserved block so they cannot collide with a real signup.
insert into users (id, phone, name) values
  ('d0000000-0000-4000-8000-000000000001', '+85510000001', 'Sok Chanthy'),
  ('d0000000-0000-4000-8000-000000000002', '+85510000002', 'Chea Sopheak'),
  ('d0000000-0000-4000-8000-000000000003', '+85510000003', 'Ly Sreymom'),
  ('d0000000-0000-4000-8000-000000000004', '+85510000004', 'Keo Ratana'),
  ('d0000000-0000-4000-8000-000000000005', '+85510000005', 'Ung Vibol'),
  ('d0000000-0000-4000-8000-000000000006', '+85510000006', 'Pich Sothea'),
  ('d0000000-0000-4000-8000-000000000007', '+85510000007', 'Mao Kanha'),
  ('d0000000-0000-4000-8000-000000000008', '+85510000008', 'Heng Vannak'),
  ('d0000000-0000-4000-8000-000000000009', '+85510000009', 'Sim Chariya'),
  ('d0000000-0000-4000-8000-000000000010', '+85510000010', 'Chhun Piseth'),
  ('d0000000-0000-4000-8000-000000000011', '+85510000011', 'Noun Sreypov'),
  ('d0000000-0000-4000-8000-000000000012', '+85510000012', 'Yim Borey'),
  ('d0000000-0000-4000-8000-000000000013', '+85510000013', 'Kong Maly'),
  ('d0000000-0000-4000-8000-000000000014', '+85510000014', 'Tep Sovann'),
  ('d0000000-0000-4000-8000-000000000015', '+85510000015', 'Chan Dara'),
  ('d0000000-0000-4000-8000-000000000016', '+85510000016', 'Muong Sokha');

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
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh - Siem Reap'        , 'Phnom Penh', 'Siem Reap'      , 'NR6',  12,  45,   5,  1.083, 'active'),
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh - Siem Reap'        , 'Phnom Penh', 'Siem Reap'      , 'NR6',  26,  45,  18,    0.5, 'active'),
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh - Battambang'       , 'Phnom Penh', 'Battambang'     , 'NR5',  33,  45,  21,  0.333, 'active'),
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh - Sihanoukville'    , 'Phnom Penh', 'Sihanoukville'  , 'NR4',  17,  45,   9,  0.588, 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Phnom Penh - Siem Reap'        , 'Phnom Penh', 'Siem Reap'      , 'NR6',  28,  15,   3,  0.464, 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Phnom Penh - Siem Reap'        , 'Phnom Penh', 'Siem Reap'      , 'NR6',   9,  15,   6,  1.444, 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Phnom Penh - Battambang'       , 'Phnom Penh', 'Battambang'     , 'NR5',  21,  15,   4,  0.524, 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Phnom Penh - Kampot'           , 'Phnom Penh', 'Kampot'         , 'NR3',  35,  15,   2,  0.229, 'active'),
  ('33333333-3333-3333-3333-333333333333', 'Phnom Penh - Kampot'           , 'Phnom Penh', 'Kampot'         , 'NR3',  15,  45,   8,  0.533, 'active'),
  ('33333333-3333-3333-3333-333333333333', 'Phnom Penh - Kep'              , 'Phnom Penh', 'Kep'            , 'NR3',  24,  45,  14,  0.375, 'active'),
  ('33333333-3333-3333-3333-333333333333', 'Phnom Penh - Sihanoukville'    , 'Phnom Penh', 'Sihanoukville'  , 'NR4',  30,  45,  26,  0.333, 'active'),
  ('44444444-4444-4444-4444-444444444444', 'Phnom Penh - Sihanoukville'    , 'Phnom Penh', 'Sihanoukville'  , 'NR4',  40,  15,   6,   0.25, 'active'),
  ('44444444-4444-4444-4444-444444444444', 'Phnom Penh - Sihanoukville'    , 'Phnom Penh', 'Sihanoukville'  , 'NR4',  13,  15,   2,  0.769, 'active'),
  ('44444444-4444-4444-4444-444444444444', 'Phnom Penh - Kampot'           , 'Phnom Penh', 'Kampot'         , 'NR3',  19,  15,   7,  0.421, 'active'),
  ('44444444-4444-4444-4444-444444444444', 'Phnom Penh - Siem Reap'        , 'Phnom Penh', 'Siem Reap'      , 'NR6',  31,  15,   4,  0.419, 'active'),
  ('55555555-5555-5555-5555-555555555555', 'Phnom Penh - Siem Reap'        , 'Phnom Penh', 'Siem Reap'      , 'NR6',  18,  45,  12,  0.722, 'active'),
  ('55555555-5555-5555-5555-555555555555', 'Phnom Penh - Kampot'           , 'Phnom Penh', 'Kampot'         , 'NR3',  22,  45,   9,  0.364, 'active'),
  ('55555555-5555-5555-5555-555555555555', 'Phnom Penh - Sihanoukville'    , 'Phnom Penh', 'Sihanoukville'  , 'NR4',  27,  45,  30,   0.37, 'active'),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh - Battambang'       , 'Phnom Penh', 'Battambang'     , 'NR5',  31,  45,  15,  0.355, 'active'),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh - Kampong Cham'     , 'Phnom Penh', 'Kampong Cham'   , 'NR7',   9,  45,   7,  0.778, 'active'),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh - Prey Veng'        , 'Phnom Penh', 'Prey Veng'      , 'NR1',  16,  45,  24,  0.406, 'active'),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh - Takeo'            , 'Phnom Penh', 'Takeo'          , 'NR2',  12,  45,  33,    0.5, 'active'),
  ('77777777-7777-7777-7777-777777777777', 'Phnom Penh - Sihanoukville'    , 'Phnom Penh', 'Sihanoukville'  , 'NR4',  26,  45,  11,  0.385, 'active'),
  ('77777777-7777-7777-7777-777777777777', 'Phnom Penh - Svay Rieng'       , 'Phnom Penh', 'Svay Rieng'     , 'NR1',  14,  45,   6,  0.571, 'active'),
  ('77777777-7777-7777-7777-777777777777', 'Phnom Penh - Siem Reap'        , 'Phnom Penh', 'Siem Reap'      , 'NR6',  36,  45,  19,  0.361, 'active'),
  ('77777777-7777-7777-7777-777777777777', 'Phnom Penh - Kratie'           , 'Phnom Penh', 'Kratie'         , 'NR7',  29,  45,  13,  0.379, 'active'),
  ('88888888-8888-8888-8888-888888888888', 'Phnom Penh - Kep'              , 'Phnom Penh', 'Kep'            , 'NR3',  20,  15,   4,   0.45, 'active'),
  ('88888888-8888-8888-8888-888888888888', 'Phnom Penh - Takeo'            , 'Phnom Penh', 'Takeo'          , 'NR2',   8,  15,   5,   0.75, 'active'),
  ('88888888-8888-8888-8888-888888888888', 'Phnom Penh - Kampot'           , 'Phnom Penh', 'Kampot'         , 'NR3',  25,  15,   1,   0.32, 'active'),
  ('88888888-8888-8888-8888-888888888888', 'Phnom Penh - Prey Veng'        , 'Phnom Penh', 'Prey Veng'      , 'NR1',  11,  15,   8,  0.591, 'active'),
  ('99999999-9999-9999-9999-999999999999', 'Phnom Penh - Siem Reap'        , 'Phnom Penh', 'Siem Reap'      , 'NR6',  24,  45,  10,  0.542, 'active'),
  ('99999999-9999-9999-9999-999999999999', 'Phnom Penh - Kratie'           , 'Phnom Penh', 'Kratie'         , 'NR7',  16,  45,   8,  0.688, 'active'),
  ('99999999-9999-9999-9999-999999999999', 'Phnom Penh - Battambang'       , 'Phnom Penh', 'Battambang'     , 'NR5',  38,  45,  27,  0.289, 'active'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Phnom Penh - Prey Veng'        , 'Phnom Penh', 'Prey Veng'      , 'NR1',  11,  45,   9,  0.591, 'active'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Phnom Penh - Svay Rieng'       , 'Phnom Penh', 'Svay Rieng'     , 'NR1',  23,  45,  16,  0.348, 'active'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Phnom Penh - Kampong Cham'     , 'Phnom Penh', 'Kampong Cham'   , 'NR7',  15,  45,  22,  0.467, 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Phnom Penh - Sihanoukville'    , 'Phnom Penh', 'Sihanoukville'  , 'NR4',  19,  15,   3,  0.526, 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Phnom Penh - Kampot'           , 'Phnom Penh', 'Kampot'         , 'NR3',  12,  15,   5,  0.667, 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Phnom Penh - Siem Reap'        , 'Phnom Penh', 'Siem Reap'      , 'NR6',  34,  15,   2,  0.382, 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Phnom Penh - Kep'              , 'Phnom Penh', 'Kep'            , 'NR3',  27,  15,   6,  0.333, 'active');

-- ----------------------------------------------------------------------------
-- Stations (drop-off points for on-road bookings and advance bookings)
-- ----------------------------------------------------------------------------
insert into stations (company_id, name, province, address, lat, lng) values
  ('88888888-8888-8888-8888-888888888888', 'Bayon Kampot'                              , 'Kampot'         , 'NR3 Terminal'          , 10.6104, 104.1810),
  ('88888888-8888-8888-8888-888888888888', 'Bayon Kampot 2'                            , 'Kampot'         , 'Riverside Office'      , 10.6184, 104.1910),
  ('88888888-8888-8888-8888-888888888888', 'Bayon Kep'                                 , 'Kep'            , 'Kep Beach Office'      , 10.4831, 104.3167),
  ('88888888-8888-8888-8888-888888888888', 'Bayon Kep 2'                               , 'Kep'            , 'Crab Market Stop'      , 10.4911, 104.3267),
  ('88888888-8888-8888-8888-888888888888', 'Bayon Prey Veng'                           , 'Prey Veng'      , 'NR1 Terminal'          , 11.4869, 105.3253),
  ('88888888-8888-8888-8888-888888888888', 'Bayon Takeo'                               , 'Takeo'          , 'NR2 Terminal'          , 10.9909, 104.7850),
  ('33333333-3333-3333-3333-333333333333', 'Capitol Tour Kampot'                       , 'Kampot'         , 'NR3 Terminal'          , 10.6104, 104.1810),
  ('33333333-3333-3333-3333-333333333333', 'Capitol Tour Kep'                          , 'Kep'            , 'Kep Beach Office'      , 10.4831, 104.3167),
  ('33333333-3333-3333-3333-333333333333', 'Capitol Tour Sihanoukville'                , 'Sihanoukville'  , 'Ekareach Terminal'     , 10.6277, 103.5230),
  ('55555555-5555-5555-5555-555555555555', 'Giant Ibis Kampot'                         , 'Kampot'         , 'NR3 Terminal'          , 10.6104, 104.1810),
  ('55555555-5555-5555-5555-555555555555', 'Giant Ibis Siem Reap'                      , 'Siem Reap'      , 'Main Terminal, NR6'    , 13.3671, 103.8448),
  ('55555555-5555-5555-5555-555555555555', 'Giant Ibis Siem Reap 2'                    , 'Siem Reap'      , 'Sivatha Branch'        , 13.3751, 103.8548),
  ('55555555-5555-5555-5555-555555555555', 'Giant Ibis Sihanoukville'                  , 'Sihanoukville'  , 'Ekareach Terminal'     , 10.6277, 103.5230),
  ('55555555-5555-5555-5555-555555555555', 'Giant Ibis Sihanoukville 2'                , 'Sihanoukville'  , 'Port Road Branch'      , 10.6357, 103.5330),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'iBus Cambodia Kampot'                      , 'Kampot'         , 'NR3 Terminal'          , 10.6104, 104.1810),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'iBus Cambodia Kep'                         , 'Kep'            , 'Kep Beach Office'      , 10.4831, 104.3167),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'iBus Cambodia Siem Reap'                   , 'Siem Reap'      , 'Main Terminal, NR6'    , 13.3671, 103.8448),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'iBus Cambodia Siem Reap 2'                 , 'Siem Reap'      , 'Sivatha Branch'        , 13.3751, 103.8548),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'iBus Cambodia Sihanoukville'               , 'Sihanoukville'  , 'Ekareach Terminal'     , 10.6277, 103.5230),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'iBus Cambodia Sihanoukville 2'             , 'Sihanoukville'  , 'Port Road Branch'      , 10.6357, 103.5330),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kumho Samco Kampong Cham'                  , 'Kampong Cham'   , 'NR7 Terminal'          , 11.9934, 105.4635),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kumho Samco Prey Veng'                     , 'Prey Veng'      , 'NR1 Terminal'          , 11.4869, 105.3253),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kumho Samco Svay Rieng'                    , 'Svay Rieng'     , 'NR1 Terminal'          , 11.0879, 105.7993),
  ('22222222-2222-2222-2222-222222222222', 'Larryta Battambang'                        , 'Battambang'     , 'NR5 Terminal'          , 13.0957, 103.2022),
  ('22222222-2222-2222-2222-222222222222', 'Larryta Battambang 2'                      , 'Battambang'     , 'Street 3 Office'       , 13.1037, 103.2122),
  ('22222222-2222-2222-2222-222222222222', 'Larryta Kampot'                            , 'Kampot'         , 'NR3 Terminal'          , 10.6104, 104.1810),
  ('22222222-2222-2222-2222-222222222222', 'Larryta Kampot 2'                          , 'Kampot'         , 'Riverside Office'      , 10.6184, 104.1910),
  ('22222222-2222-2222-2222-222222222222', 'Larryta Siem Reap'                         , 'Siem Reap'      , 'Main Terminal, NR6'    , 13.3671, 103.8448),
  ('22222222-2222-2222-2222-222222222222', 'Larryta Siem Reap 2'                       , 'Siem Reap'      , 'Sivatha Branch'        , 13.3751, 103.8548),
  ('44444444-4444-4444-4444-444444444444', 'Mekong Express Kampot'                     , 'Kampot'         , 'NR3 Terminal'          , 10.6104, 104.1810),
  ('44444444-4444-4444-4444-444444444444', 'Mekong Express Kampot 2'                   , 'Kampot'         , 'Riverside Office'      , 10.6184, 104.1910),
  ('44444444-4444-4444-4444-444444444444', 'Mekong Express Siem Reap'                  , 'Siem Reap'      , 'Main Terminal, NR6'    , 13.3671, 103.8448),
  ('44444444-4444-4444-4444-444444444444', 'Mekong Express Sihanoukville'              , 'Sihanoukville'  , 'Ekareach Terminal'     , 10.6277, 103.5230),
  ('44444444-4444-4444-4444-444444444444', 'Mekong Express Sihanoukville 2'            , 'Sihanoukville'  , 'Port Road Branch'      , 10.6357, 103.5330),
  ('77777777-7777-7777-7777-777777777777', 'Rith Mony Kratie'                          , 'Kratie'         , 'NR7 Terminal'          , 12.4881, 106.0189),
  ('77777777-7777-7777-7777-777777777777', 'Rith Mony Siem Reap'                       , 'Siem Reap'      , 'Main Terminal, NR6'    , 13.3671, 103.8448),
  ('77777777-7777-7777-7777-777777777777', 'Rith Mony Sihanoukville'                   , 'Sihanoukville'  , 'Ekareach Terminal'     , 10.6277, 103.5230),
  ('77777777-7777-7777-7777-777777777777', 'Rith Mony Sihanoukville 2'                 , 'Sihanoukville'  , 'Port Road Branch'      , 10.6357, 103.5330),
  ('77777777-7777-7777-7777-777777777777', 'Rith Mony Svay Rieng'                      , 'Svay Rieng'     , 'NR1 Terminal'          , 11.0879, 105.7993),
  ('99999999-9999-9999-9999-999999999999', 'Seila Angkor Battambang'                   , 'Battambang'     , 'NR5 Terminal'          , 13.0957, 103.2022),
  ('99999999-9999-9999-9999-999999999999', 'Seila Angkor Battambang 2'                 , 'Battambang'     , 'Street 3 Office'       , 13.1037, 103.2122),
  ('99999999-9999-9999-9999-999999999999', 'Seila Angkor Kratie'                       , 'Kratie'         , 'NR7 Terminal'          , 12.4881, 106.0189),
  ('99999999-9999-9999-9999-999999999999', 'Seila Angkor Siem Reap'                    , 'Siem Reap'      , 'Main Terminal, NR6'    , 13.3671, 103.8448),
  ('99999999-9999-9999-9999-999999999999', 'Seila Angkor Siem Reap 2'                  , 'Siem Reap'      , 'Sivatha Branch'        , 13.3751, 103.8548),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh Sorya Battambang'               , 'Battambang'     , 'NR5 Terminal'          , 13.0957, 103.2022),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh Sorya Battambang 2'             , 'Battambang'     , 'Street 3 Office'       , 13.1037, 103.2122),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh Sorya Kampong Cham'             , 'Kampong Cham'   , 'NR7 Terminal'          , 11.9934, 105.4635),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh Sorya Kampong Cham 2'           , 'Kampong Cham'   , 'Riverfront Office'     , 12.0014, 105.4735),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh Sorya Prey Veng'                , 'Prey Veng'      , 'NR1 Terminal'          , 11.4869, 105.3253),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh Sorya Takeo'                    , 'Takeo'          , 'NR2 Terminal'          , 10.9909, 104.7850),
  ('11111111-1111-1111-1111-111111111111', 'Vireak Buntham Battambang'                 , 'Battambang'     , 'NR5 Terminal'          , 13.0957, 103.2022),
  ('11111111-1111-1111-1111-111111111111', 'Vireak Buntham Battambang 2'               , 'Battambang'     , 'Street 3 Office'       , 13.1037, 103.2122),
  ('11111111-1111-1111-1111-111111111111', 'Vireak Buntham Siem Reap'                  , 'Siem Reap'      , 'Main Terminal, NR6'    , 13.3671, 103.8448),
  ('11111111-1111-1111-1111-111111111111', 'Vireak Buntham Sihanoukville'              , 'Sihanoukville'  , 'Ekareach Terminal'     , 10.6277, 103.5230),
  ('11111111-1111-1111-1111-111111111111', 'Vireak Buntham Sihanoukville 2'            , 'Sihanoukville'  , 'Port Road Branch'      , 10.6357, 103.5330);

-- ----------------------------------------------------------------------------
-- Schedules (advance booking / Plan Trip — one row per departure time)
-- ----------------------------------------------------------------------------
-- Departure stations in Phnom Penh. Advance booking asks where to board,
-- and every operator runs more than one depot in the capital.
insert into stations (company_id, name, province, address, lat, lng) values
  ('11111111-1111-1111-1111-111111111111', 'Vireak Buntham Central Terminal', 'Phnom Penh', 'St 106, near Central Market, Doun Penh', 11.5695, 104.9160),
  ('11111111-1111-1111-1111-111111111111', 'Vireak Buntham Night Market Office', 'Phnom Penh', 'Sisowath Quay, Doun Penh', 11.5760, 104.9230),
  ('22222222-2222-2222-2222-222222222222', 'Larryta Olympic Stadium Depot', 'Phnom Penh', 'Monireth Blvd, Prampi Makara', 11.5510, 104.9190),
  ('22222222-2222-2222-2222-222222222222', 'Larryta Chbar Ampov Depot', 'Phnom Penh', 'National Road 1, Chbar Ampov', 11.5325, 104.9545),
  ('33333333-3333-3333-3333-333333333333', 'Capitol Tour Chom Chao Depot', 'Phnom Penh', 'National Road 4, Por Sen Chey', 11.5333, 104.8187),
  ('33333333-3333-3333-3333-333333333333', 'Capitol Tour Prek Pnov Depot', 'Phnom Penh', 'National Road 5, Prek Pnov', 11.6240, 104.8720),
  ('44444444-4444-4444-4444-444444444444', 'Mekong Express Central Terminal', 'Phnom Penh', 'St 106, near Central Market, Doun Penh', 11.5695, 104.9190),
  ('44444444-4444-4444-4444-444444444444', 'Mekong Express Night Market Office', 'Phnom Penh', 'Sisowath Quay, Doun Penh', 11.5760, 104.9260),
  ('55555555-5555-5555-5555-555555555555', 'Giant Ibis Olympic Stadium Depot', 'Phnom Penh', 'Monireth Blvd, Prampi Makara', 11.5510, 104.9220),
  ('55555555-5555-5555-5555-555555555555', 'Giant Ibis Chbar Ampov Depot', 'Phnom Penh', 'National Road 1, Chbar Ampov', 11.5325, 104.9575),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh Sorya Chom Chao Depot', 'Phnom Penh', 'National Road 4, Por Sen Chey', 11.5333, 104.8217),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh Sorya Prek Pnov Depot', 'Phnom Penh', 'National Road 5, Prek Pnov', 11.6240, 104.8750),
  ('77777777-7777-7777-7777-777777777777', 'Rith Mony Central Terminal', 'Phnom Penh', 'St 106, near Central Market, Doun Penh', 11.5695, 104.9220),
  ('77777777-7777-7777-7777-777777777777', 'Rith Mony Night Market Office', 'Phnom Penh', 'Sisowath Quay, Doun Penh', 11.5760, 104.9290),
  ('88888888-8888-8888-8888-888888888888', 'Bayon Olympic Stadium Depot', 'Phnom Penh', 'Monireth Blvd, Prampi Makara', 11.5510, 104.9250),
  ('88888888-8888-8888-8888-888888888888', 'Bayon Chbar Ampov Depot', 'Phnom Penh', 'National Road 1, Chbar Ampov', 11.5325, 104.9605),
  ('99999999-9999-9999-9999-999999999999', 'Seila Angkor Chom Chao Depot', 'Phnom Penh', 'National Road 4, Por Sen Chey', 11.5333, 104.8247),
  ('99999999-9999-9999-9999-999999999999', 'Seila Angkor Prek Pnov Depot', 'Phnom Penh', 'National Road 5, Prek Pnov', 11.6240, 104.8780),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kumho Samco Central Terminal', 'Phnom Penh', 'St 106, near Central Market, Doun Penh', 11.5695, 104.9250),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kumho Samco Night Market Office', 'Phnom Penh', 'Sisowath Quay, Doun Penh', 11.5760, 104.9320),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'iBus Cambodia Olympic Stadium Depot', 'Phnom Penh', 'Monireth Blvd, Prampi Makara', 11.5510, 104.9280),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'iBus Cambodia Chbar Ampov Depot', 'Phnom Penh', 'National Road 1, Chbar Ampov', 11.5325, 104.9635);

insert into schedules
  (company_id, origin, destination, departure_time, arrival_time, duration_hours, price_per_seat, seats_total, seats_available, days_available)
values
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh', 'Siem Reap'      , '06:30', '12:30',    6,  12.0,  45,  35, 'daily'),
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh', 'Siem Reap'      , '09:00', '15:00',    6,  12.0,  45,  27, 'daily'),
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh', 'Siem Reap'      , '13:00', '19:00',    6,  12.0,  45,  32, 'daily'),
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh', 'Siem Reap'      , '23:00', '05:00',    6,  15.0,  45,  35, 'daily'),
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh', 'Battambang'     , '07:30', '13:30',    6,  11.0,  45,  41, 'daily'),
  ('11111111-1111-1111-1111-111111111111', 'Phnom Penh', 'Sihanoukville'  , '08:00', '12:00',    4,  10.0,  45,   7, 'daily'),
  ('22222222-2222-2222-2222-222222222222', 'Phnom Penh', 'Siem Reap'      , '07:00', '12:30',  5.5,  14.0,  15,   8, 'daily'),
  ('22222222-2222-2222-2222-222222222222', 'Phnom Penh', 'Siem Reap'      , '14:00', '19:30',  5.5,  14.0,  15,  13, 'daily'),
  ('22222222-2222-2222-2222-222222222222', 'Phnom Penh', 'Battambang'     , '08:30', '14:00',  5.5,  13.0,  15,   9, 'daily'),
  ('22222222-2222-2222-2222-222222222222', 'Phnom Penh', 'Kampot'         , '09:00', '12:00',    3,  10.0,  15,   7, 'daily'),
  ('33333333-3333-3333-3333-333333333333', 'Phnom Penh', 'Kampot'         , '08:00', '11:00',    3,   8.0,  45,  22, 'daily'),
  ('33333333-3333-3333-3333-333333333333', 'Phnom Penh', 'Kampot'         , '14:00', '17:00',    3,   8.0,  45,  30, 'daily'),
  ('33333333-3333-3333-3333-333333333333', 'Phnom Penh', 'Kep'            , '08:30', '12:00',  3.5,   9.0,  45,  31, 'daily'),
  ('33333333-3333-3333-3333-333333333333', 'Phnom Penh', 'Sihanoukville'  , '07:00', '11:15', 4.25,   9.5,  45,  36, 'daily'),
  ('44444444-4444-4444-4444-444444444444', 'Phnom Penh', 'Sihanoukville'  , '07:30', '11:30',    4,  12.0,  15,  14, 'daily'),
  ('44444444-4444-4444-4444-444444444444', 'Phnom Penh', 'Sihanoukville'  , '12:00', '16:00',    4,  12.0,  15,   3, 'daily'),
  ('44444444-4444-4444-4444-444444444444', 'Phnom Penh', 'Kampot'         , '08:00', '11:15', 3.25,  11.0,  15,   9, 'daily'),
  ('44444444-4444-4444-4444-444444444444', 'Phnom Penh', 'Siem Reap'      , '07:45', '13:15',  5.5,  15.0,  15,  10, 'daily'),
  ('55555555-5555-5555-5555-555555555555', 'Phnom Penh', 'Siem Reap'      , '06:30', '12:30',    6,  18.0,  45,  10, 'daily'),
  ('55555555-5555-5555-5555-555555555555', 'Phnom Penh', 'Siem Reap'      , '09:30', '15:30',    6,  18.0,  45,  41, 'daily'),
  ('55555555-5555-5555-5555-555555555555', 'Phnom Penh', 'Kampot'         , '08:00', '11:30',  3.5,  13.0,  45,   6, 'daily'),
  ('55555555-5555-5555-5555-555555555555', 'Phnom Penh', 'Sihanoukville'  , '08:15', '12:30', 4.25,  14.0,  45,  42, 'daily'),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh', 'Battambang'     , '07:15', '13:15',    6,  11.0,  45,  40, 'daily'),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh', 'Battambang'     , '12:30', '18:30',    6,  11.0,  45,  17, 'daily'),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh', 'Kampong Cham'   , '09:30', '12:00',  2.5,   7.0,  45,  18, 'daily'),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh', 'Kampong Cham'   , '15:00', '17:30',  2.5,   7.0,  45,  22, 'daily'),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh', 'Prey Veng'      , '10:00', '12:15', 2.25,   6.5,  45,  26, 'daily'),
  ('66666666-6666-6666-6666-666666666666', 'Phnom Penh', 'Takeo'          , '13:30', '15:30',    2,   6.0,  45,  30, 'daily'),
  ('77777777-7777-7777-7777-777777777777', 'Phnom Penh', 'Sihanoukville'  , '07:00', '11:00',    4,  10.0,  45,  15, 'daily'),
  ('77777777-7777-7777-7777-777777777777', 'Phnom Penh', 'Sihanoukville'  , '13:00', '17:00',    4,  10.0,  45,  33, 'daily'),
  ('77777777-7777-7777-7777-777777777777', 'Phnom Penh', 'Svay Rieng'     , '13:00', '16:00',    3,   8.0,  45,  13, 'daily'),
  ('77777777-7777-7777-7777-777777777777', 'Phnom Penh', 'Siem Reap'      , '08:30', '14:30',    6,  12.5,  45,  37, 'daily'),
  ('77777777-7777-7777-7777-777777777777', 'Phnom Penh', 'Kratie'         , '07:30', '12:45', 5.25,  11.0,  45,  32, 'daily'),
  ('88888888-8888-8888-8888-888888888888', 'Phnom Penh', 'Kep'            , '08:30', '12:00',  3.5,  12.0,  15,   5, 'daily'),
  ('88888888-8888-8888-8888-888888888888', 'Phnom Penh', 'Kep'            , '15:00', '18:30',  3.5,  12.0,  15,   1, 'daily'),
  ('88888888-8888-8888-8888-888888888888', 'Phnom Penh', 'Takeo'          , '14:00', '16:00',    2,   7.0,  15,   3, 'daily'),
  ('88888888-8888-8888-8888-888888888888', 'Phnom Penh', 'Kampot'         , '07:30', '10:45', 3.25,  11.0,  15,   8, 'daily'),
  ('88888888-8888-8888-8888-888888888888', 'Phnom Penh', 'Prey Veng'      , '11:00', '13:15', 2.25,   7.5,  15,   9, 'daily'),
  ('99999999-9999-9999-9999-999999999999', 'Phnom Penh', 'Siem Reap'      , '08:00', '14:00',    6,  14.0,  45,  18, 'daily'),
  ('99999999-9999-9999-9999-999999999999', 'Phnom Penh', 'Siem Reap'      , '22:30', '04:30',    6,  16.0,  45,  30, 'daily'),
  ('99999999-9999-9999-9999-999999999999', 'Phnom Penh', 'Kratie'         , '07:45', '13:00', 5.25,  11.0,  45,  11, 'daily'),
  ('99999999-9999-9999-9999-999999999999', 'Phnom Penh', 'Battambang'     , '09:00', '15:00',    6,  12.0,  45,  38, 'daily'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Phnom Penh', 'Prey Veng'      , '10:00', '12:15', 2.25,   6.5,  45,   5, 'daily'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Phnom Penh', 'Svay Rieng'     , '07:45', '10:45',    3,   8.5,  45,  12, 'daily'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Phnom Penh', 'Kampong Cham'   , '13:15', '15:45',  2.5,   7.5,  45,  40, 'daily'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Phnom Penh', 'Sihanoukville'  , '15:00', '19:00',    4,  11.0,  15,   9, 'daily'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Phnom Penh', 'Sihanoukville'  , '06:45', '10:45',    4,  11.0,  15,   2, 'daily'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Phnom Penh', 'Kampot'         , '09:15', '12:30', 3.25,  10.0,  15,   8, 'daily'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Phnom Penh', 'Siem Reap'      , '08:45', '14:15',  5.5,  15.0,  15,   8, 'daily'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Phnom Penh', 'Kep'            , '13:45', '17:15',  3.5,  11.5,  15,   4, 'daily');

-- Passenger reviews, so a company page has real history rather than the
-- two placeholder entries the UI falls back to.
insert into reviews (company_id, user_id, rating, comment, created_at) values
  ('77777777-7777-7777-7777-777777777777', 'd0000000-0000-4000-8000-000000000014', 4, 'Comfortable enough, though the rest stop was very short.', now() - interval '60 days'),
  ('77777777-7777-7777-7777-777777777777', 'd0000000-0000-4000-8000-000000000013', 4, 'Easy to book and the ticket check at pickup took ten seconds.', now() - interval '22 days'),
  ('44444444-4444-4444-4444-444444444444', 'd0000000-0000-4000-8000-000000000013', 4, 'Seat was exactly the one I picked in the app. No arguing on board.', now() - interval '10 days'),
  ('99999999-9999-9999-9999-999999999999', 'd0000000-0000-4000-8000-000000000009', 2, 'Bus was forty minutes late and nobody told me why.', now() - interval '134 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd0000000-0000-4000-8000-000000000002', 4, 'Comfortable enough, though the rest stop was very short.', now() - interval '137 days'),
  ('55555555-5555-5555-5555-555555555555', 'd0000000-0000-4000-8000-000000000003', 4, 'Left about thirty minutes late but the ride itself was fine.', now() - interval '115 days'),
  ('99999999-9999-9999-9999-999999999999', 'd0000000-0000-4000-8000-000000000006', 3, 'Fine for the price. The road was rough after Skun, not the driver''s fault.', now() - interval '53 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd0000000-0000-4000-8000-000000000013', 2, 'Driver was hard to reach when I could not find the pickup point.', now() - interval '10 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd0000000-0000-4000-8000-000000000016', 4, 'Good driver but the van was quite full and it felt tight.', now() - interval '55 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd0000000-0000-4000-8000-000000000012', 3, 'Fine for the price. The road was rough after Skun, not the driver''s fault.', now() - interval '49 days'),
  ('66666666-6666-6666-6666-666666666666', 'd0000000-0000-4000-8000-000000000007', 5, 'Comfortable seats and the driver drove carefully the whole way.', now() - interval '96 days'),
  ('11111111-1111-1111-1111-111111111111', 'd0000000-0000-4000-8000-000000000002', 5, 'WiFi actually worked most of the way. Good value for the price.', now() - interval '35 days'),
  ('66666666-6666-6666-6666-666666666666', 'd0000000-0000-4000-8000-000000000010', 5, 'Plenty of legroom even at the back. Smooth ride on the highway.', now() - interval '143 days'),
  ('88888888-8888-8888-8888-888888888888', 'd0000000-0000-4000-8000-000000000001', 5, 'Driver spoke enough English to help me find my drop-off. Appreciated.', now() - interval '3 days'),
  ('55555555-5555-5555-5555-555555555555', 'd0000000-0000-4000-8000-000000000005', 4, 'Arrived twenty minutes early. Luggage handled without any fuss.', now() - interval '9 days'),
  ('88888888-8888-8888-8888-888888888888', 'd0000000-0000-4000-8000-000000000004', 5, 'Called me when he was five minutes away, which made it easy to find him.', now() - interval '42 days'),
  ('66666666-6666-6666-6666-666666666666', 'd0000000-0000-4000-8000-000000000011', 4, 'Left about thirty minutes late but the ride itself was fine.', now() - interval '84 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd0000000-0000-4000-8000-000000000015', 4, 'Aircon was a bit cold and I could not adjust the vent above my seat.', now() - interval '94 days'),
  ('88888888-8888-8888-8888-888888888888', 'd0000000-0000-4000-8000-000000000002', 4, 'Aircon was a bit cold and I could not adjust the vent above my seat.', now() - interval '123 days'),
  ('22222222-2222-2222-2222-222222222222', 'd0000000-0000-4000-8000-000000000006', 4, 'Good driver but the van was quite full and it felt tight.', now() - interval '95 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd0000000-0000-4000-8000-000000000014', 5, 'Comfortable seats and the driver drove carefully the whole way.', now() - interval '130 days'),
  ('66666666-6666-6666-6666-666666666666', 'd0000000-0000-4000-8000-000000000008', 5, 'Arrived twenty minutes early. Luggage handled without any fuss.', now() - interval '35 days'),
  ('99999999-9999-9999-9999-999999999999', 'd0000000-0000-4000-8000-000000000010', 4, 'Fine for the price. The road was rough after Skun, not the driver''s fault.', now() - interval '124 days'),
  ('99999999-9999-9999-9999-999999999999', 'd0000000-0000-4000-8000-000000000005', 5, 'Seat was exactly the one I picked in the app. No arguing on board.', now() - interval '19 days'),
  ('99999999-9999-9999-9999-999999999999', 'd0000000-0000-4000-8000-000000000008', 3, 'Fine for the price. The road was rough after Skun, not the driver''s fault.', now() - interval '17 days'),
  ('44444444-4444-4444-4444-444444444444', 'd0000000-0000-4000-8000-000000000014', 5, 'Called me when he was five minutes away, which made it easy to find him.', now() - interval '111 days'),
  ('88888888-8888-8888-8888-888888888888', 'd0000000-0000-4000-8000-000000000003', 2, 'Bus was forty minutes late and nobody told me why.', now() - interval '13 days'),
  ('33333333-3333-3333-3333-333333333333', 'd0000000-0000-4000-8000-000000000009', 5, 'Driver stopped exactly where I dropped the pin. No waiting at all.', now() - interval '148 days'),
  ('55555555-5555-5555-5555-555555555555', 'd0000000-0000-4000-8000-000000000002', 3, 'Good driver but the van was quite full and it felt tight.', now() - interval '9 days'),
  ('66666666-6666-6666-6666-666666666666', 'd0000000-0000-4000-8000-000000000006', 5, 'Easy to book and the ticket check at pickup took ten seconds.', now() - interval '81 days'),
  ('11111111-1111-1111-1111-111111111111', 'd0000000-0000-4000-8000-000000000001', 5, 'Stopped twice for the toilet and food, both times long enough.', now() - interval '75 days'),
  ('11111111-1111-1111-1111-111111111111', 'd0000000-0000-4000-8000-000000000004', 3, 'Aircon was a bit cold and I could not adjust the vent above my seat.', now() - interval '78 days'),
  ('33333333-3333-3333-3333-333333333333', 'd0000000-0000-4000-8000-000000000010', 4, 'Fine for the price. The road was rough after Skun, not the driver''s fault.', now() - interval '103 days'),
  ('66666666-6666-6666-6666-666666666666', 'd0000000-0000-4000-8000-000000000009', 5, 'Best trip I have had on this route. Very professional driver.', now() - interval '21 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd0000000-0000-4000-8000-000000000001', 4, 'Good driver but the van was quite full and it felt tight.', now() - interval '57 days'),
  ('99999999-9999-9999-9999-999999999999', 'd0000000-0000-4000-8000-000000000007', 5, 'Clean van, working aircon, and we left on time. Would book again.', now() - interval '133 days'),
  ('44444444-4444-4444-4444-444444444444', 'd0000000-0000-4000-8000-000000000001', 4, 'Good driver but the van was quite full and it felt tight.', now() - interval '86 days'),
  ('33333333-3333-3333-3333-333333333333', 'd0000000-0000-4000-8000-000000000011', 5, 'Seat was exactly the one I picked in the app. No arguing on board.', now() - interval '4 days'),
  ('33333333-3333-3333-3333-333333333333', 'd0000000-0000-4000-8000-000000000008', 4, 'Easy to book and the ticket check at pickup took ten seconds.', now() - interval '5 days'),
  ('22222222-2222-2222-2222-222222222222', 'd0000000-0000-4000-8000-000000000007', 4, 'Good driver but the van was quite full and it felt tight.', now() - interval '120 days'),
  ('33333333-3333-3333-3333-333333333333', 'd0000000-0000-4000-8000-000000000012', 4, 'Stopped twice for the toilet and food, both times long enough.', now() - interval '131 days'),
  ('11111111-1111-1111-1111-111111111111', 'd0000000-0000-4000-8000-000000000003', 2, 'Seat was not reclining and the aircon dripped a little.', now() - interval '22 days'),
  ('44444444-4444-4444-4444-444444444444', 'd0000000-0000-4000-8000-000000000015', 5, 'Plenty of legroom even at the back. Smooth ride on the highway.', now() - interval '33 days'),
  ('22222222-2222-2222-2222-222222222222', 'd0000000-0000-4000-8000-000000000005', 4, 'Comfortable seats and the driver drove carefully the whole way.', now() - interval '71 days'),
  ('88888888-8888-8888-8888-888888888888', 'd0000000-0000-4000-8000-000000000015', 4, 'Plenty of legroom even at the back. Smooth ride on the highway.', now() - interval '128 days'),
  ('88888888-8888-8888-8888-888888888888', 'd0000000-0000-4000-8000-000000000016', 5, 'Stopped twice for the toilet and food, both times long enough.', now() - interval '95 days'),
  ('77777777-7777-7777-7777-777777777777', 'd0000000-0000-4000-8000-000000000012', 4, 'Clean van, working aircon, and we left on time. Would book again.', now() - interval '83 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd0000000-0000-4000-8000-000000000011', 5, 'Driver spoke enough English to help me find my drop-off. Appreciated.', now() - interval '74 days'),
  ('44444444-4444-4444-4444-444444444444', 'd0000000-0000-4000-8000-000000000016', 2, 'Seat was not reclining and the aircon dripped a little.', now() - interval '5 days'),
  ('55555555-5555-5555-5555-555555555555', 'd0000000-0000-4000-8000-000000000004', 4, 'Fine for the price. The road was rough after Skun, not the driver''s fault.', now() - interval '128 days');

-- bookings and advanced_bookings intentionally start empty — they fill up
-- live as people book through the app.
