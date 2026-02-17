/**
 * Determines whether a location requires booking/reservation and its camping type.
 * Uses metadata.requires_booking, metadata.camping_type, and provider rules.
 *
 * BC Parks is mixed: some parks have reservable campgrounds, others (e.g. Mehatl Creek)
 * are wilderness/FCFS only. Only set requires_booking=true when metadata says so.
 */

export type CampingType =
  | 'reservation'
  | 'first_come_first_serve'
  | 'wilderness'
  | 'group'
  | 'unknown';

/** Providers that are always first-come first-served / walk-in */
const PROVIDERS_ALWAYS_WALK_IN = new Set([
  'rstbc',
  'bc_coastal',
  'sct',
]);

/** Providers that use reservation systems (all their locations require booking) */
const PROVIDERS_ALWAYS_BOOK = new Set([
  'parks_canada',
  'acc',
  'ridb',
  'wa_state_parks',
  'bcmc',
  'spearhead_huts',
  'cvhs',
  'pwa',
]);

/** Info-only URLs that don't support reservations */
const INFO_ONLY_URL_PATTERNS = [
  'www2.gov.bc.ca/gov/content/sports-culture/recreation/camping-hiking/sites-trails',
];

function isInfoOnlyUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return INFO_ONLY_URL_PATTERNS.some((p) => lower.includes(p));
}

export interface NeedsBookingInput {
  provider: string;
  booking_url?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CampingBadgeInfo {
  requiresBooking: boolean;
  campingType: CampingType;
}

/**
 * Returns true if the location requires a reservation/booking.
 */
export function needsBooking(input: NeedsBookingInput): boolean {
  return getCampingBadgeInfo(input).requiresBooking;
}

/**
 * Returns badge info for map popup and cards (Book, Walk-in, Wilderness).
 */
export function getCampingBadgeInfo(input: NeedsBookingInput): CampingBadgeInfo {
  const { provider, booking_url, metadata } = input;
  const campingType = (metadata?.camping_type as CampingType | undefined) ?? 'unknown';

  // Explicit metadata overrides
  if (metadata?.requires_booking === true) {
    return { requiresBooking: true, campingType: 'reservation' };
  }
  if (metadata?.requires_booking === false || metadata?.fcfs === true) {
    return {
      requiresBooking: false,
      campingType: campingType !== 'unknown' ? campingType : 'first_come_first_serve',
    };
  }

  if (PROVIDERS_ALWAYS_WALK_IN.has(provider)) {
    return { requiresBooking: false, campingType: 'first_come_first_serve' };
  }
  if (PROVIDERS_ALWAYS_BOOK.has(provider)) {
    return { requiresBooking: true, campingType: 'reservation' };
  }

  // BC Parks: mixed - only reservable when metadata.requires_booking is set
  if (provider === 'bcparks') {
    return { requiresBooking: false, campingType: campingType !== 'unknown' ? campingType : 'unknown' };
  }

  if (!booking_url || isInfoOnlyUrl(booking_url)) {
    return { requiresBooking: false, campingType: campingType !== 'unknown' ? campingType : 'first_come_first_serve' };
  }
  return { requiresBooking: true, campingType: 'reservation' };
}

/** Badge label for display. Uses FCFS consistently (same as walk-in). */
export function getCampingBadgeLabel(info: CampingBadgeInfo): string {
  if (info.requiresBooking) return 'Book';
  switch (info.campingType) {
    case 'wilderness':
      return 'Wilderness';
    case 'first_come_first_serve':
      return 'FCFS';
    case 'group':
      return 'Group';
    default:
      return 'FCFS';
  }
}
