-- Run this entire file in Supabase Dashboard > SQL Editor > New query
-- Enable PostGIS first via Dashboard > Database > Extensions if not already enabled

CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop existing objects if re-running (optional - comment out if first run)
-- DROP VIEW IF EXISTS locations_with_coords;
-- DROP TABLE IF EXISTS availability;
-- DROP TABLE IF EXISTS locations;
-- DROP TABLE IF EXISTS booking_rules;

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('bcparks','parks_canada','acc','ridb','rstbc','bcmc','voc','commercial','other')),
  coordinates geography(Point, 4326) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hut','campsite','rec_site','day_use_pass','lodge')),
  capacity_total INT,
  booking_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_locations_provider ON locations(provider);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);

CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available','booked','locked','unknown','opening_soon')),
  spots_remaining INT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(location_id, date)
);

CREATE INDEX IF NOT EXISTS idx_availability_location_date ON availability(location_id, date);
CREATE INDEX IF NOT EXISTS idx_availability_date ON availability(date);

CREATE TABLE IF NOT EXISTS booking_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  rolling_window_days INT,
  opening_time_pt TIME,
  opening_time_mt TIME,
  seasonal_launch_date DATE,
  rules_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO booking_rules (provider, rolling_window_days, opening_time_pt, seasonal_launch_date, rules_metadata) VALUES
  ('bcparks', 90, '07:00'::TIME, NULL, '{}'),
  ('parks_canada', NULL, '08:00'::TIME, NULL, '{"note": "varies per park"}'),
  ('acc', 90, NULL, NULL, '{"member_days": 180, "non_member_days": 90, "opening_time_mt": "00:00"}'),
  ('bcmc', 60, NULL, NULL, '{"watersprite_days": 60, "mountain_lake_days": 180}'),
  ('recreation_gov', 270, NULL, '2026-02-17'::DATE, '{}'),
  ('olympic_np', 180, NULL, NULL, '{}')
