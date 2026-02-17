-- Add requires_booking and camping_type to locations metadata for badge display
-- (Book vs Walk-in vs Wilderness)
--
-- Add bc_coastal provider; include all providers from 012, 016 (idempotent if run after)
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_provider_check;
ALTER TABLE locations ADD CONSTRAINT locations_provider_check CHECK (
  provider IN (
    'bcparks', 'parks_canada', 'acc', 'ridb', 'rstbc', 'bcmc', 'voc',
    'wa_state_parks', 'bc_coastal', 'spearhead_huts', 'cvhs', 'pwa',
    'tetrahedron', 'sct', 'commercial', 'other'
  )
);

-- RSTBC, bc_coastal: always FCFS, no reservations
-- BC Parks ecological reserves: wilderness camping only
-- Parks Canada, WA State Parks, RIDB: reservable (already handled by provider rules)

-- RSTBC: FCFS
UPDATE locations
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"requires_booking": false, "camping_type": "first_come_first_serve"}'::jsonb
WHERE provider = 'rstbc';

-- BC Coastal: FCFS
UPDATE locations
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"requires_booking": false, "camping_type": "first_come_first_serve"}'::jsonb
WHERE provider = 'bc_coastal';

-- BC Parks ecological reserves: wilderness (no reservable campgrounds)
UPDATE locations
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"requires_booking": false, "camping_type": "wilderness"}'::jsonb
WHERE provider = 'bcparks' AND (
  name ILIKE '%ECOLOGICAL RESERVE%'
  OR name ILIKE '% ECOLOGICAL RESERVE'
);

-- Parks Canada: reservable
UPDATE locations
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"requires_booking": true, "camping_type": "reservation"}'::jsonb
WHERE provider = 'parks_canada';

-- WA State Parks: reservable
UPDATE locations
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"requires_booking": true, "camping_type": "reservation"}'::jsonb
WHERE provider = 'wa_state_parks';

-- RIDB: reservable
UPDATE locations
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"requires_booking": true, "camping_type": "reservation"}'::jsonb
WHERE provider = 'ridb';
