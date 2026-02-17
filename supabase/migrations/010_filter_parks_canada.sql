-- Remove Parks Canada locations that are not:
-- 1. Places to sleep (campgrounds, camping areas)
-- 2. Day-use areas that require permits (Lake Louise, Moraine Lake, Lake O'Hara, Johnston Canyon)
--
-- Excludes: trailheads, visitor centres, compounds, warden cabins, park gates,
-- picnic/day-use areas that don't require permits, etc.

DELETE FROM locations
WHERE provider = 'parks_canada'
  AND (
    -- Exclusions by name pattern
    name ILIKE '%Trailhead%'
    OR name ILIKE '%Visitor Centre%'
    OR name ILIKE '%Compound%'
    OR name ILIKE '%Warden Cabin%'
    OR name ILIKE '%Park Gate%'
    OR name ILIKE '%Administration%'
    OR name ILIKE '%Operations%'
    OR name ILIKE '%East Gate%'
    OR name ILIKE '%Sanitary Dump%'
    OR name ILIKE '%Hot Springs%'
    OR name ILIKE '%Lunch Shelter%'
    OR name ILIKE '%Cave and Basin%'
    OR name ILIKE '%National Historic Site%'
    OR name ILIKE '%Ranch%'  -- Ya Ha Tinda etc
    -- Day-use areas that DON'T require permits (exclude all except permit-required)
    OR (
      (name ILIKE '%Day Use%' OR name ILIKE '%Day-use%' OR name ILIKE '%pique-nique%')
      AND name NOT ILIKE '%Lake Louise%'
      AND name NOT ILIKE '%Moraine Lake%'
      AND name NOT ILIKE '%Lake O''Hara%'
      AND name NOT ILIKE '%Johnston Canyon%'
    )
    -- Other non-camping facilities
    OR (name ILIKE '%Ink Pots%' AND name NOT ILIKE '%Camp%')
    OR name ILIKE '%Muleshoe%'
    OR name ILIKE '%Sawback%'
    OR name ILIKE '%Storm Mountain%'
    OR name ILIKE '%Two Jack Lake Day Use%'
    OR name ILIKE '%Cascade Ponds Day Use%'
    OR name ILIKE '%Fenland Day Use%'
    OR name ILIKE '%Johnson Lake%'  -- picnic area, not campground
    OR name ILIKE '%Sundance Canyon%'
    OR name ILIKE '%Lower Bankhead%'
    OR name ILIKE '%Upper Bankhead%'
    OR name ILIKE '%Continental Divide%'
    OR name ILIKE '%Spray Lunch%'
    OR name ILIKE '%Valleyview%'
    OR name ILIKE '%Fireside%'
    OR name ILIKE '%Georgina point%'
    OR name ILIKE '%East Point%'
    OR name ILIKE '%Russell%'
    OR name ILIKE '%Winter Cove%'
    OR name ILIKE '%Fort Rodd%'
    OR name ILIKE '%Sidney Spit%'
    OR name ILIKE '%Roesland%'
    OR name ILIKE '%Miette%'
    OR name ILIKE '%Hoodoos%'
    OR name ILIKE '%Tower%'
    OR name ILIKE '%Vermilion%'
    OR name ILIKE '%Spray River%'
    OR name ILIKE '%Stewart Canyon%'
    OR name ILIKE '%Sulphur Mountain%'
  );
