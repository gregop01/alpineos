-- Remove BC Parks locations that are ecological reserves.
-- Ecological reserves do not allow camping - they are protected for research/conservation.
-- See: https://bcparks.ca/ecological-reserves/

DELETE FROM locations
WHERE provider = 'bcparks'
  AND (
    name ILIKE '%ecological reserve%'
    OR name ILIKE '% ecological reserve'
  );
