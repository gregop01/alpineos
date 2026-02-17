-- Add backcountry campsites along popular BC and Canadian Rockies hiking trails
-- Covers Berg Lake, West Coast Trail, Rockwall, Mount Assiniboine, Manning Park, Juan de Fuca

-- ========== BERG LAKE TRAIL (Mount Robson Provincial Park) - BC Parks ==========
-- 7 campgrounds along the iconic 23km trail. Book at camping.bcparks.ca

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Kinney Lake', 'bcparks', ST_SetSRID(ST_MakePoint(-119.18, 53.12), 4326)::geography, 'campsite', 8, 'https://camping.bcparks.ca/', '{"trail": "Berg Lake Trail", "trail_km": 7}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Kinney Lake' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Whitehorn', 'bcparks', ST_SetSRID(ST_MakePoint(-119.17, 53.13), 4326)::geography, 'campsite', 14, 'https://camping.bcparks.ca/', '{"trail": "Berg Lake Trail", "trail_km": 11}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Whitehorn' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Emperor Falls', 'bcparks', ST_SetSRID(ST_MakePoint(-119.16, 53.14), 4326)::geography, 'campsite', 4, 'https://camping.bcparks.ca/', '{"trail": "Berg Lake Trail", "trail_km": 16}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Emperor Falls' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Marmot', 'bcparks', ST_SetSRID(ST_MakePoint(-119.15, 53.14), 4326)::geography, 'campsite', 8, 'https://camping.bcparks.ca/', '{"trail": "Berg Lake Trail", "trail_km": 19}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Marmot' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Berg Lake Campground', 'bcparks', ST_SetSRID(ST_MakePoint(-119.14, 53.14), 4326)::geography, 'campsite', 26, 'https://camping.bcparks.ca/', '{"trail": "Berg Lake Trail", "trail_km": 21}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Berg Lake Campground' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Rearguard', 'bcparks', ST_SetSRID(ST_MakePoint(-119.13, 53.15), 4326)::geography, 'campsite', 8, 'https://camping.bcparks.ca/', '{"trail": "Berg Lake Trail", "trail_km": 22}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Rearguard' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Robson Pass', 'bcparks', ST_SetSRID(ST_MakePoint(-119.12, 53.16), 4326)::geography, 'campsite', 8, 'https://camping.bcparks.ca/', '{"trail": "Berg Lake Trail", "trail_km": 23}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Robson Pass' AND provider = 'bcparks');

-- ========== MOUNT ASSINIBOINE PROVINCIAL PARK - BC Parks ==========

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Magog Lake Campground', 'bcparks', ST_SetSRID(ST_MakePoint(-115.82, 50.87), 4326)::geography, 'campsite', 40, 'https://camping.bcparks.ca/', '{"trail": "Mount Assiniboine", "location": "Core area, near Assiniboine Lodge"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Magog Lake Campground' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Og Lake Campground', 'bcparks', ST_SetSRID(ST_MakePoint(-115.82, 50.90), 4326)::geography, 'campsite', 10, 'https://camping.bcparks.ca/', '{"trail": "Mount Assiniboine", "trail_km": 5}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Og Lake Campground' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Porcupine Campground', 'bcparks', ST_SetSRID(ST_MakePoint(-115.88, 50.92), 4326)::geography, 'campsite', 10, 'https://camping.bcparks.ca/', '{"trail": "Mount Assiniboine", "trail_km": 14}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Porcupine Campground' AND provider = 'bcparks');

-- ========== E.C. MANNING PARK - BC Parks ==========
-- Frosty, Buckhorn, Kicking Horse - backcountry along Frosty Mountain / Heather Trail

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Frosty Creek', 'bcparks', ST_SetSRID(ST_MakePoint(-120.85, 49.12), 4326)::geography, 'campsite', 10, 'https://camping.bcparks.ca/', '{"trail": "Heather Trail", "location": "Manning Park"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Frosty Creek' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Buckhorn Campground', 'bcparks', ST_SetSRID(ST_MakePoint(-120.80, 49.15), 4326)::geography, 'campsite', 12, 'https://camping.bcparks.ca/', '{"trail": "Heather Trail", "location": "Manning Park"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Buckhorn Campground' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Kicking Horse Campground', 'bcparks', ST_SetSRID(ST_MakePoint(-120.75, 49.18), 4326)::geography, 'campsite', 12, 'https://camping.bcparks.ca/', '{"trail": "Heather Trail", "location": "Manning Park"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Kicking Horse Campground' AND provider = 'bcparks');

