# AlpineOS

Backcountry availability and booking engine for BC, Rockies, and PNW. A "single pane of glass" for finding and securing campsite and hut bookings.

## Setup

1. **Clone and install**

   ```bash
   cd alpineos && npm install
   ```

2. **Environment variables**

   Copy `.env.example` to `.env.local` and fill in:

   - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` – [Mapbox](https://account.mapbox.com/)
   - `NEXT_PUBLIC_SUPABASE_URL` – New Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key

3. **Supabase**

   - Create a new project at [supabase.com](https://supabase.com)
   - Enable PostGIS: Database → Extensions → Enable `postgis`
   - **Fresh setup:** Run `supabase/run_all_migrations.sql` in the SQL Editor (copy-paste entire file)
   - **Existing DB (pre-rec-sites):** Run `supabase/migrations/006_add_rec_sites.sql` to add RSTBC rec sites
   - **Existing DB (wrong coords):** Run `supabase/migrations/007_correct_location_coordinates.sql` to fix pin positions

4. **Run**

   ```bash
   npm run dev
   ```

## Features

- **Discovery map** – Full-screen Mapbox with 3D terrain, OSM hiking trails, location pins
- **Side panel** – Click a pin for calendar availability and deep links to providers
- **Booking Pulse** – `/pulse` dashboard showing what's opening soon (from Supabase `booking_rules`)

## Providers

BC Parks, Parks Canada, ACC huts, BCMC, VOC, RSTBC rec sites, day-use passes, Washington State Parks (via import), RIDB/Recreation.gov.

## Bulk Import (BC & Washington)

To add hundreds of locations from open data sources:

1. **RIDB** (US federal): Sign up at https://ridb.recreation.gov/profile for a free API key
2. Run: `RIDB_API_KEY=yourkey node scripts/import-locations.mjs > supabase/import_bc_wa.sql`
3. Run `supabase/migrations/008_add_wa_state_parks_provider.sql` first (adds WA provider)
4. Run the generated `import_bc_wa.sql` in Supabase SQL Editor

See `docs/DATA_SOURCES.md` for full data source list and expansion options.

## Availability Scraping

To populate campsite availability for bookable locations:

1. **Prerequisites**: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (from Supabase → Settings → API)
2. **RIDB/Recreation.gov**: Works out of the box (campground ID from booking URL)
3. **BC Parks, Parks Canada, Washington** (GoingToCamp): `pip install camply` then `npm run scrape:gtc`
4. **Run scrape**: `npm run scrape` (RIDB + GoingToCamp) or `npm run scrape:ridb` / `npm run scrape:gtc` for one provider

See `docs/BOOKING_METHODS.md` for full details on booking methods and scraper architecture.
