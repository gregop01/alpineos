/**
 * Build Parks Canada location-specific URLs. Each park has pages at
 * parks.canada.ca/pn-np/[province]/[park-slug]/ with camping and activity info.
 * Links go to the park's location page (not the generic reservation.pc.gc.ca).
 */

const PC_BASE = 'https://parks.canada.ca';

/** Location names → full path (e.g. 'pn-np/bc/yoho/activ/randonnee-hike/ohara') */
const NAME_TO_PATH: Record<string, string> = {
  // Pacific Rim / West Coast Trail
  'west coast trail': 'pn-np/bc/pacificrim/activ/sco-wct',

  // Lake O'Hara (Yoho)
  "lake o'hara": 'pn-np/bc/yoho/activ/randonnee-hike/ohara',

  // Day-use / permits with specific pages
  'johnston canyon': 'pn-np/ab/banff/activ/camping',
  'lake louise': 'pn-np/ab/banff/activ/camping',
  'moraine lake': 'pn-np/ab/banff/activ/camping',

  // Gulf Islands backcountry (all use same camping page)
  'gulf islands backcountry': 'pn-np/bc/gulf/activ/camping',
  'prior centennial': 'pn-np/bc/gulf/activ/camping',
};

/** Park slug → { province, campingPath, backcountryPath } */
const PARK_PATHS: Record<string, { province: string; camping: string; backcountry: string }> = {
  banff: { province: 'ab', camping: 'pn-np/ab/banff/activ/camping', backcountry: 'pn-np/ab/banff/activ/arrierepays-backcountry' },
  jasper: { province: 'ab', camping: 'pn-np/ab/jasper/activ/passez-stay', backcountry: 'pn-np/ab/jasper/activ/passez-stay/arrierepays-backcountry' },
  yoho: { province: 'bc', camping: 'pn-np/bc/yoho/activ/camping', backcountry: 'pn-np/bc/yoho/activ/arrierepays-backcountry' },
  kootenay: { province: 'bc', camping: 'pn-np/bc/kootenay/activ/camping', backcountry: 'pn-np/bc/kootenay/activ/arrierepays-backcountry' },
  pacificrim: { province: 'bc', camping: 'pn-np/bc/pacificrim/activ/sco-wct', backcountry: 'pn-np/bc/pacificrim/activ/sco-wct' },
  gulf: { province: 'bc', camping: 'pn-np/bc/gulf/activ/camping', backcountry: 'pn-np/bc/gulf/activ/camping' },
  glacier: { province: 'bc', camping: 'pn-np/bc/glacier/activ/passez-stay', backcountry: 'pn-np/bc/glacier/activ/passez-stay' },
  revelstoke: { province: 'bc', camping: 'pn-np/bc/revelstoke/activ/passez-stay', backcountry: 'pn-np/bc/revelstoke/activ/passez-stay' },
  waterton: { province: 'ab', camping: 'pn-np/ab/waterton/activ/camping', backcountry: 'pn-np/ab/waterton/activ/camping/arrierepays-wilderness-camping' },
};

/** Location name substrings → park slug (checked in order; first match wins) */
const NAME_TO_PARK: Array<{ pattern: string | RegExp; park: string }> = [
  { pattern: 'gulf|shell beach|d\'arcy|cabbage|narvaez|shingle|arbutus|isle de lis|beaumont|james bay|princess bay|prior centennial', park: 'gulf' },
  { pattern: 'west coast|wct|pachena|gordon river', park: 'pacificrim' },
  { pattern: /lake o'?hara|ohara/i, park: 'yoho' },
  { pattern: 'waterton|lone lake|snowshoe|goat lake|bertha|belly river|crandell|alderson|boundary', park: 'waterton' },
  { pattern: 'jasper|tekarra|athabasca|snaring|whistlers|wabasso|miette|icefield|wolverine|signal|portal|brazeau|curator|jacques|wapiti|medicine tent|kerkeslin|fisherman|southesk|adolphus|ancient wall|snowbowl|byng|oatmeal|seldom inn|blue creek|la grace|welbourne|saturday night|trapper|schäffer|brazeau lake|chown creek|tie camp|willow creek|medicine tent horse|kane meadows|slide creek|switchback|athabasca island|coronet|adolphus horse|rocky forks|watchtower|clitheroe|mccready|second geraldine|isaac creek|jonas|poboktan|waterfalls|four point|cairn pass|evelyn creek|whirlpool|brussels|little shovel|honeymoon|wilcox|cairn river|lower fryatt|athabasca pass|athabasca crossing|big bend|natural arch|little heaven|utopia|timothy slides|donaldson creek|shalebanks|willow creek horse|horseshoe|twintree|chown creek horse|spruce tree|three slides|amethyst', park: 'jasper' },
  { pattern: 'yoho|okeefe|takakkaw|wapta|emerald', park: 'yoho' },
  { pattern: 'kootenay|radium|marble canyon|floe|olive|redstreak', park: 'kootenay' },
  { pattern: 'glacier|iliecillewaet|loop brook|hermit|sir donald', park: 'glacier' },
  { pattern: 'revelstoke|snowforest|eva lake|jade lake', park: 'revelstoke' },
  { pattern: 'banff|johnston|two jack|tunnel mountain|bighorn|flint|block lakes|sawback|mystic|larry\'s|johnston creek|luellen|badger pass|cockscomb|marvel|mcbride|allenby|brewster|howard douglas|healy creek|pharaoh|shadow lake|lost horse|mount rundle|aylmer|inglismaldie|mount costigan|the narrows|ghost lakes|cascade bridge|stoney creek|bow river canoe|elk lake summit|aylmer pass|bryant creek|burstall|birdwood|twin lakes|big springs|egypt lake|ball pass|ball pass junction', park: 'banff' },
];

function matchesPattern(name: string, pattern: string | RegExp): boolean {
  const lower = name.toLowerCase();
  if (typeof pattern === 'string') {
    return pattern.split('|').some((p) => lower.includes(p.trim()));
  }
  return pattern.test(name);
}

function isBackcountry(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes('backcountry') || lower.includes('shelter');
}

/**
 * Get the Parks Canada location page URL for a given location name.
 * Returns the park's camping or backcountry page (not reservation.pc.gc.ca).
 */
export function getParksCanadaLocationUrl(name: string): string {
  const key = name.toLowerCase().trim();
  const exact = NAME_TO_PATH[key];
  if (exact) return `${PC_BASE}/${exact}`;

  for (const { pattern, park } of NAME_TO_PARK) {
    if (matchesPattern(name, pattern)) {
      const p = PARK_PATHS[park];
      if (!p) return `${PC_BASE}/pn-np`;
      const path = isBackcountry(name) ? p.backcountry : p.camping;
      return `${PC_BASE}/${path}`;
    }
  }

  return `${PC_BASE}/voyage-travel/recherche-tous-parks-all`;
}
