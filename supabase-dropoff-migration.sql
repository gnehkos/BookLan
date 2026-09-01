-- ============================================================================
-- Drop-off stations for advance bookings
-- ============================================================================
--
-- Run this in the Supabase SQL editor to add the drop-off step to an existing
-- database WITHOUT wiping it. It is the subset of supabase-schema.sql that the
-- drop-off feature needs, written so it is safe to run more than once.
--
-- If you would rather start clean, run supabase-schema.sql instead — it already
-- contains everything below. Do not run both.
-- ============================================================================

-- 1. Remember which station the passenger chose.
alter table advanced_bookings
  add column if not exists dropoff_station_id uuid references stations (id) on delete set null;

-- 2. Give every scheduled route at least one station to arrive at.
--    Without this the drop-off step shows "No stations listed" for any operator
--    that has none in the destination province, which is a dead end.
insert into stations (company_id, name, province, address, lat, lng)
select v.company_id, v.name, v.province, v.address, v.lat, v.lng
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Vireak Buntham Siem Reap Main',    'Siem Reap',     'NR6, Chreav, Siem Reap',       13.3671, 103.8448),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Vireak Buntham Sivatha Branch',    'Siem Reap',     'Sivatha Blvd, Siem Reap',      13.3625, 103.8560),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Larryta Siem Reap Station',        'Siem Reap',     'Charles de Gaulle, Siem Reap', 13.3700, 103.8500),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Capitol Tour Kampot Station',      'Kampot',        'NR3, Kampot',                  10.6100, 104.1800),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Capitol Tour Riverside Branch',    'Kampot',        'Riverside Rd, Kampot',         10.6180, 104.1750),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'Mekong Express Sihanoukville',     'Sihanoukville', 'Ekareach St, Sihanoukville',   10.6277, 103.5230),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'Mekong Express Port Branch',       'Sihanoukville', 'Port Rd, Sihanoukville',       10.6100, 103.5300),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'Giant Ibis Siem Reap',             'Siem Reap',     'Sivatha Blvd, Siem Reap',      13.3596, 103.8556),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'Giant Ibis Kampot',                'Kampot',        'Old Market, Kampot',           10.6060, 104.1830),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'Sorya Battambang Terminal',        'Battambang',    'NR5, Battambang',              13.0957, 103.2022),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'Sorya Battambang Central',         'Battambang',    'Street 3, Battambang',         13.1020, 103.1980),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'Sorya Kampong Cham Terminal',      'Kampong Cham',  'NR7, Kampong Cham',            11.9934, 105.4635),
  ('77777777-7777-7777-7777-777777777777'::uuid, 'Rith Mony Sihanoukville',          'Sihanoukville', 'NR4, Sihanoukville',           10.6350, 103.5150),
  ('77777777-7777-7777-7777-777777777777'::uuid, 'Rith Mony Svay Rieng',             'Svay Rieng',    'NR1, Svay Rieng',              11.0879, 105.7993),
  ('88888888-8888-8888-8888-888888888888'::uuid, 'Bayon Kep Station',                'Kep',           'Kep Beach Rd, Kep',            10.4831, 104.3167),
  ('88888888-8888-8888-8888-888888888888'::uuid, 'Bayon Takeo Station',              'Takeo',         'NR2, Takeo',                   10.9909, 104.7850),
  ('99999999-9999-9999-9999-999999999999'::uuid, 'Seila Angkor Siem Reap',           'Siem Reap',     'NR6, Siem Reap',               13.3550, 103.8600),
  ('99999999-9999-9999-9999-999999999999'::uuid, 'Seila Angkor Kratie',              'Kratie',        'NR7, Kratie',                  12.4881, 106.0189),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Kumho Samco Prey Veng',            'Prey Veng',     'NR1, Prey Veng',               11.4869, 105.3253),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'iBus Sihanoukville Station',       'Sihanoukville', 'Ekareach St, Sihanoukville',   10.6200, 103.5260)
) as v (company_id, name, province, address, lat, lng)
-- Skip any station already present, so re-running this changes nothing.
where not exists (
  select 1 from stations s where s.company_id = v.company_id and s.name = v.name
)
-- And skip operators this database does not have.
and exists (select 1 from companies c where c.id = v.company_id);

-- Check what you ended up with:
--   select c.name as company, s.province, count(*) as branches
--   from stations s join companies c on c.id = s.company_id
--   group by 1, 2 order by 1, 2;
