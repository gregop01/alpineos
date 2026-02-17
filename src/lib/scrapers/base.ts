export interface ScraperResult {
  locationId: string;
  availability: { date: string; status: string; spotsRemaining?: number }[];
  lastUpdated: string;
}

/** Location info passed to scrapers - must include fields needed to resolve provider API IDs */
export interface LocationForScrape {
  id: string;
  name: string;
  provider: string;
  booking_url: string | null;
  metadata: Record<string, unknown>;
}

export interface Scraper {
  name: string;
  /** Providers this scraper can fetch availability for */
  providers: string[];
  /** Fetch availability for a single location. Returns null if location cannot be scraped. */
  run(location: LocationForScrape): Promise<ScraperResult | null>;
}
