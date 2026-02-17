-- Update Parks Canada booking_url to park-specific parks.canada.ca pages
-- instead of generic reservation.pc.gc.ca

-- Gulf Islands
UPDATE locations SET booking_url = 'https://parks.canada.ca/pn-np/bc/gulf/activ/camping'
WHERE provider = 'parks_canada' AND (
  name ILIKE '%shell beach%' OR name ILIKE '%d''arcy%' OR name ILIKE '%cabbage island%'
  OR name ILIKE '%narvaez bay%' OR name ILIKE '%shingle bay%' OR name ILIKE '%arbutus point%'
  OR name ILIKE '%isle de lis%' OR name ILIKE '%beaumont%' OR name ILIKE '%james bay%'
  OR name ILIKE '%princess bay%' OR name ILIKE '%prior centennial%' OR name ILIKE '%gulf islands%'
);

-- Pacific Rim / West Coast Trail
UPDATE locations SET booking_url = 'https://parks.canada.ca/pn-np/bc/pacificrim/activ/sco-wct'
WHERE provider = 'parks_canada' AND (name ILIKE '%west coast trail%' OR name ILIKE '%wct%');

-- Lake O'Hara (Yoho)
UPDATE locations SET booking_url = 'https://parks.canada.ca/pn-np/bc/yoho/activ/randonnee-hike/ohara'
WHERE provider = 'parks_canada' AND (name ILIKE '%lake o''hara%' OR name ILIKE '%ohara%');

-- Banff frontcountry + Johnston Canyon day use
UPDATE locations SET booking_url = 'https://parks.canada.ca/pn-np/ab/banff/activ/camping'
WHERE provider = 'parks_canada' AND (
  name ILIKE '%johnston canyon%' OR name ILIKE '%two jack main%' OR name ILIKE '%two jack lakeside%'
  OR name ILIKE '%tunnel mountain village 2%' OR name ILIKE '%tunnel mountain village 1%'
  OR name ILIKE '%tunnel mountain trailer court%' OR name ILIKE '%bighorn campground%'
);

-- Banff backcountry
UPDATE locations SET booking_url = 'https://parks.canada.ca/pn-np/ab/banff/activ/arrierepays-backcountry'
WHERE provider = 'parks_canada' AND (
  name ILIKE '%flint%' OR name ILIKE '%block lakes%' OR name ILIKE '%sawback%'
  OR name ILIKE '%mystic junction%' OR name ILIKE '%mystic valley%' OR name ILIKE '%larry''s camp%'
  OR name ILIKE '%johnston creek backcountry%' OR name ILIKE '%luellen lake%' OR name ILIKE '%badger pass%'
  OR name ILIKE '%cockscomb%' OR name ILIKE '%marvel lake%' OR name ILIKE '%mcbride''s camp%'
  OR name ILIKE '%allenby junction%' OR name ILIKE '%brewster creek%' OR name ILIKE '%howard douglas%'
  OR name ILIKE '%healy creek%' OR name ILIKE '%pharaoh creek%' OR name ILIKE '%shadow lake%'
  OR name ILIKE '%lost horse creek%' OR name ILIKE '%mount rundle backcountry%' OR name ILIKE '%aylmer canyon%'
  OR name ILIKE '%inglismaldie%' OR name ILIKE '%mount costigan%' OR name ILIKE '%the narrows backcountry%'
  OR name ILIKE '%ghost lakes%' OR name ILIKE '%cascade bridge%' OR name ILIKE '%stoney creek%'
  OR name ILIKE '%bow river canoe%' OR name ILIKE '%elk lake summit%' OR name ILIKE '%aylmer pass junction%'
  OR name ILIKE '%bryant creek%' OR name ILIKE '%burstall%' OR name ILIKE '%birdwood%'
  OR name ILIKE '%big springs%' OR name ILIKE '%egypt lake%' OR name ILIKE '%ball pass junction%'
);

-- Jasper frontcountry
UPDATE locations SET booking_url = 'https://parks.canada.ca/pn-np/ab/jasper/activ/passez-stay'
WHERE provider = 'parks_canada' AND (
  name ILIKE '%tekarra%' OR name ILIKE '%whistlers%' OR name ILIKE '%wabasso%'
  OR name ILIKE '%miette%' OR name ILIKE '%snaring%' OR name ILIKE '%overflow%'
  OR name ILIKE '%icefield centre%' OR name ILIKE '%icefield%'
);

