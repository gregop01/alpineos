-- Sunshine Coast Trail huts (qPAWS) - 16 huts along 180km trail from Sarah Point to Saltery Bay
-- All FCFS, free (donations encouraged $5/person/night). Inland Lake huts have BC Parks fee.

ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_provider_check;
ALTER TABLE locations ADD CONSTRAINT locations_provider_check CHECK (
  provider IN (
    'bcparks', 'parks_canada', 'acc', 'ridb', 'rstbc', 'bcmc', 'voc',
    'wa_state_parks', 'bc_coastal', 'spearhead_huts', 'cvhs', 'pwa', 'tetrahedron', 'sct',
    'commercial', 'other'
  )
);

-- North to south along trail (km 0 Sarah Point -> km 180 Saltery Bay)
-- Coordinates from SCT Guidebook / site descriptions where available; others approximated by trail km
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Fairview Bay Hut', 'sct', ST_SetSRID(ST_MakePoint(-124.06, 49.78), 4326)::geography, 'hut', 10, 'https://sunshinecoasttrail.com/', '{"trail_km": 180, "location": "Saltery Bay area", "fcfs": true, "donation_suggested": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Fairview Bay Hut' AND provider = 'sct');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Rainy Day Lake Hut', 'sct', ST_SetSRID(ST_MakePoint(-124.10, 49.82), 4326)::geography, 'hut', 10, 'https://sunshinecoasttrail.com/', '{"trail_km": 165, "location": "Hailstone Bluff", "fcfs": true, "donation_suggested": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Rainy Day Lake Hut' AND provider = 'sct');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Troubridge Emergency Shelter', 'sct', ST_SetSRID(ST_MakePoint(-124.25, 49.85), 4326)::geography, 'hut', 6, 'https://sunshinecoasttrail.com/', '{"trail_km": 150, "location": "Mt Troubridge summit", "fcfs": true, "emergency_shelter": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Troubridge Emergency Shelter' AND provider = 'sct');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Troubridge Hut', 'sct', ST_SetSRID(ST_MakePoint(-124.26, 49.86), 4326)::geography, 'hut', 10, 'https://sunshinecoasttrail.com/', '{"trail_km": 145, "location": "Jocelyn Pond, Mt Troubridge", "fcfs": true, "donation_suggested": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Troubridge Hut' AND provider = 'sct');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Golden Stanley Hut', 'sct', ST_SetSRID(ST_MakePoint(-124.30, 49.88), 4326)::geography, 'hut', 10, 'https://sunshinecoasttrail.com/', '{"trail_km": 135, "fcfs": true, "donation_suggested": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Golden Stanley Hut' AND provider = 'sct');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Walt Hill Hut', 'sct', ST_SetSRID(ST_MakePoint(-124.32, 49.90), 4326)::geography, 'hut', 10, 'https://sunshinecoasttrail.com/', '{"trail_km": 125, "location": "Horseshoe Valley", "fcfs": true, "donation_suggested": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Walt Hill Hut' AND provider = 'sct');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Elk Lake Hut', 'sct', ST_SetSRID(ST_MakePoint(-124.35, 49.92), 4326)::geography, 'hut', 10, 'https://sunshinecoasttrail.com/', '{"trail_km": 115, "fcfs": true, "donation_suggested": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Elk Lake Hut' AND provider = 'sct');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Tin Hat Hut', 'sct', ST_SetSRID(ST_MakePoint(-124.38, 49.96), 4326)::geography, 'hut', 10, 'https://sunshinecoasttrail.com/', '{"trail_km": 90, "location": "Tin Hat Mountain summit", "fcfs": true, "donation_suggested": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Tin Hat Hut' AND provider = 'sct');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Fiddlehead Landing Hut', 'sct', ST_SetSRID(ST_MakePoint(-124.42, 49.93), 4326)::geography, 'hut', 10, 'https://sunshinecoasttrail.com/', '{"trail_km": 75, "fcfs": true, "donation_suggested": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Fiddlehead Landing Hut' AND provider = 'sct');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Confederation Lake Hut', 'sct', ST_SetSRID(ST_MakePoint(-124.46, 49.92), 4326)::geography, 'hut', 10, 'https://sunshinecoasttrail.com/', '{"trail_km": 65, "fcfs": true, "donation_suggested": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Confederation Lake Hut' AND provider = 'sct');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Inland Lake-Anthony Island Hut', 'sct', ST_SetSRID(ST_MakePoint(-124.494, 49.942), 4326)::geography, 'hut', 10, 'https://sunshinecoasttrail.com/', '{"trail_km": 50, "location": "Inland Lake Provincial Park", "bc_parks_fee": true, "fcfs": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Inland Lake-Anthony Island Hut' AND provider = 'sct');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Inland Lake-West Hut', 'sct', ST_SetSRID(ST_MakePoint(-124.500, 49.938), 4326)::geography, 'hut', 10, 'https://sunshinecoasttrail.com/', '{"trail_km": 48, "location": "Inland Lake Provincial Park", "bc_parks_fee": true, "fcfs": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Inland Lake-West Hut' AND provider = 'sct');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Sarah Point Hut', 'sct', ST_SetSRID(ST_MakePoint(-124.74, 50.02), 4326)::geography, 'hut', 10, 'https://sunshinecoasttrail.com/', '{"trail_km": 12, "location": "Manzanita Bluffs", "fcfs": true, "donation_suggested": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Sarah Point Hut' AND provider = 'sct');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Bliss Portage Hut', 'sct', ST_SetSRID(ST_MakePoint(-124.76, 50.10), 4326)::geography, 'hut', 10, 'https://sunshinecoasttrail.com/', '{"trail_km": 8.2, "location": "Okeover Inlet", "fcfs": true, "donation_suggested": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Bliss Portage Hut' AND provider = 'sct');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Rieveley Pond Hut', 'sct', ST_SetSRID(ST_MakePoint(-124.72, 50.01), 4326)::geography, 'hut', 10, 'https://sunshinecoasttrail.com/', '{"trail_km": 18, "fcfs": true, "donation_suggested": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Rieveley Pond Hut' AND provider = 'sct');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Manzanita Hut', 'sct', ST_SetSRID(ST_MakePoint(-124.7397, 50.00245), 4326)::geography, 'hut', 10, 'https://sunshinecoasttrail.com/', '{"trail_km": 16, "location": "Manzanita Bluffs, Gwendoline Hills", "fcfs": true, "donation_suggested": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Manzanita Hut' AND provider = 'sct');

-- Metadata for FCFS display
UPDATE locations
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"requires_booking": false, "camping_type": "first_come_first_serve"}'::jsonb
WHERE provider = 'sct';
