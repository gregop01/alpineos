# Data Sources for BC & Washington Campground Coverage

This document lists data sources to achieve comprehensive coverage of campsites, huts, and rec sites across British Columbia and Washington state.

## Migration Usage

- **006_add_rec_sites.sql**: Run only if you had a DB created *before* rec sites were added to the main seed. If you ran `run_all_migrations.sql` recently, skip 006.
- **007_correct_location_coordinates.sql**: Run to fix pin positions on any existing DB.

---

## BC Sources

### 1. BC Parks (campgrounds, day-use)

- **API**: https://bcparks.api.gov.bc.ca/graphql
- **WFS (polygon boundaries)**: `https://openmaps.gov.bc.ca/geo/pub/WHSE_TANTALIS.TA_PARK_ECORES_PA_SVW/ows` - GetFeature with srsName=EPSG:4326
- **Data**: Provincial parks, ecological reserves, protected areas (PROTECTED_LANDS_NAME); includes Montague Harbour Marine Provincial Park, Garibaldi Park, etc.
- **Data quality**: Ecological reserves are excluded from import (no camping allowed). See `020_remove_bc_parks_ecological_reserves.sql` and `docs/DATA_QUALITY_STRATEGY.md`.
- **License**: Open Government License - BC

### 2. BC Parks / Provincial Parks – ArcGIS

- **URL**: https://catalogue.data.gov.bc.ca/dataset/parks-and-protected-areas
- **ArcGIS REST**: Search for "parks" or "protected areas" in BC Data Catalogue
- **Format**: GeoJSON, KML, WMS

### 3. Coastal BC Campsites (legacy)

- **URL**: https://open.canada.ca/data/en/dataset/1524b282-bf3d-493a-995a-18c73f0d5546
- **Format**: KML - https://openmaps.gov.bc.ca/kml/geo/layers/WHSE_ENVIRONMENTAL_MONITORING.CHRA_CAMPSITES_POINT_loader.kml
- **Caution**: Circa 2004, legacy data, may not be accurate

### 4. RSTBC (Rec Sites and Trails BC)

- **Map**: https://governmentofbc.maps.arcgis.com/apps/webappviewer/...
- **ArcGIS REST** (BC Geographic Warehouse):
  - Recreation Sites Subset (points): `delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_forest_tenure/MapServer/13/query?...&f=geojson`
  - Recreation Polygons (full ~1350+ sites): `MapServer/5/query`
- **Data**: 1,350+ rec sites, FCFS, no reservations

### 5. Parks Canada (BC national parks)

- **Reservations**: https://reservation.pc.gc.ca
- **Open Data GeoJSON**: https://opendata.arcgis.com/datasets/28b55decfac848c782819b1706e58aa1_0.geojson (Facilities - Point, includes Prior Centennial, Gulf Islands, etc.)

---

## Washington Sources

### 1. Washington State Parks – Campsites

- **Portal**: https://geo.wa.gov
- **Dataset**: "PARKS - Campsites" or "wsprc"
- **Format**: ArcGIS REST, GeoJSON, CSV
- **Reservations**: washington.goingtocamp.com

### 2. Recreation.gov / RIDB (US federal)

- **API**: https://ridb.recreation.gov/docs
- **API Key**: Free signup at https://ridb.recreation.gov/profile
- **Coverage**: USFS, NPS, BLM, USACE campgrounds in WA
- **Endpoint**: `/facilities` with state=WA, activity=CAMPING

### 3. Washington State DNR (Dispersed/rec sites)

- **Portal**: https://www.dnr.wa.gov
- **Note**: May have GeoJSON or shapefile downloads

---

## Implementation Plan

1. **Script**: `scripts/import-locations.mjs` fetches from these sources and outputs SQL
2. **Provider mapping**:
   - BC Parks → `bcparks`
   - Parks Canada → `parks_canada`
   - RSTBC → `rstbc`
   - ACC/BCMC/VOC/Spearhead Huts/CVHS → keep manual seed
   - WA State Parks → add provider `wa_state_parks`
   - RIDB → add provider `ridb` or map to existing (e.g. `recreation_gov`)

3. **Schema**: Ensure `locations` provider CHECK includes new providers when adding WA/others

4. **Run**: `node scripts/import-locations.mjs` → outputs `supabase/import_locations.sql`

---

## Google Maps / Scraping

- **Terms**: Google Maps ToS restricts scraping; use official APIs (Places API) with API key
- **Places API**: Can search "campground" by region; costs apply per request
- **Recommendation**: Prefer government open data (free, authoritative) over scraping
