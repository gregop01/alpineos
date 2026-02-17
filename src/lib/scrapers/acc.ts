import type { Scraper, ScraperResult } from './base';
import type { LocationForScrape } from './base';

// TODO: ACC hut booking requires Playwright (alpineclubofcanada.ca member login)
// ACC: 180d members / 90d non-members, 12:00 AM MT
export const accScraper: Scraper = {
  name: 'acc',
  providers: ['acc'],
  async run(_location: LocationForScrape): Promise<ScraperResult | null> {
    return null;
  },
};
