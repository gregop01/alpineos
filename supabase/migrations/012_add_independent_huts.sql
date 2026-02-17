-- Add independently run huts: Spearhead Huts Society, Columbia Valley Hut Society,
-- Pemberton Wildlife Association, Tetrahedron Outdoor Club, BCMC North Creek,
-- Keith Flavelle Hut Society, VOC Sphinx/Harrison, BC Parks Elfin/Wedgemount
-- These are club/society operated huts not covered by the main ACC/BCMC/VOC seed

ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_provider_check;
ALTER TABLE locations ADD CONSTRAINT locations_provider_check CHECK (
  provider IN (
    'bcparks', 'parks_canada', 'acc', 'ridb', 'rstbc', 'bcmc', 'voc',
    'wa_state_parks', 'bc_coastal', 'spearhead_huts', 'cvhs', 'pwa', 'tetrahedron',
    'commercial', 'other'
  )
);

-- Booking rules
INSERT INTO booking_rules (provider, rolling_window_days, opening_time_pt, seasonal_launch_date, rules_metadata) VALUES
  ('spearhead_huts', 60, NULL, NULL, '{"member_days": 90, "note": "ACC/BCMC members get 90-day window"}'),
  ('cvhs', 56, NULL, NULL, '{"note": "8 weeks rolling, custom booking extends to 10 weeks"}'),
  ('pwa', 60, '17:00'::TIME, NULL, '{"note": "Opens 5pm 60 days before arrival"}')
ON CONFLICT (provider) DO NOTHING;

-- Spearhead Huts Society: Kees & Claire Hut at Russet Lake (Garibaldi Park, Whistler)
-- First of three huts planned for Spearhead Traverse; 38 beds, heated, year-round
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Kees and Claire Hut', 'spearhead_huts', ST_SetSRID(ST_MakePoint(-122.916, 50.108), 4326)::geography, 'hut', 38, 'https://spearheadhuts.org/reservations', '{"aka": "Russet Lake Hut", "location": "Spearhead Range, Garibaldi Park", "year_round": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Kees and Claire Hut' AND provider = 'spearhead_huts');

-- Columbia Valley Hut Society (Purcell Mountains, near Golden/Invermere/Radium)
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Jumbo Pass Cabin', 'cvhs', ST_SetSRID(ST_MakePoint(-116.6242, 50.3603), 4326)::geography, 'hut', 8, 'https://cvhsinfo.org/columbia-valley-huts-book-online/', '{"location": "Purcell Divide, Jumbo Pass"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Jumbo Pass Cabin' AND provider = 'cvhs');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Kingsbury Hut', 'cvhs', ST_SetSRID(ST_MakePoint(-117.14, 50.996), 4326)::geography, 'hut', 8, 'https://cvhsinfo.org/columbia-valley-huts-book-online/', '{"location": "Purcell Mountains"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Kingsbury Hut' AND provider = 'cvhs');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'McMurdo Cabin', 'cvhs', ST_SetSRID(ST_MakePoint(-117.149, 51.0522), 4326)::geography, 'hut', 5, 'https://cvhsinfo.org/columbia-valley-huts-book-online/', '{"location": "McMurdo Creek, Purcells", "jumping_off": "International Basin"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'McMurdo Cabin' AND provider = 'cvhs');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'David White Hut', 'cvhs', ST_SetSRID(ST_MakePoint(-116.5444, 50.6642), 4326)::geography, 'hut', 8, 'https://cvhsinfo.org/columbia-valley-huts-book-online/', '{"location": "Purcell Range near Radium"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'David White Hut' AND provider = 'cvhs');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Olive Hut', 'cvhs', ST_SetSRID(ST_MakePoint(-116.60, 50.70), 4326)::geography, 'hut', 8, 'https://cvhsinfo.org/columbia-valley-huts-book-online/', '{"location": "Catamount Glacier, Purcells", "elevation_approx_m": 2743}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Olive Hut' AND provider = 'cvhs');

-- BCMC: North Creek Cabin (Lillooet River valley, Pemberton)
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'North Creek Cabin', 'bcmc', ST_SetSRID(ST_MakePoint(-122.72, 50.38), 4326)::geography, 'hut', 10, 'https://recsites.bcmc.ca/index.php/reservations/north-creek', '{"location": "Upper Lillooet, North Creek", "member_booking_days": 180}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'North Creek Cabin' AND provider = 'bcmc');

