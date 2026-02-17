import type { Scraper, ScraperResult } from './base';
import { addDays, format } from 'date-fns';

// TODO: Phase 2 - Playwright automation for reservation.pc.gc.ca

const MOCK_LOCATION_IDS = ['west-coast-trail', 'gulf-islands', 'lake-ohara'];

function mockStatus(): string {
  const r = Math.random();
  if (r < 0.25) return 'available';
  if (r < 0.5) return 'booked';
  if (r < 0.75) return 'unknown';
  return 'opening_soon';
}

export const parksCanadaScraper: Scraper = {
  name: 'parks_canada',
  async run(locationId?: string): Promise<ScraperResult[]> {
    const ids = locationId ? [locationId] : MOCK_LOCATION_IDS;
    const results: ScraperResult[] = [];
    const today = new Date();

    for (const id of ids) {
      const availability = Array.from({ length: 90 }, (_, i) => {
        const date = addDays(today, i);
        return {
          date: format(date, 'yyyy-MM-dd'),
          status: mockStatus(),
          spotsRemaining: Math.floor(Math.random() * 8) || undefined,
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
