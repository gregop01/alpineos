-- Add operating season metadata for BC Parks campgrounds.
-- Inferred from camply availability (closed vs open dates). To refresh:
--   python3 scripts/camply_availability.py --rec-area 12 --limit 150 | node scripts/fetch-operating-seasons.mjs --sql

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'ALLISON LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'BAMBERTON PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'BEATTON PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'BIRKENHEAD LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"May 8 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'BLANKET CREEK PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Apr 10 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'BROMLEY ROCK PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"May 15 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'CARP LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'CHARLIE LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'ELK FALLS PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'ENGLISHMAN RIVER FALLS PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'FILLONGLEY PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Apr 30 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'GLADSTONE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"May 8 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'GORDON BAY PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"May 15 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'GREEN LAKE PARK - ARROWHEAD SITE';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'GWILLIM LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Apr 24 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'HERALD PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'JIMSMITH LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"May 13 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'KIKOMUN CREEK PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Apr 24 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'KOKANEE CREEK PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'LAC LA HACHE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'LAC LE JEUNE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"May 8 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'MARTHA CREEK PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"May 1 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'MCDONALD CREEK PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'MEZIADIN LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Mar 20 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'MIRACLE BEACH PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'MOBERLY LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"May 1 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'MONCK PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'MORTON LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'MOUNT FERNIE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'MUNCHO LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'NORBURY LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'NORTH THOMPSON RIVER PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'PAARENS BEACH PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Apr 15 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'PORPOISE BAY PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Feb 17 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'PORTEAU COVE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'PREMIER LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'ROSEBERY PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'SALTERY BAY PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Mar 31 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'SASQUATCH PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"May 1 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'SHUSWAP LAKE MARINE PARK - ALBAS SITE';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Apr 30 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'SMELT BAY PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'SOWCHEA BAY PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Apr 15 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'SPROAT LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Apr 10 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'STEMWINDER PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"May 12 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'STRATHCONA PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'SWAN LAKE KISPIOX RIVER PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'TYHEE LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'WASA LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'YAHK PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Feb 27 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'Golden Ears Day Use';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'COWICHAN RIVER PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Apr 24 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'KOOTENAY LAKE PARK - CAMPBELL BAY SITE';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'SAYSUTSHUN (NEWCASTLE ISLAND MARINE) PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'LOVELAND BAY PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"May 15 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'BOWRON LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"May 13 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'OTTER LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"May 1 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'LAKELSE LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Mar 13 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'MONTAGUE HARBOUR MARINE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"May 15 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'WHISKERS POINT PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Year-round"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'SUMMIT LAKE PARK';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Mar 13 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'Alice Lake';

UPDATE locations SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"season":"Mar 27 - Sep 30"}'::jsonb
WHERE provider = 'bcparks' AND name ILIKE 'Cultus Lake';
