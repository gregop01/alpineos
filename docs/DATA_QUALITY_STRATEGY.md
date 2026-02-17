# BC Parks Data Quality Improvement Strategy

This document outlines strategies to improve BC Parks data quality: missing campsites (Apodaca, Centennial, etc.), incorrect locations, non-campable places (Bowen Island Ecological Reserve), and backcountry parks you want to show as zones.

---

## Root Cause Analysis

### Current Data Source: WFS `TA_PARK_ECORES_PA_SVW`

The import uses **WFS polygon boundaries** of all protected lands:
- Provincial parks, **ecological reserves**, protected areas
- **Problem**: This dataset includes everything—places where camping is **prohibited** (ecological reserves) and places with no campgrounds
- **Location**: Uses polygon *centroid* → often wrong (center of huge park, not the actual campground)
- **Missing**: Doesn't distinguish frontcountry campgrounds vs backcountry vs no-camping

### GoingToCamp (camping.bcparks.ca) API

- **Contains**: ~110+ reservable BC Parks (frontcountry + some backcountry like Bugaboo, Cape Scott)
- **Does NOT contain**: FCFS campsites (Apodaca marine, many marine parks), day-use only parks
- **Coordinates**: API returns empty `gpsCoordinates` — no lat/lon from this source

### Specific Cases

| Location | Issue | Source |
|----------|-------|--------|
| **Apodaca Marine** | 4 FCFS tent pads, water-access only. Not in GoingToCamp (no reservations). May be in WFS as "Apodaca Park" but likely deduped or wrong centroid. | WFS (if present), or manual add |
| **Prior Centennial** | Parks Canada (Gulf Islands), 17 sites on North Pender Island. **Not in** Parks Canada Facilities GeoJSON → added via `022_add_prior_centennial.sql`. | Manual migration |
| **Bowen Island Ecological Reserve** | **No camping allowed** — ecological reserves prohibit camping. Currently imported as "campsite". | Remove |
| **Garibaldi, Joffre, etc.** | Backcountry parks with camping — you want these as **zones**, not removed | Reclassify |

---

## Strategy Options

### Option A: Update the Data Source (Recommended)

**Best long-term approach** — fix the pipeline so future imports are clean.

#### 1. Remove Ecological Reserves from BC Parks Import

Ecological reserves **do not allow camping**. Add a filter in `import-locations.mjs` and `bc-open-data.ts`:

```javascript
// In fetchBCParksWFS - skip entirely
const isEcologicalReserve = designation.includes('ecological reserve') 
  || name.toUpperCase().includes('ECOLOGICAL RESERVE');
if (isEcologicalReserve) continue;  // Don't add
```

**Or** run a one-time migration to delete existing ecological reserves:
- See `020_remove_bc_parks_ecological_reserves.sql` (create this)

#### 2. Use GoingToCamp as Canonical List for BC Parks

- Fetch `camping.bcparks.ca/api/resourceLocation` → get authoritative list of BC Parks with camping
- **Merge strategy**: Keep WFS only for parks that match GTC names (fuzzy match), OR that are known backcountry parks (Garibaldi, Joffre, Cape Scott, etc.)
- WFS provides polygon centroid for coords (imperfect but better than nothing); GTC provides the *list* of real campgrounds

#### 3. Add Missing FCFS / Marine Campsites Manually

Apodaca and similar FCFS marine campgrounds aren't in GoingToCamp. Options:
- **Manual migration** for known FCFS marine parks (Apodaca, parts of Discovery Islands, etc.)
- **BC Coastal KML** (legacy 2004 data) — you already import this; may have some marine sites but is outdated
- **Community-sourced list** — maintain a JSON/CSV of FCFS BC Parks with verified coordinates

#### 4. Add a "Backcountry Zone" Type

To show parks like Garibaldi as zones (polygons) instead of points:

**Schema change:**
- Add `type = 'backcountry_zone'` to the locations CHECK
- Store polygon in `metadata` or add optional `zone_geometry` column (PostGIS POLYGON)
- Map: render zones as shaded polygons, distinct from point pins

**Simpler alternative** (no schema change):
- Add `metadata.camping_type: 'backcountry_zone'` for parks that are backcountry-only
- Map: style these pins differently (e.g. different icon, label "Backcountry—camping within park")
- Keep point location as park centroid or trailhead

---

### Option B: Gemini Enrichment Pipeline

**One-time or periodic cleanup** — extract, correct, re-import.

1. **Export** locations to JSON (name, provider, lat, lon, type, metadata)
2. **Prompt Gemini** with structured output:
   - "For each BC Parks location: (a) Is camping allowed? Yes/No (b) Type: frontcountry_campsite | backcountry_zone | ecological_reserve_no_camping | other (c) If coords seem wrong (e.g. marine park on land), suggest correction"
3. **Generate migration** from Gemini output:
   - DELETE ecological reserves
   - UPDATE coordinates where Gemini suggests fixes
   - ADD missing (e.g. Apodaca) from Gemini suggestions
4. **Hand-audit** before applying — LLMs can hallucinate

**Pros**: Catches edge cases, can fix names/coordinates in bulk  
**Cons**: Manual review needed, not self-updating, token cost

---

### Option C: Hybrid (Recommended)

1. **Data source** (Option A): Filter ecological reserves, use GTC to validate BC Parks list
2. **Migration**: One-time delete of ecological reserves (`020_remove_bc_parks_ecological_reserves.sql`)
3. **Manual adds**: Apodaca and other known FCFS marine parks via migration
4. **Backcountry**: Add `backcountry_zone` type or metadata flag, style differently on map
5. **Optional**: Run Gemini once on existing data to suggest corrections, then hand-apply

---

## Implementation Checklist

- [x] Create migration `020_remove_bc_parks_ecological_reserves.sql` to DELETE ecological reserves
- [x] Update `import-locations.mjs` to exclude ecological reserves from BC Parks fetch
- [x] Add Apodaca Marine Park (and other FCFS marine) via manual migration with verified coords
- [x] Add Prior Centennial Campground (Parks Canada Gulf Islands) via `022_add_prior_centennial.sql`
- [ ] Add `backcountry_zone` type or `metadata.camping_type` for backcountry-only parks
- [ ] Update map UI to render backcountry zones differently (icon, label, or polygon if supported)
- [ ] (Optional) Integrate GoingToCamp resourceLocation as canonical BC Parks list; merge with WFS for coords
- [ ] (Optional) Build Gemini enrichment script for one-time cleanup
- [ ] Update `DATA_SOURCES.md` with data quality notes

---

## Coordinates for Manual Adds

| Location | Approx. Coordinates | Notes |
|----------|---------------------|-------|
| Apodaca Marine Park | 49.365, -123.35 (east Bowen Island) | 4 FCFS tent pads, water-access only; verify on bcparks.ca |
| Prior Centennial | 48.78, -123.28 (North Pender Island) | 17 sites, Parks Canada, reservable; not in Facilities GeoJSON |

---

## References

- [BC Parks Find a Park](https://bcparks.ca/find-a-park/a-z-list/)
- [GoingToCamp resourceLocation API](https://camping.bcparks.ca/api/resourceLocation)
- [BC Parks WFS](https://openmaps.gov.bc.ca/geo/pub/WHSE_TANTALIS.TA_PARK_ECORES_PA_SVW/ows)
- Ecological reserves: [BC Parks policy](https://bcparks.ca/ecological-reserves/) — typically no camping
