-- Mark BC Parks (non-ecological) as reservable so the availability calendar shows.
-- Ecological reserves stay wilderness. Individual parks can be overridden in later migrations.
UPDATE locations
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"requires_booking": true, "camping_type": "reservation"}'::jsonb
WHERE provider = 'bcparks'
  AND (metadata IS NULL OR metadata = '{}'::jsonb OR (metadata->>'requires_booking') IS NULL)
  AND name NOT ILIKE '%ECOLOGICAL RESERVE%'
  AND name NOT ILIKE '% ECOLOGICAL RESERVE';
