-- Fix BC Parks Garibaldi Park data:
-- 1. Add missing Helm Creek campground (9 tent platforms, reservation required)
-- 2. Update Garibaldi Lake to show reservation-based (not FCFS)

-- Add Helm Creek campground (Garibaldi Park, Cheakamus Lake area)
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Helm Creek', 'bcparks', ST_SetSRID(ST_MakePoint(-122.87, 49.98), 4326)::geography, 'campsite', 9, 'https://camping.bcparks.ca/', '{"location": "Garibaldi Park, Cheakamus Lake area", "requires_booking": true, "camping_type": "reservation"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Helm Creek' AND provider = 'bcparks');

-- Fix Garibaldi Lake: requires reservation, not FCFS
UPDATE locations
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"requires_booking": true, "camping_type": "reservation", "location": "Garibaldi Park, Rubble Creek trailhead"}'::jsonb
WHERE name = 'Garibaldi Lake' AND provider = 'bcparks';
