-- Add Prior Centennial Campground (Gulf Islands National Park Reserve).
-- 17 drive-in sites on North Pender Island. Not in Parks Canada Facilities GeoJSON.
-- https://parks.canada.ca/pn-np/bc/gulf/activ/camping

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT
  'Prior Centennial Campground',
  'parks_canada',
  ST_SetSRID(ST_MakePoint(-123.28, 48.78), 4326)::geography,
  'campsite',
  17,
  'https://reservation.pc.gc.ca/',
  '{"requires_booking": true, "camping_type": "reservation", "location": "North Pender Island, Gulf Islands National Park Reserve", "season": "May 15 - Sep 30"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name ILIKE '%Prior Centennial%' AND provider = 'parks_canada');
