-- ============================================================================
-- BookLan — outstanding setup
--
-- RUN THIS ONCE: Supabase dashboard > SQL Editor > New query > paste > Run.
-- Safe to re-run.
--
-- Until this runs, three things are broken in the app:
--   * profile photos fail to upload  (no storage bucket)
--   * post-trip reviews fail to save (no reviews table)
--   * finished trips keep blocking new pickup bookings (no 'completed' status)
--
-- This file supersedes supabase-storage.sql and supabase-reviews.sql — it
-- contains both, so running this one is enough.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Profile photo storage
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 2. Let a booking be marked completed
--
-- `status` allowed only 'confirmed' / 'cancelled', so a finished trip stayed
-- 'confirmed' forever — which is why the app kept saying you already had a bus
-- on the way after you had already arrived.
-- ----------------------------------------------------------------------------
alter table bookings drop constraint if exists bookings_status_check;
alter table bookings
  add constraint bookings_status_check
  check (status in ('confirmed', 'completed', 'cancelled'));

alter table advanced_bookings drop constraint if exists advanced_bookings_status_check;
alter table advanced_bookings
  add constraint advanced_bookings_status_check
  check (status in ('confirmed', 'completed', 'cancelled'));

-- Close out any trip that already reached its destination before this ran,
-- so old bookings stop blocking new ones.
update bookings
   set status = 'completed'
 where status = 'confirmed'
   and distance_remaining_km = 0;

-- ----------------------------------------------------------------------------
-- 3. Company reviews, written after a trip finishes
-- ----------------------------------------------------------------------------
create table if not exists reviews (
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

alter table reviews enable row level security;

drop policy if exists "anon full access" on reviews;
create policy "anon full access" on reviews for all using (true) with check (true);
