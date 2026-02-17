# Booking Methods & Availability Scraping

## Overview

AlpineOS tracks bookable campsites, huts, and rec sites across multiple providers. This document describes how to book each type and how availability data is scraped.

---

## Bookable Providers

### 1. **RIDB / Recreation.gov** (Washington federal sites)

- **How to book**: Visit the booking URL (recreation.gov/camping/campgrounds/{id})
- **Availability**: Scraped via unofficial API: `https://www.recreation.gov/api/camps/availability/campground/{id}/month`
- **Campground ID**: Extracted from `booking_url` (e.g. `.../campgrounds/232447` → `232447`)
- **Window**: Variable (often 6–12 months)
- **Notes**: RIDB import populates locations with recreation.gov URLs. No extra mapping needed.

### 2. **BC Parks** (camping.bcparks.ca)

- **How to book**: [camping.bcparks.ca](https://camping.bcparks.ca) – search by park, select dates
- **Availability**: GoingToCamp API (rec_area_id: 12). Requires `metadata.goingtocamp` with `resource_location_id`, `map_id`
- **Window**: 90 days rolling, opens 7:00 PT
- **Population**: Run `node scripts/fetch-goingtocamp-ids.mjs` to discover facility IDs, then run the generated SQL to update `locations.metadata`

### 3. **Parks Canada** (reservation.pc.gc.ca)

- **How to book**: [reservation.pc.gc.ca](https://reservation.pc.gc.ca) – search by park/location
- **Availability**: GoingToCamp API (rec_area_id: 14)
- **Window**: Varies per park (e.g. WCT Jan 19, Gulf Islands Jan 16), ~8:00 opening
- **Population**: Same as BC Parks – fetch-goingtocamp-ids, then SQL update

### 4. **Washington State Parks** (washington.goingtocamp.com)

- **How to book**: [washington.goingtocamp.com](https://washington.goingtocamp.com)
- **Availability**: GoingToCamp API (rec_area_id: 3)
- **Population**: Same ID fetch workflow as BC Parks and Parks Canada

### 5. **RSTBC / BC Rec Sites** (sitesandtrailsbc.ca)

- **How to book**: First-come, first-served. No reservations.
- **Availability**: N/A – always “available” in principle (occupancy unknown)

### 6. **ACC Huts** (Alpine Club of Canada)

- **How to book**: [alpineclubofcanada.ca](https://alpineclubofcanada.ca) – member login required
- **Availability**: Not yet scraped (would require Playwright / browser automation)
- **Window**: 180 days members, 90 days non-members, midnight MT

### 7. **Other hut providers** (BCMC, VOC, Spearhead, CVHS, SCT, etc.)

- **How to book**: See `booking_url` on each location
- **Availability**: Varies; many are first-come or manual

---

## Running the Scrapers

### Prerequisites

- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (or env)
- Service role key bypasses RLS for availability inserts

### Scrape all bookable locations

```bash
npm run scrape
```

### Scrape only RIDB (Recreation.gov)

```bash
npm run scrape:ridb
```

### Scrape a subset (for testing)

```bash
npx tsx scripts/scrape-availability.ts --provider ridb --limit 5
```

### GoingToCamp (BC Parks, Parks Canada, Washington)

Uses **camply** (Python) to fetch availability. Install first:

```bash
pip install camply
# or: pip install -r requirements.txt
```

Then run:

```bash
npm run scrape:gtc
# or: npm run scrape  (runs RIDB + GoingToCamp)
```

Camply handles the GoingToCamp API session; our script matches facility names to DB locations.

---

## Data Flow

1. **Locations** – Imported from open data (import-locations.mjs) and migrations
2. **Provider IDs** – RIDB: from `booking_url`. GoingToCamp: from `metadata.goingtocamp` (populated by fetch-goingtocamp-ids)
3. **Scrapers** – `recreationGovScraper`, `goingToCampScraper` in `src/lib/scrapers/`
4. **Availability** – Upserted into `availability` table (location_id, date, status, spots_remaining)
5. **UI** – Side panel loads availability from Supabase when a location is selected

---

## Scraper Architecture

Scrapers implement:

```ts
interface Scraper {
  name: string;
  providers: string[];
  run(location: LocationForScrape): Promise<ScraperResult | null>;
}
```

- `LocationForScrape`: id, name, provider, booking_url, metadata
- `ScraperResult`: locationId, availability[], lastUpdated
- Status values: `available`, `booked`, `locked`, `unknown`, `opening_soon`