-- ========== JUAN DE FUCA MARINE TRAIL - BC Parks ==========
-- 47km trail, 6 campsites. FCFS with backcountry pass.

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Mystic Beach', 'bcparks', ST_SetSRID(ST_MakePoint(-124.15, 48.45), 4326)::geography, 'campsite', 12, 'https://camping.bcparks.ca/', '{"trail": "Juan de Fuca Marine Trail", "trail_km": 2}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Mystic Beach' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Bear Beach', 'bcparks', ST_SetSRID(ST_MakePoint(-124.22, 48.48), 4326)::geography, 'campsite', 14, 'https://camping.bcparks.ca/', '{"trail": "Juan de Fuca Marine Trail", "trail_km": 9}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Bear Beach' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Chin Beach', 'bcparks', ST_SetSRID(ST_MakePoint(-124.32, 48.50), 4326)::geography, 'campsite', 12, 'https://camping.bcparks.ca/', '{"trail": "Juan de Fuca Marine Trail", "trail_km": 21}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Chin Beach' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Sombrio Beach', 'bcparks', ST_SetSRID(ST_MakePoint(-124.45, 48.52), 4326)::geography, 'campsite', 14, 'https://camping.bcparks.ca/', '{"trail": "Juan de Fuca Marine Trail", "trail_km": 29}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Sombrio Beach' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Little Kuitshe Creek', 'bcparks', ST_SetSRID(ST_MakePoint(-124.50, 48.54), 4326)::geography, 'campsite', 10, 'https://camping.bcparks.ca/', '{"trail": "Juan de Fuca Marine Trail", "trail_km": 35}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Little Kuitshe Creek' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Payzant Creek', 'bcparks', ST_SetSRID(ST_MakePoint(-124.55, 48.56), 4326)::geography, 'campsite', 10, 'https://camping.bcparks.ca/', '{"trail": "Juan de Fuca Marine Trail", "trail_km": 42}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Payzant Creek' AND provider = 'bcparks');

-- ========== WEST COAST TRAIL - Parks Canada ==========
-- Pacific Rim National Park Reserve. Book at parks.canada.ca

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Michigan Creek', 'parks_canada', ST_SetSRID(ST_MakePoint(-124.88, 48.65), 4326)::geography, 'campsite', 20, 'https://parks.canada.ca/pn-np/bc/pacificrim/activ/sco-wct', '{"trail": "West Coast Trail", "trail_km": 12}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Michigan Creek' AND provider = 'parks_canada');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Thrasher Cove', 'parks_canada', ST_SetSRID(ST_MakePoint(-125.20, 48.60), 4326)::geography, 'campsite', 12, 'https://parks.canada.ca/pn-np/bc/pacificrim/activ/sco-wct', '{"trail": "West Coast Trail", "trail_km": 6}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Thrasher Cove' AND provider = 'parks_canada');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Tsusiat Falls', 'parks_canada', ST_SetSRID(ST_MakePoint(-125.05, 48.78), 4326)::geography, 'campsite', 30, 'https://parks.canada.ca/pn-np/bc/pacificrim/activ/sco-wct', '{"trail": "West Coast Trail", "trail_km": 25}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Tsusiat Falls' AND provider = 'parks_canada');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Nitinaht Narrows', 'parks_canada', ST_SetSRID(ST_MakePoint(-124.95, 48.85), 4326)::geography, 'campsite', 16, 'https://parks.canada.ca/pn-np/bc/pacificrim/activ/sco-wct', '{"trail": "West Coast Trail", "trail_km": 45}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Nitinaht Narrows' AND provider = 'parks_canada');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Camper Creek', 'parks_canada', ST_SetSRID(ST_MakePoint(-125.00, 48.72), 4326)::geography, 'campsite', 16, 'https://parks.canada.ca/pn-np/bc/pacificrim/activ/sco-wct', '{"trail": "West Coast Trail", "trail_km": 34}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Camper Creek' AND provider = 'parks_canada');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Walbran Creek', 'parks_canada', ST_SetSRID(ST_MakePoint(-125.02, 48.80), 4326)::geography, 'campsite', 16, 'https://parks.canada.ca/pn-np/bc/pacificrim/activ/sco-wct', '{"trail": "West Coast Trail", "trail_km": 41}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Walbran Creek' AND provider = 'parks_canada');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Cullite Creek', 'parks_canada', ST_SetSRID(ST_MakePoint(-124.98, 48.88), 4326)::geography, 'campsite', 12, 'https://parks.canada.ca/pn-np/bc/pacificrim/activ/sco-wct', '{"trail": "West Coast Trail", "trail_km": 55}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Cullite Creek' AND provider = 'parks_canada');

