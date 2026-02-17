-- Remove Gemini-added bc_coastal duplicates for Montague Harbour & Wallace Island.
-- These are BC Parks marine parks; migration 017 already has them as bcparks.

DELETE FROM locations WHERE name ILIKE 'Montague Harbour%' AND provider = 'bc_coastal' AND (metadata->>'coord_added_by') = 'gemini';
DELETE FROM locations WHERE name ILIKE 'Wallace Island%' AND provider = 'bc_coastal' AND (metadata->>'coord_added_by') = 'gemini';
