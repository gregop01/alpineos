-- Fix BC Parks backcountry facility coordinates and ensure Elfin Lakes exists
-- Migration 012 added Elfin Lakes but with incorrect coordinates (49.95, -122.82).
-- Correct location: Diamond Head area, Elfin Lakes ~49.7856, -122.9886

-- Insert Elfin Lakes if missing (e.g. if 012 was not run)
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Elfin Lakes Shelter', 'bcparks', ST_SetSRID(ST_MakePoint(-122.9886, 49.7856), 4326)::geography, 'hut', 33, 'https://camping.bcparks.ca/', '{"location": "Garibaldi Park, Diamond Head", "requires_booking": true, "camping_type": "reservation"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Elfin Lakes Shelter' AND provider = 'bcparks');

-- Correct coordinates for existing Elfin Lakes (wrong coords from 012 placed it near Garibaldi Lake)
UPDATE locations
SET coordinates = ST_SetSRID(ST_MakePoint(-122.9886, 49.7856), 4326)::geography,
    metadata = COALESCE(metadata, '{}'::jsonb) || '{"location": "Garibaldi Park, Diamond Head", "requires_booking": true, "camping_type": "reservation"}'::jsonb
WHERE name = 'Elfin Lakes Shelter' AND provider = 'bcparks'
  AND ST_Y(coordinates::geometry) > 49.9;  -- Only fix if currently at wrong (northern) position
