/**
 * Recreation.gov availability scraper (RIDB provider)
 * Uses unofficial API: https://www.recreation.gov/api/camps/availability/campground/{id}/month
 *
 * Campground ID is extracted from booking_url (e.g. .../campgrounds/232447 -> 232447)
 */

import type { Scraper, ScraperResult } from './base';
import { addDays, format } from 'date-fns';
import type { LocationForScrape } from './base';

const BASE = 'https://www.recreation.gov';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Extract campground ID from recreation.gov URL (e.g. /camping/campgrounds/232447 or full URL) */
function extractCampgroundId(bookingUrl: string | null): string | null {
  if (!bookingUrl) return null;
  const match = bookingUrl.match(/campgrounds\/(\d+)/i);
  return match ? match[1] : null;
}

/** Fetch availability for one month from recreation.gov API */
async function fetchMonth(
  campgroundId: string,
  monthDate: Date
): Promise<{ campsites: Record<string, { availabilities: Record<string, string> }> }> {
  const startDate = format(monthDate, 'yyyy-MM-dd');
  const url = `${BASE}/api/camps/availability/campground/${campgroundId}/month`;
  const res = await fetch(`${url}?start_date=${startDate}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Recreation.gov API ${res.status}: ${url}`);
  }
  return res.json();
}

/** Aggregate campsite availabilities into per-date spots remaining */
function aggregateAvailability(
  apiData: { campsites: Record<string, { availabilities: Record<string, string> }> }
): Map<string, { status: string; spotsRemaining: number }> {
  const byDate = new Map<string, { available: number; total: number }>();
  for (const site of Object.values(apiData.campsites ?? {})) {
    for (const [dateStr, val] of Object.entries(site.availabilities ?? {})) {
      const cur = byDate.get(dateStr) ?? { available: 0, total: 0 };
      cur.total += 1;
      if (val === 'Available') cur.available += 1;
      byDate.set(dateStr, cur);
    }
  }
  const result = new Map<string, { status: string; spotsRemaining: number }>();
  for (const [dateStr, { available, total }] of byDate) {
    const status =
      available > 0 ? 'available' : total > 0 ? 'booked' : 'unknown';
    result.set(dateStr, { status, spotsRemaining: available });
  }
  return result;
}

export const recreationGovScraper: Scraper = {
  name: 'recreation_gov',
  providers: ['ridb'],
  async run(location: LocationForScrape): Promise<ScraperResult | null> {
    const campgroundId = extractCampgroundId(location.booking_url);
    if (!campgroundId) return null;

    const today = new Date();
    const endDate = addDays(today, 90);
    const availabilityByDate = new Map<string, { status: string; spotsRemaining: number }>();

    try {
      const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      for (let i = 0; i < 4; i++) {
        const monthDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
        if (monthDate > endDate) break;
        const data = await fetchMonth(campgroundId, monthDate);
        const agg = aggregateAvailability(data);
        for (const [dateStr, info] of agg) {
          availabilityByDate.set(dateStr, info);
        }
      }

      const availability: ScraperResult['availability'] = [];
      for (let i = 0; i < 90; i++) {
        const date = addDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const info = availabilityByDate.get(dateStr);
        availability.push({
          date: dateStr,
          status: info?.status ?? 'unknown',
          spotsRemaining: info?.spotsRemaining,
        });
      }

      return {
        locationId: location.id,
        availability,
        lastUpdated: new Date().toISOString(),
      };
    } catch (err) {
      console.error(`Recreation.gov scrape failed for ${location.name} (${campgroundId}):`, err);
      return null;
    }
  },
};
