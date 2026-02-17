-- Correct location coordinates (verified via GeoHack, Wikipedia, official sources)
-- Run this for existing deployments to fix map pin positions

UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-122.968, 49.942), 4326)::geography WHERE name = 'Garibaldi Lake' AND provider = 'bcparks';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-122.4762, 50.3413), 4326)::geography WHERE name = 'Joffre Lakes' AND provider = 'bcparks';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-119.1578, 53.1456), 4326)::geography WHERE name = 'Berg Lake Trail' AND provider = 'bcparks';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-115.65, 50.87), 4326)::geography WHERE name = 'Mt. Assiniboine' AND provider = 'bcparks';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-120.1417, 49.0752), 4326)::geography WHERE name = 'Cathedral Lakes' AND provider = 'bcparks';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-120.8441, 49.0602), 4326)::geography WHERE name = 'Manning Park' AND provider = 'bcparks';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-121.0667, 53.1333), 4326)::geography WHERE name = 'Bowron Lakes' AND provider = 'bcparks';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-122.0092, 49.0319), 4326)::geography WHERE name = 'Cultus Lake' AND provider = 'bcparks';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-123.1175, 49.7822), 4326)::geography WHERE name = 'Alice Lake' AND provider = 'bcparks';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-122.4762, 50.3413), 4326)::geography WHERE name = 'Joffre Lakes Day Use' AND provider = 'bcparks';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-122.45, 49.4667), 4326)::geography WHERE name = 'Golden Ears Day Use' AND provider = 'bcparks';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-124.8376, 48.6645), 4326)::geography WHERE name = 'West Coast Trail' AND provider = 'parks_canada';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-116.3249, 51.3535), 4326)::geography WHERE name = 'Lake O''Hara' AND provider = 'parks_canada';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-116.3433, 51.355), 4326)::geography WHERE name = 'Elizabeth Parker Hut' AND provider = 'acc';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-117.8767, 51.7633), 4326)::geography WHERE name = 'Fairy Meadow Hut' AND provider = 'acc';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-116.5633, 51.5267), 4326)::geography WHERE name = 'Stanley Mitchell Hut' AND provider = 'acc';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-122.8967, 49.7292), 4326)::geography WHERE name = 'Watersprite Lake' AND provider = 'bcmc';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-123.19, 49.57), 4326)::geography WHERE name = 'Mountain Lake Hut' AND provider = 'bcmc';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-122.6799, 50.6306), 4326)::geography WHERE name = 'Phelix Creek (Brian Waddington)' AND provider = 'voc';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-123.1913, 50.0400), 4326)::geography WHERE name = 'Brew Hut' AND provider = 'voc';

-- RSTBC rec sites: update Coquihalla, fix Hicks Lake -> Silver Lake if it exists
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-121.0891, 49.5995), 4326)::geography, name = 'Coquihalla Summit Rec Site' WHERE name = 'Coquihalla Lake Rec Site' AND provider = 'rstbc';
UPDATE locations SET coordinates = ST_SetSRID(ST_MakePoint(-120.73, 50.13), 4326)::geography, name = 'Silver Lake Rec Site' WHERE name = 'Hicks Lake Rec Site' AND provider = 'rstbc';
