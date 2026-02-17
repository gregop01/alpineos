/**
 * Build BC Parks park-specific URLs. Each park has a page at bcparks.ca/[slug]/
 * with a "Book camping" link to the correct camping.bcparks.ca reservation page.
 */

/** Location/trail names that map to different park slugs */
const NAME_TO_PARK_SLUG: Record<string, string> = {
  'elfin lakes': 'garibaldi-park',
  'elfin lakes shelter': 'garibaldi-park',
  'garibaldi lake': 'garibaldi-park',
  'helm creek': 'garibaldi-park',
  'joffre lakes': 'joffre-lakes-park',
  'joffre lakes day use': 'joffre-lakes-park',
  'berg lake trail': 'mount-robson-park',
  'mt. assiniboine': 'mount-assiniboine-park',
  'cathedral lakes': 'cathedral-park',
  'manning park': 'ec-manning-park',
  'bowron lakes': 'bowron-lake-park',
  'cultus lake': 'cultus-lake-park',
  'alice lake': 'alice-lake-park',
  'golden ears day use': 'golden-ears-park',
};

/**
 * Convert a park/location name to a bcparks.ca URL slug.
 * Matches the pattern used on bcparks.ca/find-a-park/a-z-list/
 *
 * Examples:
 *   "E.C. Manning Park" → "ec-manning-park"
 *   "DISCOVERY ISLAND MARINE PARK" → "discovery-island-marine-park"
 *   "Garibaldi Park" → "garibaldi-park"
 *   "Boothman's Oxbow Park" → "boothmans-oxbow-park"
 */
export function parkNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '') // Remove apostrophes (Boothman's → boothmans)
    .replace(/\./g, '') // Remove periods (E.C. → ec)
    .replace(/[()[\]/\\]/g, ' ') // Parentheses/slashes → spaces for separate words
    .replace(/\s*-\s*/g, ' ') // Normalize hyphen spacing
    .replace(/[^a-z0-9\s-]/g, '') // Remove other special chars
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join('-');
}

/**
 * Get the BC Parks park page URL for a given location name.
 * The park page includes a "Book camping" link to the reservation system.
 */
export function getBcParksParkUrl(name: string): string {
  const key = name.toLowerCase().trim();
  const slug =
    NAME_TO_PARK_SLUG[key] ?? parkNameToSlug(name);
  if (!slug) return 'https://bcparks.ca/find-a-park/';
  return `https://bcparks.ca/${slug}/`;
}
