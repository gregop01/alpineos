import type { Scraper, ScraperResult } from './base';
import type { LocationForScrape } from './base';

// Parks Canada uses GoingToCamp - use goingToCampScraper for real data.
export const parksCanadaScraper: Scraper = {
  name: 'parks_canada',
  providers: ['parks_canada'],
  async run(_location: LocationForScrape): Promise<ScraperResult | null> {
    return null;
  },
};
