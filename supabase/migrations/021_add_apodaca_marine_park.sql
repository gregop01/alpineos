-- Add Apodaca Marine Provincial Park (Bowen Island).
-- 4 FCFS tent pads, water-access only. Not in GoingToCamp (no reservations).
-- https://bcparks.ca/apodaca-park/

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT
  'Apodaca Marine Park',
  'bcparks',
  ST_SetSRID(ST_MakePoint(-123.354, 49.365), 4326)::geography,
  'campsite',
  4,
  'https://bcparks.ca/apodaca-park/',
  '{"requires_booking": false, "camping_type": "first_come_first_serve", "access": "water_only", "location": "Bowen Island, east shoreline"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name ILIKE '%Apodaca%' AND provider = 'bcparks');
