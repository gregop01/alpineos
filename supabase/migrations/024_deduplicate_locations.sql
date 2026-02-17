-- Remove duplicate locations (same name, provider, and ~same coordinates).
-- Duplicates often come from BC Parks WFS (multiple polygons per park) or overlapping imports.
-- Keeps one record per place; merges availability into the kept record.

-- 1. Find duplicate groups: same name (case-insensitive), same provider, coords within ~100m
WITH dup_groups AS (
  SELECT
    id,
    name,
    provider,
    coordinates,
    (SELECT l2.id
     FROM locations l2
     WHERE LOWER(TRIM(l2.name)) = LOWER(TRIM(l.name))
       AND l2.provider = l.provider
       AND ST_DWithin(l2.coordinates, l.coordinates, 100)
     ORDER BY l2.id
     LIMIT 1
    ) AS kept_id
  FROM locations l
)
SELECT id AS dup_id, kept_id INTO TEMP _duplicates
FROM dup_groups
WHERE id != kept_id;

-- 2. Migrate availability from duplicates to kept, resolving date conflicts
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT dup_id, kept_id FROM _duplicates ORDER BY kept_id, dup_id)
  LOOP
    -- Insert dup's availability into kept; on date conflict, keep the row with more info
    INSERT INTO availability (location_id, date, status, spots_remaining, last_updated)
    SELECT r.kept_id, a.date, a.status, a.spots_remaining, a.last_updated
    FROM availability a
    WHERE a.location_id = r.dup_id
    ON CONFLICT (location_id, date) DO UPDATE SET
      status = CASE
        WHEN EXCLUDED.status = 'available' THEN EXCLUDED.status
        ELSE availability.status
      END,
      spots_remaining = COALESCE(EXCLUDED.spots_remaining, availability.spots_remaining),
      last_updated = GREATEST(availability.last_updated, EXCLUDED.last_updated);

    -- Remove availability tied to the duplicate
    DELETE FROM availability WHERE location_id = r.dup_id;
  END LOOP;
END $$;

-- 3. Delete duplicate locations
DELETE FROM locations
WHERE id IN (SELECT dup_id FROM _duplicates);

DROP TABLE _duplicates;