ON CONFLICT (provider) DO NOTHING;

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata) VALUES
  ('Garibaldi Lake', 'bcparks', ST_SetSRID(ST_MakePoint(-122.75, 50.95), 4326)::geography, 'campsite', 50, 'https://camping.bcparks.ca/', '{}'),
  ('Joffre Lakes', 'bcparks', ST_SetSRID(ST_MakePoint(-122.48, 50.35), 4326)::geography, 'campsite', 26, 'https://camping.bcparks.ca/', '{}'),
  ('Berg Lake Trail', 'bcparks', ST_SetSRID(ST_MakePoint(-119.15, 53.13), 4326)::geography, 'campsite', 72, 'https://camping.bcparks.ca/', '{}'),
  ('Mt. Assiniboine', 'bcparks', ST_SetSRID(ST_MakePoint(-115.82, 50.87), 4326)::geography, 'campsite', 24, 'https://camping.bcparks.ca/', '{}'),
  ('Cathedral Lakes', 'bcparks', ST_SetSRID(ST_MakePoint(-120.20, 49.08), 4326)::geography, 'campsite', 40, 'https://camping.bcparks.ca/', '{}'),
  ('Manning Park', 'bcparks', ST_SetSRID(ST_MakePoint(-120.79, 49.12), 4326)::geography, 'campsite', 100, 'https://camping.bcparks.ca/', '{}'),
  ('Bowron Lakes', 'bcparks', ST_SetSRID(ST_MakePoint(-121.08, 53.13), 4326)::geography, 'campsite', 50, 'https://camping.bcparks.ca/', '{}'),
  ('Cultus Lake', 'bcparks', ST_SetSRID(ST_MakePoint(-121.97, 49.04), 4326)::geography, 'campsite', 300, 'https://camping.bcparks.ca/', '{}'),
  ('Alice Lake', 'bcparks', ST_SetSRID(ST_MakePoint(-123.13, 49.78), 4326)::geography, 'campsite', 100, 'https://camping.bcparks.ca/', '{}'),
  ('Joffre Lakes Day Use', 'bcparks', ST_SetSRID(ST_MakePoint(-122.48, 50.35), 4326)::geography, 'day_use_pass', 0, 'https://reserve.bcparks.ca/dayuse/', '{}'),
  ('Golden Ears Day Use', 'bcparks', ST_SetSRID(ST_MakePoint(-122.47, 49.27), 4326)::geography, 'day_use_pass', 0, 'https://reserve.bcparks.ca/dayuse/', '{}'),
  ('West Coast Trail', 'parks_canada', ST_SetSRID(ST_MakePoint(-125.15, 48.88), 4326)::geography, 'campsite', 75, 'https://reservation.pc.gc.ca/', '{}'),
  ('Gulf Islands Backcountry', 'parks_canada', ST_SetSRID(ST_MakePoint(-123.40, 48.78), 4326)::geography, 'campsite', 30, 'https://reservation.pc.gc.ca/', '{}'),
  ('Lake O''Hara', 'parks_canada', ST_SetSRID(ST_MakePoint(-116.33, 51.35), 4326)::geography, 'campsite', 42, 'https://reservation.pc.gc.ca/', '{}'),
  ('Elizabeth Parker Hut', 'acc', ST_SetSRID(ST_MakePoint(-116.33, 51.35), 4326)::geography, 'hut', 24, 'https://www.alpineclubofcanada.ca/web/ACCMember/Clubs/Huts/Lake_OHara_E_Parker.aspx', '{}'),
  ('Fairy Meadow Hut', 'acc', ST_SetSRID(ST_MakePoint(-117.65, 51.05), 4326)::geography, 'hut', 12, 'https://www.alpineclubofcanada.ca/web/ACCMember/Clubs/Huts/Fairy_Meadow_Hut.aspx', '{}'),
  ('Stanley Mitchell Hut', 'acc', ST_SetSRID(ST_MakePoint(-116.58, 51.30), 4326)::geography, 'hut', 22, 'https://www.alpineclubofcanada.ca/web/ACCMember/Clubs/Huts/Stanley_Mitchell_Hut.aspx', '{}'),
  ('Watersprite Lake', 'bcmc', ST_SetSRID(ST_MakePoint(-122.92, 49.83), 4326)::geography, 'hut', 16, 'https://www.bcmc.ca/watersprite-lake-hut', '{}'),
  ('Mountain Lake Hut', 'bcmc', ST_SetSRID(ST_MakePoint(-121.85, 49.35), 4326)::geography, 'hut', 12, 'https://www.bcmc.ca/mountain-lake-hut', '{}'),
  ('Phelix Creek (Brian Waddington)', 'voc', ST_SetSRID(ST_MakePoint(-122.75, 50.88), 4326)::geography, 'hut', 24, 'https://www.ubc-voc.com/wiki/Brian_Waddington_Hut', '{"fcfs": true}'),
  ('Brew Hut', 'voc', ST_SetSRID(ST_MakePoint(-122.55, 50.25), 4326)::geography, 'hut', 16, 'https://www.ubc-voc.com/wiki/Brew_Hut', '{"fcfs": true}');

CREATE OR REPLACE VIEW locations_with_coords AS
SELECT
  id, name, provider, type, capacity_total, booking_url, metadata,
  ST_X(coordinates::geometry)::double precision AS lon,
  ST_Y(coordinates::geometry)::double precision AS lat
FROM locations;

GRANT SELECT ON locations_with_coords TO anon;

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "locations_public_read" ON locations;
DROP POLICY IF EXISTS "availability_public_read" ON availability;
DROP POLICY IF EXISTS "booking_rules_public_read" ON booking_rules;

CREATE POLICY "locations_public_read" ON locations FOR SELECT USING (true);
CREATE POLICY "availability_public_read" ON availability FOR SELECT USING (true);
CREATE POLICY "booking_rules_public_read" ON booking_rules FOR SELECT USING (true);
