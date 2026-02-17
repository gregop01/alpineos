-- Seed real BC/Rockies locations with coordinates and booking URLs
-- Coordinates: ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata) VALUES
  -- BC Parks Backcountry
  ('Garibaldi Lake', 'bcparks', ST_SetSRID(ST_MakePoint(-122.75, 50.95), 4326)::geography, 'campsite', 50, 'https://camping.bcparks.ca/', '{}'),
  ('Joffre Lakes', 'bcparks', ST_SetSRID(ST_MakePoint(-122.48, 50.35), 4326)::geography, 'campsite', 26, 'https://camping.bcparks.ca/', '{}'),
  ('Berg Lake Trail', 'bcparks', ST_SetSRID(ST_MakePoint(-119.15, 53.13), 4326)::geography, 'campsite', 72, 'https://camping.bcparks.ca/', '{"park": "Mt. Robson Provincial Park"}'),
  ('Mt. Assiniboine', 'bcparks', ST_SetSRID(ST_MakePoint(-115.82, 50.87), 4326)::geography, 'campsite', 24, 'https://camping.bcparks.ca/', '{}'),
  ('Cathedral Lakes', 'bcparks', ST_SetSRID(ST_MakePoint(-120.20, 49.08), 4326)::geography, 'campsite', 40, 'https://camping.bcparks.ca/', '{}'),
  ('Manning Park', 'bcparks', ST_SetSRID(ST_MakePoint(-120.79, 49.12), 4326)::geography, 'campsite', 100, 'https://camping.bcparks.ca/', '{}'),
  ('Bowron Lakes', 'bcparks', ST_SetSRID(ST_MakePoint(-121.08, 53.13), 4326)::geography, 'campsite', 50, 'https://camping.bcparks.ca/', '{}'),
  -- BC Parks Frontcountry
  ('Cultus Lake', 'bcparks', ST_SetSRID(ST_MakePoint(-121.97, 49.04), 4326)::geography, 'campsite', 300, 'https://camping.bcparks.ca/', '{}'),
  ('Alice Lake', 'bcparks', ST_SetSRID(ST_MakePoint(-123.13, 49.78), 4326)::geography, 'campsite', 100, 'https://camping.bcparks.ca/', '{}'),
  -- Day-use passes
  ('Joffre Lakes Day Use', 'bcparks', ST_SetSRID(ST_MakePoint(-122.48, 50.35), 4326)::geography, 'day_use_pass', 0, 'https://reserve.bcparks.ca/dayuse/', '{}'),
  ('Golden Ears Day Use', 'bcparks', ST_SetSRID(ST_MakePoint(-122.47, 49.27), 4326)::geography, 'day_use_pass', 0, 'https://reserve.bcparks.ca/dayuse/', '{}'),
  -- Parks Canada
  ('West Coast Trail', 'parks_canada', ST_SetSRID(ST_MakePoint(-125.15, 48.88), 4326)::geography, 'campsite', 75, 'https://reservation.pc.gc.ca/', '{}'),
  ('Gulf Islands Backcountry', 'parks_canada', ST_SetSRID(ST_MakePoint(-123.40, 48.78), 4326)::geography, 'campsite', 30, 'https://reservation.pc.gc.ca/', '{}'),
  ('Lake O''Hara', 'parks_canada', ST_SetSRID(ST_MakePoint(-116.33, 51.35), 4326)::geography, 'campsite', 42, 'https://reservation.pc.gc.ca/', '{}'),
  -- ACC Huts
  ('Elizabeth Parker Hut', 'acc', ST_SetSRID(ST_MakePoint(-116.33, 51.35), 4326)::geography, 'hut', 24, 'https://www.alpineclubofcanada.ca/web/ACCMember/Clubs/Huts/Lake_OHara_E_Parker.aspx', '{}'),
  ('Fairy Meadow Hut', 'acc', ST_SetSRID(ST_MakePoint(-117.65, 51.05), 4326)::geography, 'hut', 12, 'https://www.alpineclubofcanada.ca/web/ACCMember/Clubs/Huts/Fairy_Meadow_Hut.aspx', '{}'),
  ('Stanley Mitchell Hut', 'acc', ST_SetSRID(ST_MakePoint(-116.58, 51.30), 4326)::geography, 'hut', 22, 'https://www.alpineclubofcanada.ca/web/ACCMember/Clubs/Huts/Stanley_Mitchell_Hut.aspx', '{}'),
  -- BCMC
  ('Watersprite Lake', 'bcmc', ST_SetSRID(ST_MakePoint(-122.92, 49.83), 4326)::geography, 'hut', 16, 'https://www.bcmc.ca/watersprite-lake-hut', '{}'),
  ('Mountain Lake Hut', 'bcmc', ST_SetSRID(ST_MakePoint(-121.85, 49.35), 4326)::geography, 'hut', 12, 'https://www.bcmc.ca/mountain-lake-hut', '{}'),
  -- VOC (FCFS, deep link for info)
  ('Phelix Creek (Brian Waddington)', 'voc', ST_SetSRID(ST_MakePoint(-122.75, 50.88), 4326)::geography, 'hut', 24, 'https://www.ubc-voc.com/wiki/Brian_Waddington_Hut', '{"fcfs": true}'),
  ('Brew Hut', 'voc', ST_SetSRID(ST_MakePoint(-122.55, 50.25), 4326)::geography, 'hut', 16, 'https://www.ubc-voc.com/wiki/Brew_Hut', '{"fcfs": true}');
