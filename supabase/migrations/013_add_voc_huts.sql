-- Add missing VOC (UBC Varsity Outdoor Club) huts
-- Currently only Phelix Creek (Brian Waddington) and Brew Hut are seeded.
-- VOC maintains 4 huts; adding Roland Burton (Sphinx Bay) and Julian Harrison.

-- Roland Burton Hut (aka Sphinx Hut) - Sphinx Bay, east side of Garibaldi Lake
-- Coordinates from VOC Wiki / GeoHack: 49.92942, -122.99321
-- Sleeps 10-15, FCFS, winter access preferred (lake frozen)
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Roland Burton Hut', 'voc', ST_SetSRID(ST_MakePoint(-122.99321, 49.92942), 4326)::geography, 'hut', 15, 'https://www.ubc-voc.com/wiki/Burton_Hut', '{"aka": "Sphinx Hut", "fcfs": true, "location": "Sphinx Bay, Garibaldi Lake", "winter_access_preferred": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Roland Burton Hut' AND provider = 'voc');

-- Julian Harrison Hut (aka Harrison Hut) - Pemberton Icefield
-- Coordinates from VOC Wiki: 50.52061, -123.43187
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Julian Harrison Hut', 'voc', ST_SetSRID(ST_MakePoint(-123.43187, 50.52061), 4326)::geography, 'hut', 15, 'https://www.ubc-voc.com/wiki/Harrison_Hut', '{"aka": "Harrison Hut", "fcfs": true, "location": "Pemberton Icefield"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Julian Harrison Hut' AND provider = 'voc');
