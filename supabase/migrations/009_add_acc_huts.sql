-- Add all ACC (Alpine Club of Canada) huts if not present
-- National, BC Parks, and Section huts. Not included in import_bc_wa.sql

-- National ACC Huts (managed by ACC National Office)
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Robson Pass Hut', 'acc', ST_SetSRID(ST_MakePoint(-119.18, 53.14), 4326)::geography, 'hut', 12, 'https://alpineclubofcanada.ca/huts', '{"aka": "Byron Caldwell Hut", "faction": "national"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Robson Pass Hut' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Elizabeth Parker Hut', 'acc', ST_SetSRID(ST_MakePoint(-116.3433, 51.355), 4326)::geography, 'hut', 24, 'https://alpineclubofcanada.ca/hut/elizabeth-parker-hut/', '{"aka": "Lake O''Hara Hut", "faction": "national"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Elizabeth Parker Hut' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Stanley Mitchell Hut', 'acc', ST_SetSRID(ST_MakePoint(-116.5633, 51.5267), 4326)::geography, 'hut', 22, 'https://alpineclubofcanada.ca/hut/stanley-mitchell-hut/', '{"aka": "Little Yoho Valley Hut", "faction": "national"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Stanley Mitchell Hut' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Neil Colgan Hut', 'acc', ST_SetSRID(ST_MakePoint(-116.18, 51.32), 4326)::geography, 'hut', 18, 'https://alpineclubofcanada.ca/hut/neil-colgan-hut/', '{"aka": "Valley of the Ten Peaks Hut", "faction": "national"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Neil Colgan Hut' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Castle Mountain Cabin', 'acc', ST_SetSRID(ST_MakePoint(-116.07, 51.29), 4326)::geography, 'hut', 8, 'https://alpineclubofcanada.ca/hut/castle-mountain-hut/', '{"aka": "Currie Cabin", "faction": "national"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Castle Mountain Cabin' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Cameron Lake Cabin', 'acc', ST_SetSRID(ST_MakePoint(-113.88, 49.02), 4326)::geography, 'hut', 8, 'https://alpineclubofcanada.ca/hut/cameron-lake-cabin/', '{"faction": "national"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Cameron Lake Cabin' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Peyto Hut', 'acc', ST_SetSRID(ST_MakePoint(-116.52, 51.67), 4326)::geography, 'hut', 18, 'https://alpineclubofcanada.ca/hut/peter-and-catharine-whyte-peyto-hut/', '{"aka": "Peter & Catharine Whyte Hut", "faction": "national"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Peyto Hut' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Bow Hut', 'acc', ST_SetSRID(ST_MakePoint(-116.49, 51.635), 4326)::geography, 'hut', 30, 'https://alpineclubofcanada.ca/hut/bow-hut/', '{"faction": "national"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Bow Hut' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Balfour Hut', 'acc', ST_SetSRID(ST_MakePoint(-116.55, 51.66), 4326)::geography, 'hut', 18, 'https://alpineclubofcanada.ca/hut/rob-ritchie-balfour-hut/', '{"aka": "Rob Ritchie Hut", "faction": "national"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Balfour Hut' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Asulkan Cabin', 'acc', ST_SetSRID(ST_MakePoint(-117.50, 51.24), 4326)::geography, 'hut', 12, 'https://alpineclubofcanada.ca/hut/asulkan-cabin/', '{"faction": "national"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Asulkan Cabin' AND provider = 'acc');

-- Rogers Pass / Glacier NP (National)
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'A.O. Wheeler Hut', 'acc', ST_SetSRID(ST_MakePoint(-117.49, 51.263), 4326)::geography, 'hut', 30, 'https://alpineclubofcanada.ca/hut/a-o-wheeler-hut/', '{"aka": "Illecillewaet Hut", "faction": "national"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'A.O. Wheeler Hut' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Fairy Meadow Hut', 'acc', ST_SetSRID(ST_MakePoint(-117.8767, 51.7633), 4326)::geography, 'hut', 12, 'https://alpineclubofcanada.ca/hut/bill-putnam-fairy-meadow-hut/', '{"aka": "Bill Putnam Hut", "faction": "national"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Fairy Meadow Hut' AND provider = 'acc');

