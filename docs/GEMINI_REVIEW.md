# Gemini Location Review — Data Quality & Coordinate Corrections

This workflow uses Gemini to audit location data and correct wrong lat/lon coordinates. Many locations (especially BC Parks, RSTBC) use polygon centroids, which can be far from the actual campground.

## Prerequisites

- `.env.local` (or `.env`) with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - `GEMINI_API_KEY` (get at [aistudio.google.com/apikey](https://aistudio.google.com/apikey))

## Steps

### 1. Export locations

```bash
npm run export:gemini
```

Creates `scripts/exports/locations-export.json`. If a previous export exists, it is backed up to `locations-export-previous.json` so you always have before/after reference.

### 2. Review with Gemini

```bash
npm run review:gemini
```

Sends data to Gemini in batches with a clear **data quality** prompt:
1. **Correct coordinates** — fix wrong lat/lon (polygon centroids, etc.)
2. **Identify missing sites** — campgrounds (Helm Creek, Russet Lake, Singing Pass), marine campsites (water-access, kayak sites), huts (Beekers Hut, VOC, BCMC, ACC, Spearhead, etc.), commercial lodges — any overnight accommodation not in the input

Creates `scripts/exports/gemini-corrections.json` with:
- `corrections` — coordinate fixes with `original_lat`, `original_lon` for audit
- `additions` — missing sites to add (name, provider, lat, lon, type, reason) — campgrounds, marine sites, huts, lodges
- `source_export` and `reviewed_at` timestamp

### 3. Generate migration

```bash
node scripts/apply-gemini-corrections.mjs > supabase/migrations/026_correct_coordinates_from_gemini.sql
```

**Important:** Review the generated SQL before applying. Gemini can make mistakes.

### 4. Apply migration

Run the migration in Supabase SQL Editor. See [020_remove_bc_parks_ecological_reserves.sql](../supabase/migrations/020_remove_bc_parks_ecological_reserves.sql) for the file path.

## Providers reviewed

- **bcparks** — Polygon centroids often wrong; campgrounds are usually at trailheads or specific areas
- **rstbc** — Rec site polygon centroids can be off
- **parks_canada** — Generally has point data, but some may need correction

## Output format

`gemini-corrections.json`:

```json
{
  "corrections": [
    {
      "id": "uuid",
      "name": "Garibaldi Lake",
      "provider": "bcparks",
      "original_lat": 49.92,
      "original_lon": -122.95,
      "lat": 49.94,
      "lon": -122.97,
      "reason": "Centroid of Garibaldi Park; actual campground at Rubble Creek trailhead"
    }
  ],
  "additions": [
    {
      "name": "Russet Lake",
      "provider": "bcparks",
      "lat": 50.05,
      "lon": -122.85,
      "type": "campsite",
      "reason": "Backcountry campground in Garibaldi Park, Singing Pass trail"
    }
  ],
  "source_export": "locations-export.json",
  "reviewed_at": "2025-02-16T..."
}
```

The migration SQL generates:
- **UPDATE** for each correction (with before/after in comments and `coord_original_*` in metadata)
- **INSERT** for each addition (skips if name+provider already exists)
