export interface ScraperResult {
  locationId: string;
  availability: { date: string; status: string; spotsRemaining?: number }[];
  lastUpdated: string;
}

export interface Scraper {
  name: string;
  run(locationId?: string): Promise<ScraperResult[]>;
}