-- Jasper backcountry
UPDATE locations SET booking_url = 'https://parks.canada.ca/pn-np/ab/jasper/activ/passez-stay/arrierepays-backcountry'
WHERE provider = 'parks_canada' AND (
  name ILIKE '%arête%' OR name ILIKE '%minnow lake%' OR name ILIKE '%avalanche%'
  OR name ILIKE '%athabasca crossing%' OR name ILIKE '%big bend%' OR name ILIKE '%mary vaux%'
  OR name ILIKE '%astoria%' OR name ILIKE '%four point%' OR name ILIKE '%cairn pass%'
  OR name ILIKE '%brazeau meadows%' OR name ILIKE '%whitehorse%' OR name ILIKE '%welbourne%'
  OR name ILIKE '%seldom inn%' OR name ILIKE '%signal%' OR name ILIKE '%evelyn creek%'
  OR name ILIKE '%whirlpool group%' OR name ILIKE '%john-john%' OR name ILIKE '%maccarib%'
  OR name ILIKE '%donaldson creek%' OR name ILIKE '%shalebanks%' OR name ILIKE '%willow creek horse%'
  OR name ILIKE '%chown creek%' OR name ILIKE '%twintree%' OR name ILIKE '%horseshoe%'
  OR name ILIKE '%brazeau river%' OR name ILIKE '%little heaven%' OR name ILIKE '%utopia%'
  OR name ILIKE '%timothy slides%' OR name ILIKE '%waterfalls%' OR name ILIKE '%poboktan%'
  OR name ILIKE '%isaac creek%' OR name ILIKE '%second geraldine%' OR name ILIKE '%tie camp%'
  OR name ILIKE '%willow creek%' OR name ILIKE '%kerkeslin%' OR name ILIKE '%medicine tent%'
  OR name ILIKE '%blue creek%' OR name ILIKE '%la grace%' OR name ILIKE '%mccready%'
  OR name ILIKE '%portal%' OR name ILIKE '%saturday night lake%' OR name ILIKE '%trapper creek%'
  OR name ILIKE '%schäffer%' OR name ILIKE '%brazeau lake%' OR name ILIKE '%fisherman''s bay%'
  OR name ILIKE '%chown creek horse%' OR name ILIKE '%ancient wall%' OR name ILIKE '%snowbowl%'
  OR name ILIKE '%byng%' OR name ILIKE '%oatmeal%' OR name ILIKE '%jonas%'
  OR name ILIKE '%medicine tent horse%' OR name ILIKE '%kane meadows%' OR name ILIKE '%curator%'
  OR name ILIKE '%slide creek%' OR name ILIKE '%switchback%' OR name ILIKE '%athabasca island%'
  OR name ILIKE '%coronet creek%' OR name ILIKE '%jacques lake%' OR name ILIKE '%adolphus horse%'
  OR name ILIKE '%wapiti%' OR name ILIKE '%boulder creek%' OR name ILIKE '%adolphus%'
  OR name ILIKE '%rocky forks%' OR name ILIKE '%southesk river%' OR name ILIKE '%watchtower%'
  OR name ILIKE '%clitheroe%'
);

-- Waterton backcountry
UPDATE locations SET booking_url = 'https://parks.canada.ca/pn-np/ab/waterton/activ/camping/arrierepays-wilderness-camping'
WHERE provider = 'parks_canada' AND (
  name ILIKE '%lone lake%' OR name ILIKE '%snowshoe%' OR name ILIKE '%goat lake%'
  OR name ILIKE '%bertha%' OR name ILIKE '%belly river%' OR name ILIKE '%crandell%'
  OR name ILIKE '%alderson%' OR name ILIKE '%boundary%'
);

-- Yoho (non-Lake O'Hara)
UPDATE locations SET booking_url = 'https://parks.canada.ca/pn-np/bc/yoho/activ/camping'
WHERE provider = 'parks_canada' AND (
  name ILIKE '%yoho%' OR name ILIKE '%okeefe%' OR name ILIKE '%takakkaw%'
  OR name ILIKE '%wapta%' OR name ILIKE '%emerald%'
)
AND name NOT ILIKE '%lake o''hara%' AND name NOT ILIKE '%ohara%';

-- Kootenay
UPDATE locations SET booking_url = 'https://parks.canada.ca/pn-np/bc/kootenay/activ/camping'
WHERE provider = 'parks_canada' AND (
  name ILIKE '%kootenay%' OR name ILIKE '%radium%' OR name ILIKE '%marble canyon%'
  OR name ILIKE '%redstreak%' OR name ILIKE '%floe%' OR name ILIKE '%olive%'
);

-- Glacier
UPDATE locations SET booking_url = 'https://parks.canada.ca/pn-np/bc/glacier/activ/passez-stay'
WHERE provider = 'parks_canada' AND (
  name ILIKE '%glacier%' OR name ILIKE '%iliecillewaet%' OR name ILIKE '%loop brook%'
  OR name ILIKE '%hermit%' OR name ILIKE '%sir donald%'
);

-- Mt Revelstoke
UPDATE locations SET booking_url = 'https://parks.canada.ca/pn-np/bc/revelstoke/activ/passez-stay'
WHERE provider = 'parks_canada' AND (
  name ILIKE '%revelstoke%' OR name ILIKE '%snowforest%' OR name ILIKE '%eva lake%'
  OR name ILIKE '%jade lake%'
);

-- Catch-all: any remaining with generic URL → parks finder
UPDATE locations SET booking_url = 'https://parks.canada.ca/voyage-travel/recherche-tous-parks-all'
WHERE provider = 'parks_canada' AND booking_url = 'https://reservation.pc.gc.ca/';