-- ========== ROCKWALL TRAIL - Parks Canada (Kootenay NP) ==========
-- 54km trail, Floe Lake to Paint Pots. Floe Lake already in 027 - add trail metadata
UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"trail": "Rockwall Trail", "trail_km": 10}'::jsonb
WHERE name = 'Floe Lake' AND provider = 'parks_canada';

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Helmet Falls', 'parks_canada', ST_SetSRID(ST_MakePoint(-116.25, 50.90), 4326)::geography, 'campsite', 12, 'https://parks.canada.ca/pn-np/bc/kootenay/activ/camping', '{"trail": "Rockwall Trail", "trail_km": 24}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Helmet Falls' AND provider = 'parks_canada');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Tumbling Creek', 'parks_canada', ST_SetSRID(ST_MakePoint(-116.20, 50.85), 4326)::geography, 'campsite', 10, 'https://parks.canada.ca/pn-np/bc/kootenay/activ/camping', '{"trail": "Rockwall Trail", "trail_km": 18}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Tumbling Creek' AND provider = 'parks_canada');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Numa Creek', 'parks_canada', ST_SetSRID(ST_MakePoint(-116.15, 50.82), 4326)::geography, 'campsite', 12, 'https://parks.canada.ca/pn-np/bc/kootenay/activ/camping', '{"trail": "Rockwall Trail", "trail_km": 14}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Numa Creek' AND provider = 'parks_canada');

-- ========== GARIBALDI PARK - additional sites ==========
-- Cheakamus Lake has 3 campgrounds along the lake

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Cheakamus Lake', 'bcparks', ST_SetSRID(ST_MakePoint(-123.02, 49.97), 4326)::geography, 'campsite', 8, 'https://camping.bcparks.ca/', '{"trail": "Cheakamus Lake", "location": "Garibaldi Park"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Cheakamus Lake' AND provider = 'bcparks');

-- ========== CATHEDRAL PROVINCIAL PARK - BC Parks ==========
-- Add individual lake campgrounds if not present

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Quiniscoe Lake', 'bcparks', ST_SetSRID(ST_MakePoint(-120.20, 49.08), 4326)::geography, 'campsite', 20, 'https://camping.bcparks.ca/', '{"trail": "Cathedral Lakes", "location": "Core area"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Quiniscoe Lake' AND provider = 'bcparks');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Lake of the Woods', 'bcparks', ST_SetSRID(ST_MakePoint(-120.18, 49.06), 4326)::geography, 'campsite', 12, 'https://camping.bcparks.ca/', '{"trail": "Cathedral Lakes", "location": "Cathedral Park"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Lake of the Woods' AND provider = 'bcparks');

-- ========== SKYLINE TRAIL (Jasper) - Parks Canada ==========
-- 44km alpine ridge hike, Maligne Lake to Signal. 6 campgrounds.

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Evelyn Creek', 'parks_canada', ST_SetSRID(ST_MakePoint(-117.58, 52.72), 4326)::geography, 'campsite', 8, 'https://parks.canada.ca/pn-np/ab/jasper/activ/passez-stay/arrierepays-backcountry', '{"trail": "Skyline Trail", "trail_km": 4.8}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Evelyn Creek' AND provider = 'parks_canada');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Little Shovel', 'parks_canada', ST_SetSRID(ST_MakePoint(-117.62, 52.75), 4326)::geography, 'campsite', 8, 'https://parks.canada.ca/pn-np/ab/jasper/activ/passez-stay/arrierepays-backcountry', '{"trail": "Skyline Trail", "trail_km": 8.3}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Little Shovel' AND provider = 'parks_canada');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Snowbowl', 'parks_canada', ST_SetSRID(ST_MakePoint(-117.68, 52.78), 4326)::geography, 'campsite', 10, 'https://parks.canada.ca/pn-np/ab/jasper/activ/passez-stay/arrierepays-backcountry', '{"trail": "Skyline Trail", "trail_km": 12.2}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Snowbowl' AND provider = 'parks_canada');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Curator', 'parks_canada', ST_SetSRID(ST_MakePoint(-117.65, 52.82), 4326)::geography, 'campsite', 10, 'https://parks.canada.ca/pn-np/ab/jasper/activ/passez-stay/arrierepays-backcountry', '{"trail": "Skyline Trail", "trail_km": 20.3}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Curator' AND provider = 'parks_canada');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Tekarra', 'parks_canada', ST_SetSRID(ST_MakePoint(-117.60, 52.85), 4326)::geography, 'campsite', 10, 'https://parks.canada.ca/pn-np/ab/jasper/activ/passez-stay/arrierepays-backcountry', '{"trail": "Skyline Trail", "trail_km": 30.4}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Tekarra' AND provider = 'parks_canada');

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata)
SELECT 'Signal', 'parks_canada', ST_SetSRID(ST_MakePoint(-117.55, 52.88), 4326)::geography, 'campsite', 10, 'https://parks.canada.ca/pn-np/ab/jasper/activ/passez-stay/arrierepays-backcountry', '{"trail": "Skyline Trail", "trail_km": 35.7}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Signal' AND provider = 'parks_canada');
