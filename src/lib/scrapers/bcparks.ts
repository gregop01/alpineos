import type { Scraper, ScraperResult } from './base';
import type { LocationForScrape } from './base';

// BC Parks uses GoingToCamp - use goingToCampScraper for real data.
// This stub returns null so the scrape script uses goingToCampScraper instead.
export const bcParksScraper: Scraper = {
  name: 'bcparks',
  providers: ['bcparks'],
  async run(_location: LocationForScrape): Promise<ScraperResult | null> {
    return null;
  },
};
