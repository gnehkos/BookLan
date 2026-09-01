-- ============================================================================
-- BookLan — profile photo storage
-- Run once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Safe to re-run.
--
-- The app has no Supabase Auth session (phone login is handled in the app
-- layer), so every request arrives on the shared anon key. These policies are
-- permissive to match the rest of the demo schema — tighten before launch.
-- ============================================================================

-- Public bucket so profile photos can be served by URL, capped at 5MB.
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

-- Drop first so the whole script stays re-runnable.
drop policy if exists "avatars public read" on storage.objects;
drop policy if exists "avatars anon upload" on storage.objects;
drop policy if exists "avatars anon update" on storage.objects;

create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars anon upload" on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "avatars anon update" on storage.objects
  for update using (bucket_id = 'avatars') with check (bucket_id = 'avatars');
