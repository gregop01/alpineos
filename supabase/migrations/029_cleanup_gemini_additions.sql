-- Cleanup Gemini 027 additions per manual review
-- Removes wrong entries, fixes coordinates for keepers

-- ========== DELETE: Wrong providers / duplicates ==========
-- Sphinx and Burton are VOC huts (Sphinx Bay, Garibaldi Lake), not PWA/BCMC/ACC
DELETE FROM locations WHERE name = 'Sphinx Hut' AND provider IN ('pwa', 'acc') AND (metadata->>'coord_added_by') = 'gemini';
DELETE FROM locations WHERE name = 'Burton Hut' AND provider IN ('pwa', 'bcmc', 'acc') AND (metadata->>'coord_added_by') = 'gemini';

-- Harrison is VOC (Pemberton Icefield), not BCMC
DELETE FROM locations WHERE name = 'Harrison Hut' AND provider = 'bcmc' AND (metadata->>'coord_added_by') = 'gemini';

-- Elfin Lakes: remove generic "Elfin Lakes" and "Elfin Lakes Hut" (we want Shelter + Campground only)
DELETE FROM locations WHERE provider = 'bcparks' AND LOWER(name) IN ('elfin lakes', 'elfin lakes hut') AND (metadata->>'coord_added_by') = 'gemini';

-- Remove duplicate Singing Pass / Russet Lake / Helm Creek variants (keep one per site)
-- BC Parks has one backcountry site per name - remove "Campground" suffix duplicates if we have the shorter name
DELETE FROM locations WHERE name = 'Russet Lake Campground' AND provider = 'bcparks' AND (metadata->>'coord_added_by') = 'gemini';
DELETE FROM locations WHERE name = 'Helm Creek Campground' AND provider = 'bcparks' AND (metadata->>'coord_added_by') = 'gemini';
DELETE FROM locations WHERE name = 'Singing Pass Campground' AND provider = 'bcparks' AND (metadata->>'coord_added_by') = 'gemini';

-- ========== FIX COORDINATES ==========
-- Russet Lake (bcparks): ~50.06, -122.92 near Kees and Claire Hut at Russet Lake
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-122.92, 50.06), 4326)::geography,
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"coord_corrected_029": true}'::jsonb
WHERE name = 'Russet Lake' AND provider = 'bcparks';

-- Helm Creek (bcparks): meadow below Black Tusk, Helm Creek drainage
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-123.02, 49.94), 4326)::geography,
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"coord_corrected_029": true}'::jsonb
WHERE name = 'Helm Creek' AND provider = 'bcparks';

-- Singing Pass (bcparks): between Whistler and Russet Lake
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-122.95, 50.05), 4326)::geography,
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"coord_corrected_029": true}'::jsonb
WHERE (name = 'Singing Pass' OR name = 'Singing Pass Campground') AND provider = 'bcparks';

-- Elfin Lakes Shelter + Campground: both at Diamond Head shelter location (migration 014 canonical)
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-122.9886, 49.7856), 4326)::geography,
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"location": "Garibaldi Park, Diamond Head", "requires_booking": true}'::jsonb
WHERE name = 'Elfin Lakes Shelter' AND provider = 'bcparks';

-- Elfin Lakes Campground: same location as shelter (tent pads adjacent)
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Elfin Lakes Campground', 'bcparks', ST_SetSRID(ST_MakePoint(-122.9886, 49.7856), 4326)::geography, 'campsite', NULL, 'https://camping.bcparks.ca/', '{"location": "Garibaldi Park, Diamond Head", "requires_booking": true, "coord_corrected_029": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE LOWER(name) = 'elfin lakes campground' AND provider = 'bcparks');

UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-122.9886, 49.7856), 4326)::geography,
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"coord_corrected_029": true}'::jsonb
WHERE name = 'Elfin Lakes Campground' AND provider = 'bcparks';

-- Cayoosh Hut (bcmc): Cayoosh Range, Duffey Lake Rd — Peakvisor/BCMC sources
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-122.48, 50.41), 4326)::geography,
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"coord_corrected_029": true}'::jsonb
WHERE name = 'Cayoosh Hut' AND provider = 'bcmc';

-- Beekers Hut (voc): Steep Creek, Lillooet Range — Peakvisor 50.3799, -122.2954
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-122.2954, 50.3799), 4326)::geography,
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"coord_corrected_029": true}'::jsonb
WHERE name = 'Beekers Hut' AND provider = 'voc';

-- Keith Flavelle Hut (other): User said location wrong. 012 had 50.3813, -122.4126.
-- Run manual UPDATE with correct coords when known:
-- UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
--   WHERE name = 'Keith Flavelle Hut' AND provider = 'other';

-- Saddle Mountain Hut: User said location wrong. Cayoosh Range area placeholder — verify and update.
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-122.65, 50.45), 4326)::geography,
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"coord_corrected_029": "verify_saddle_mtn"}'::jsonb
WHERE name = 'Saddle Mountain Hut' AND (provider = 'voc' OR provider = 'acc');
