-- Remove RSTBC (BC Rec Sites) locations that are not campsites:
-- Excludes: trailheads, day-use areas, parking lots, and other non-camping facilities.
-- Mirrors the approach used for Parks Canada in 010_filter_parks_canada.sql.

DELETE FROM locations
WHERE provider = 'rstbc'
  AND (
    -- Trailheads
    name ILIKE '%trailhead%'
    OR name ILIKE '%trail head%'
    -- Day use (not camping)
    OR name ILIKE '%day use%'
    OR name ILIKE '%day-use%'
    -- Parking lots/areas (exclude unless also a cabin/camp - e.g. "Lucille Parking Lot and Alpine Cabin")
    OR (
      (name ILIKE '%parking lot%' OR name ILIKE '%parking area%' OR name ILIKE '% parking %')
      AND name NOT ILIKE '%cabin%'
      AND name NOT ILIKE '%camp%'
    )
    -- Trail parking
    OR name ILIKE '%trail (parking%'
    OR name ILIKE '%trail parking%'
    -- Recreation area that's just parking
    OR name ILIKE '%recreation area & parking%'
    OR name ILIKE '%recreation area and parking%'
    -- Snowmobile / ski parking (not campsites)
    OR name ILIKE '%snowmobile%parking%'
    OR name ILIKE '%ski parking%'
    OR name ILIKE '%cross country ski parking%'
    -- Abbreviated trailhead
    OR name ILIKE '%trail hd%'
  );
