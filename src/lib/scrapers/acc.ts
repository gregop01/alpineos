import type { Scraper, ScraperResult } from './base';
import { addDays, format } from 'date-fns';

// TODO: Phase 2 - Playwright automation for ACC hut booking (alpineclubofcanada.ca)
// ACC: 180d members / 90d non-members, 12:00 AM MT

const MOCK_LOCATION_IDS = [
  'elizabeth-parker-hut',
  'fairy-meadow-hut',
  'stanley-mitchell-hut',
];

function mockStatus(): string {
  const r = Math.random();
  if (r < 0.2) return 'available';
  if (r < 0.5) return 'booked';
  if (r < 0.8) return 'unknown';
  return 'opening_soon';
}

export const accScraper: Scraper = {
  name: 'acc',
  async run(locationId?: string): Promise<ScraperResult[]> {
    const ids = locationId ? [locationId] : MOCK_LOCATION_IDS;
    const results: ScraperResult[] = [];
    const today = new Date();

    for (const id of ids) {
      const availability = Array.from({ length: 180 }, (_, i) => {
        const date = addDays(today, i);
        return {
          date: format(date, 'yyyy-MM-dd'),
          status: mockStatus(),
          spotsRemaining: Math.floor(Math.random() * 12) || undefined,
        };
      });

      results.push({
        locationId: id,
        availability,
        lastUpdated: new Date().toISOString(),
      });
    }

    return results;
  },
};
