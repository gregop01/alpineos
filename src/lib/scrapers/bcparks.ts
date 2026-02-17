import type { Scraper, ScraperResult } from './base';
import { addDays, format } from 'date-fns';

// TODO: Phase 2 - Playwright automation for BC Parks reserve.bcparks.ca / camping.bcparks.ca

const MOCK_LOCATION_IDS = [
  'garibaldi-lake',
  'joffre-lakes',
  'berg-lake',
];

function mockStatus(): string {
  const r = Math.random();
  if (r < 0.3) return 'available';
  if (r < 0.6) return 'booked';
  if (r < 0.8) return 'unknown';
  return 'opening_soon';
}

export const bcParksScraper: Scraper = {
  name: 'bcparks',
  async run(locationId?: string): Promise<ScraperResult[]> {
    const ids = locationId
      ? [locationId]
      : MOCK_LOCATION_IDS;
    const results: ScraperResult[] = [];
    const today = new Date();

    for (const id of ids) {
      const availability = Array.from({ length: 90 }, (_, i) => {
        const date = addDays(today, i);
        return {
          date: format(date, 'yyyy-MM-dd'),
          status: mockStatus(),
          spotsRemaining: Math.floor(Math.random() * 10) || undefined,
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