-- BC Provincial Parks huts (different booking rules)
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Kokanee Glacier Cabin', 'acc', ST_SetSRID(ST_MakePoint(-117.13, 49.83), 4326)::geography, 'hut', 20, 'https://alpineclubofcanada.ca/hut/kokanee-glacier-cabin/', '{"faction": "bc_parks"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Kokanee Glacier Cabin' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Elk Lakes Cabin', 'acc', ST_SetSRID(ST_MakePoint(-115.08, 50.56), 4326)::geography, 'hut', 14, 'https://alpineclubofcanada.ca/hut/elk-lakes-cabin/', '{"faction": "bc_parks"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Elk Lakes Cabin' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Conrad Kain Hut', 'acc', ST_SetSRID(ST_MakePoint(-116.82, 50.75), 4326)::geography, 'hut', 35, 'https://alpineclubofcanada.ca/hut/conrad-kain-hut/', '{"aka": "Bugaboo Hut", "faction": "bc_parks"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Conrad Kain Hut' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Silver Spray Cabin', 'acc', ST_SetSRID(ST_MakePoint(-117.25, 49.90), 4326)::geography, 'hut', 10, 'https://alpineclubofcanada.ca/hut/silver-spray-cabin/', '{"faction": "bc_parks"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Silver Spray Cabin' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Woodbury Cabin', 'acc', ST_SetSRID(ST_MakePoint(-117.20, 49.90), 4326)::geography, 'hut', 8, 'https://alpineclubofcanada.ca/hut/woodbury-cabin/', '{"faction": "bc_parks"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Woodbury Cabin' AND provider = 'acc');

-- ACC Section Huts (regional club operations)
INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Tantalus Hut', 'acc', ST_SetSRID(ST_MakePoint(-123.28, 49.97), 4326)::geography, 'hut', 16, 'https://accvancouver.ca/tantalus-hut/', '{"section": "vancouver", "faction": "section", "location": "Lake Lovely Water, Coast Mountains"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Tantalus Hut' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Jim Haberl Hut', 'acc', ST_SetSRID(ST_MakePoint(-123.3097, 49.7992), 4326)::geography, 'hut', 12, 'https://accvancouver.ca/jim-haberl-hut/', '{"section": "vancouver", "faction": "section", "location": "Serratus-Dione Col, Tantalus Range"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Jim Haberl Hut' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Hišimy̓awiƛ Hut', 'acc', ST_SetSRID(ST_MakePoint(-125.2875, 49.1891), 4326)::geography, 'hut', 12, 'https://accvi.ca/5040-peak-hut/', '{"section": "vancouver_island", "faction": "section", "location": "5040 Peak area"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Hišimy̓awiƛ Hut' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Wendy Thompson Hut', 'acc', ST_SetSRID(ST_MakePoint(-122.4746, 50.4299), 4326)::geography, 'hut', 16, 'https://accwhistler.ca/WendyThompson.html', '{"section": "whistler", "faction": "section", "location": "Marriott Basin"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Wendy Thompson Hut' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Keene Farm Hut', 'acc', ST_SetSRID(ST_MakePoint(-73.79, 44.18), 4326)::geography, 'hut', 32, 'https://alpineclubmontreal.ca/hut-and-camping/', '{"section": "montreal", "faction": "section", "location": "Adirondack Forest Preserve, NY"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Keene Farm Hut' AND provider = 'acc');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Wally Joyce Hut', 'acc', ST_SetSRID(ST_MakePoint(-77.21, 44.90), 4326)::geography, 'hut', 20, 'https://alpineclubtoronto.ca/bonecho/', '{"aka": "Bon Echo Hut", "section": "toronto", "faction": "section", "location": "Mazinaw Lake, Bon Echo Prov Park"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Wally Joyce Hut' AND provider = 'acc');