-- Pemberton Wildlife Association: Tenquille Lake Cabin (Tenquille-Owl Lakes Recreation Area)
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Tenquille Lake Cabin', 'pwa', ST_SetSRID(ST_MakePoint(-122.554, 50.447), 4326)::geography, 'hut', 12, 'https://recsites.pembertonwildlifeassociation.com/index.php/reservations/tenquille-lake-camping-site', '{"aka": "Tenquille Hut", "location": "Tenquille-Owl Lakes Rec Area, Pemberton", "elevation_m": 1656, "territory": "Líl̓wat Nation, N''Quatqua"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Tenquille Lake Cabin' AND provider = 'pwa');

-- Keith Flavelle Hut Society: Keith's Hut at Cerise Creek (Nlháxten/Cerise Creek, Duffey Lake Rd)
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Keith Flavelle Hut', 'other', ST_SetSRID(ST_MakePoint(-122.4126, 50.3813), 4326)::geography, 'hut', 14, 'https://www.keithshut.ca/', '{"aka": "Keith''s Hut", "location": "Cerise Creek, Duffey Lake Rd", "fcfs": true, "donation_suggested": true, "elevation_m": 1650}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Keith Flavelle Hut' AND provider = 'other');

-- Tetrahedron Outdoor Club: 4 cabins in Tetrahedron Provincial Park (Sunshine Coast)
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Batchelor Cabin', 'tetrahedron', ST_SetSRID(ST_MakePoint(-123.65441, 49.59264), 4326)::geography, 'hut', 12, 'https://www.tetoutdoor.ca/cabin-payments.html', '{"location": "Tetrahedron Provincial Park", "fcfs": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Batchelor Cabin' AND provider = 'tetrahedron');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Edwards Cabin', 'tetrahedron', ST_SetSRID(ST_MakePoint(-123.62364, 49.59450), 4326)::geography, 'hut', 12, 'https://www.tetoutdoor.ca/cabin-payments.html', '{"location": "Tetrahedron Provincial Park", "fcfs": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Edwards Cabin' AND provider = 'tetrahedron');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Mount Steele Cabin', 'tetrahedron', ST_SetSRID(ST_MakePoint(-123.60884, 49.60907), 4326)::geography, 'hut', 12, 'https://www.tetoutdoor.ca/cabin-payments.html', '{"location": "Tetrahedron Provincial Park, Mt Steele", "fcfs": true, "elevation_m": 1500}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Mount Steele Cabin' AND provider = 'tetrahedron');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'McNair Cabin', 'tetrahedron', ST_SetSRID(ST_MakePoint(-123.58892, 49.57777), 4326)::geography, 'hut', 12, 'https://www.tetoutdoor.ca/cabin-payments.html', '{"location": "Tetrahedron Provincial Park", "fcfs": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'McNair Cabin' AND provider = 'tetrahedron');

-- VOC: Sphinx (Burton) Hut and Harrison Hut (FCFS)
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Sphinx Hut', 'voc', ST_SetSRID(ST_MakePoint(-122.78, 50.02), 4326)::geography, 'hut', 10, 'https://huts.ubc-voc.com/Sphinx/', '{"aka": "Burton Hut", "location": "Garibaldi Lake east shore", "fcfs": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Sphinx Hut' AND provider = 'voc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Harrison Hut', 'voc', ST_SetSRID(ST_MakePoint(-122.52, 50.40), 4326)::geography, 'hut', 15, 'https://huts.ubc-voc.com/Harrison/', '{"location": "Pemberton Icefield, Meager Creek", "fcfs": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Harrison Hut' AND provider = 'voc');

-- BC Parks: Elfin Lakes Shelter and Wedgemount Lake Hut (Garibaldi Park)
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Elfin Lakes Shelter', 'bcparks', ST_SetSRID(ST_MakePoint(-122.82, 49.95), 4326)::geography, 'hut', 33, 'https://camping.bcparks.ca/', '{"location": "Garibaldi Park, Diamond Head", "requires_booking": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Elfin Lakes Shelter' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Wedgemount Lake Hut', 'bcparks', ST_SetSRID(ST_MakePoint(-122.82, 50.18), 4326)::geography, 'hut', 6, 'https://camping.bcparks.ca/', '{"location": "Garibaldi Park, Wedgemount", "requires_booking": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Wedgemount Lake Hut' AND provider = 'bcparks');

-- Metadata for booking badge display
UPDATE locations
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"requires_booking": true, "camping_type": "reservation"}'::jsonb
WHERE provider IN ('spearhead_huts', 'cvhs', 'pwa');

UPDATE locations
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"requires_booking": false, "camping_type": "first_come_first_serve"}'::jsonb
WHERE provider = 'tetrahedron' OR (name = 'Keith Flavelle Hut' AND provider = 'other');
