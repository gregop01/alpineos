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
   - Run `supabase/run_all_migrations.sql` in the SQL Editor (copy-paste entire file)

4. **Run**

   ```bash
   npm run dev
   ```

## Features

- **Discovery map** – Full-screen Mapbox with 3D terrain, OSM hiking trails, location pins
- **Side panel** – Click a pin for calendar availability and deep links to providers
- **Booking Pulse** – `/pulse` dashboard showing what's opening soon (from Supabase `booking_rules`)

## Providers

BC Parks, Parks Canada, ACC huts, BCMC, VOC, day-use passes (Joffre, Golden Ears), and more.
