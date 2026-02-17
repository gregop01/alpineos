/**
 * BC Open Data - fetch campsites, rec sites, and huts from government sources.
 * Used for Mapbox overlay layer to show comprehensive coverage.
 */

export interface BCFeature {
  type: 'Feature';
  geometry: GeoJSON.Point | GeoJSON.Polygon | GeoJSON.MultiPolygon;
  properties: {
    name?: string;
    id?: string | number;
    type?: string;
    [key: string]: unknown;
  };
}

export interface BCGeoJSON {
  type: 'FeatureCollection';
  features: BCFeature[];
}

const BC_REC_SITES_URL =
  'https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_forest_tenure/MapServer/13/query';
const BC_REC_POLYGONS_URL =
  'https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_forest_tenure/MapServer/5/query';
const BC_COASTAL_CAMPSITES_KML =
  'https://openmaps.gov.bc.ca/kml/geo/layers/WHSE_ENVIRONMENTAL_MONITORING.CHRA_CAMPSITES_POINT_loader.kml';
const BC_PARKS_WFS =
  'https://openmaps.gov.bc.ca/geo/pub/WHSE_TANTALIS.TA_PARK_ECORES_PA_SVW/ows';

// Parks Canada Facilities (includes campgrounds like Prior Centennial, Gulf Islands)
const PARKS_CANADA_FACILITIES_URL =
  'https://opendata.arcgis.com/datasets/28b55decfac848c782819b1706e58aa1_0.geojson';

const BC_BBOX = { south: 48.2, north: 60, west: -139, east: -114 };
const MAX_RECORDS_PER_REQUEST = 1000;

async function fetchArcGISGeoJSON(
  baseUrl: string,
  layerLabel: string
): Promise<BCGeoJSON> {
  const allFeatures: BCFeature[] = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      returnGeometry: 'true',
      outSR: '4326',
      f: 'geojson',
      resultRecordCount: String(MAX_RECORDS_PER_REQUEST),
      resultOffset: String(offset),
    });
    const url = `${baseUrl}?${params}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as BCGeoJSON;
      const features = data.features ?? [];
      if (features.length === 0) break;
      allFeatures.push(...features);
      if (features.length < MAX_RECORDS_PER_REQUEST) break;
      offset += features.length;
    } catch (e) {
      console.warn(`${layerLabel} fetch failed:`, e);
      break;
    }
  }

  return { type: 'FeatureCollection', features: allFeatures };
}

/**
 * Polygon centroid (rough) - for converting recreation polygons to points
 */
function polygonCentroid(coords: number[][][]): [number, number] | null {
  const ring = coords[0];
  if (!ring || ring.length < 3) return null;
  let sumX = 0;
  let sumY = 0;
  let n = 0;
  for (const p of ring) {
    sumX += p[0];
    sumY += p[1];
    n++;
  }
  return n > 0 ? [sumX / n, sumY / n] : null;
}

/**
 * Convert polygon features to point features (for display as markers)
 */
function getPolygonCoords(geom: GeoJSON.Polygon | GeoJSON.MultiPolygon): number[][][] | null {
  if (geom.type === 'Polygon') return geom.coordinates;
  if (geom.type === 'MultiPolygon') return geom.coordinates[0] ?? null;
  return null;
}

function polygonsToPoints(data: BCGeoJSON): BCGeoJSON {
  const pointFeatures: BCFeature[] = [];
  for (const f of data.features) {
    if (f.geometry.type === 'Point') {
      pointFeatures.push(f);
    } else if ((f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon') && f.geometry.coordinates) {
      const coords = getPolygonCoords(f.geometry);
      const centroid = coords ? polygonCentroid(coords) : null;
      if (centroid) {
        pointFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: centroid },
          properties: {
            ...f.properties,
            name: (f.properties?.PROJECT_NAME || f.properties?.REC_AREA_NAME || f.properties?.name || 'Rec Site')
              .toString()
              .trim(),
            type: 'rec_site',
          },
        });
      }
    }
  }
  return { type: 'FeatureCollection', features: pointFeatures };
}

/** Exclude RSTBC sites that are day use, trailheads, or parking - only keep campsites */
function isRSTBCCampsite(name: string, numCampSites?: number | null): boolean {
  const n = name.toLowerCase();
  if (n.includes('trailhead') || n.includes('trail head')) return false;
  if (n.includes('day use') || n.includes('day-use')) return false;
  if (
    (n.includes('parking lot') || n.includes('parking area') || n.includes(' parking ')) &&
    !n.includes('cabin') &&
    !n.includes('camp')
  )
    return false;
  if (n.includes('trail (parking') || n.includes('trail parking')) return false;
  if (n.includes('recreation area & parking') || n.includes('recreation area and parking')) return false;
  if (n.includes('snowmobile') && n.includes('parking')) return false;
  if (n.includes('ski parking') || n.includes('cross country ski parking')) return false;
  if (n.includes('trail hd')) return false;
  // Sites with 0 camp sites are typically day-use (picnic, etc.)
  if (numCampSites !== undefined && numCampSites !== null && numCampSites === 0) return false;
  return true;
}

/**
 * Fetch BC Recreation Sites Subset (point layer) - only campsites, excludes day use/trailheads
 */
export async function fetchBCRecSites(): Promise<BCGeoJSON> {
  const data = await fetchArcGISGeoJSON(BC_REC_SITES_URL, 'BC Rec Sites');
  const name = (f: BCFeature) =>
    (f.properties?.PROJECT_NAME || f.properties?.REC_SITE_NAME || f.properties?.SITE_LOCATION || f.properties?.name || '')
      .toString()
      .trim();
  const numCamp = (f: BCFeature) => f.properties?.NUM_CAMP_SITES as number | undefined;
  const filtered = data.features.filter((f) => isRSTBCCampsite(name(f), numCamp(f)));
  return { type: 'FeatureCollection', features: filtered };
}

/**
 * Fetch BC Recreation Polygons (full ~1350+ sites) and convert to points - only campsites
 */
export async function fetchBCRecPolygons(): Promise<BCGeoJSON> {
  const data = await fetchArcGISGeoJSON(BC_REC_POLYGONS_URL, 'BC Rec Polygons');
  const name = (f: BCFeature) =>
    (f.properties?.PROJECT_NAME || f.properties?.REC_AREA_NAME || f.properties?.SITE_LOCATION || f.properties?.name || '')
      .toString()
      .trim();
  const definedCampsites = (f: BCFeature) => f.properties?.DEFINED_CAMPSITES as number | undefined;
  const filtered = data.features.filter((f) => isRSTBCCampsite(name(f), definedCampsites(f)));
  return polygonsToPoints({ type: 'FeatureCollection', features: filtered });
}

/**
 * Fetch BC Parks via WFS (provincial parks, ecological reserves, protected areas - Montague Harbour, Garibaldi, etc.)
 */
async function fetchBCParksWFS(): Promise<BCGeoJSON> {
  const allFeatures: BCFeature[] = [];
  const pageSize = 500;
  let startIndex = 0;

  while (true) {
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: 'pub:WHSE_TANTALIS.TA_PARK_ECORES_PA_SVW',
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
      count: String(pageSize),
    });
    if (startIndex > 0) params.set('startIndex', String(startIndex));
    try {
      const res = await fetch(`${BC_PARKS_WFS}?${params}`);
      if (!res.ok) break;
      const data = (await res.json()) as BCGeoJSON;
      const features = data.features ?? [];
      if (features.length === 0) break;
      for (const f of features) {
        if (f.geometry?.type !== 'Polygon' && f.geometry?.type !== 'MultiPolygon') continue;
        const coords = getPolygonCoords(f.geometry);
        const centroid = coords ? polygonCentroid(coords) : null;
        if (!centroid) continue;
        const name =
          (f.properties as Record<string, unknown>)?.PROTECTED_LANDS_NAME ||
          (f.properties as Record<string, unknown>)?.PARK_NAME ||
          'BC Park';
        const nameStr = String(name).trim();
        const designation = ((f.properties as Record<string, unknown>)?.PROTECTED_LANDS_DESIGNATION || '').toString().toLowerCase();
        const isEcologicalReserve =
          designation.includes('ecological reserve') || nameStr.toUpperCase().includes('ECOLOGICAL RESERVE');
        if (isEcologicalReserve) continue; // Ecological reserves do not allow camping
        allFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: centroid },
          properties: {
            ...f.properties,
            name: nameStr,
            type: 'campsite',
            source: 'bcparks',
          },
        });
      }
      if (features.length < pageSize) break;
      startIndex += pageSize;
    } catch {
      break;
    }
  }

  return { type: 'FeatureCollection', features: allFeatures };
}

/**
 * Fetch BC Parks (provincial parks, ecological reserves, protected areas)
 */
export async function fetchBCParks(): Promise<BCGeoJSON> {
  return fetchBCParksWFS();
}

/**
 * Fetch BC Coastal Campsites from legacy KML
 */
export async function fetchBCCoastalCampsites(): Promise<BCGeoJSON> {
  try {
    const res = await fetch(BC_COASTAL_CAMPSITES_KML);
    if (!res.ok) return { type: 'FeatureCollection', features: [] };
    const text = await res.text();
    return parseKMLToGeoJSON(text);
  } catch {
    return { type: 'FeatureCollection', features: [] };
  }
}

/**
 * Parse KML Placemark to GeoJSON Point (basic parser)
 */
function parseKMLToGeoJSON(kml: string): BCGeoJSON {
  const features: BCFeature[] = [];
  const placemarkRegex = /<Placemark[^>]*>([\s\S]*?)<\/Placemark>/gi;
  const coordRegex = /<coordinates>([^<]+)<\/coordinates>/i;
  const nameRegex = /<name>([^<]*)<\/name>/i;

  let match;
  while ((match = placemarkRegex.exec(kml)) !== null) {
    const block = match[1];
    const coordMatch = block.match(coordRegex);
    const nameMatch = block.match(nameRegex);
    if (!coordMatch) continue;
    const [lonStr, latStr] = coordMatch[1].trim().split(',');
    const lon = parseFloat(lonStr);
    const lat = parseFloat(latStr);
    if (isNaN(lon) || isNaN(lat)) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: {
        name: nameMatch?.[1]?.trim() || 'Coastal Campsite',
        type: 'campsite',
      },
    });
  }

  return { type: 'FeatureCollection', features };
}

// Parks Canada: only camping (places to sleep) and day-use areas that require permits.
// Excludes trailheads, visitor centres, picnic areas without permits, etc.
const PC_CAMPING_TYPES = ['camping', 'campground'];
const PC_EXCLUDE_TYPES = ['trailhead', 'visitor centre', 'compound', 'operations station', 'park gate', 'warden', 'patrol cabin', 'offices'];
const PC_DAY_USE_PERMIT_NAMES = ['lake louise', 'moraine lake', "lake o'hara", 'johnston canyon'];

function isParksCanadaPlaceToSleep(ft: string | undefined): boolean {
  if (!ft) return false;
  const t = ft.toLowerCase();
  if (PC_EXCLUDE_TYPES.some((x) => t.includes(x))) return false;
  return PC_CAMPING_TYPES.some((x) => t.includes(x));
}

function isParksCanadaDayUseWithPermit(ft: string | undefined, name: string | undefined): boolean {
  if (!ft) return false;
  const t = ft.toLowerCase();
  const n = (name || '').toLowerCase();
  const isDayUse = t.includes('day-use') || t.includes('pique-nique') || t.includes('picnic');
  if (!isDayUse) return false;
  return PC_DAY_USE_PERMIT_NAMES.some((sub) => n.includes(sub));
}

/**
 * Fetch Parks Canada facilities - only places to sleep + day-use areas that require permits
 */
export async function fetchParksCanadaBC(): Promise<BCGeoJSON> {
  try {
    const res = await fetch(PARKS_CANADA_FACILITIES_URL);
    if (!res.ok) return { type: 'FeatureCollection', features: [] };
    const data = (await res.json()) as BCGeoJSON;
    const inBC = (data.features ?? []).filter((f) => {
      if (f.geometry?.type !== 'Point') return false;
      const [lon, lat] = f.geometry.coordinates;
      return lon >= BC_BBOX.west && lon <= BC_BBOX.east && lat >= BC_BBOX.south && lat <= BC_BBOX.north;
    });
    const ft = (f: BCFeature) => (f.properties?.Facility_Type_Installation as string) || '';
    const name = (f: BCFeature) =>
      (f.properties?.Name_e ||
        f.properties?.Label_e ||
        f.properties?.name ||
        f.properties?.NAME_ENG ||
        f.properties?.NAME_FRA ||
        'Parks Canada Site') as string;
    const filtered = inBC.filter(
      (f) => isParksCanadaPlaceToSleep(ft(f)) || isParksCanadaDayUseWithPermit(ft(f), name(f))
    );
    return {
      type: 'FeatureCollection',
      features: filtered.map((f) => {
        const props = f.properties ?? {};
        const facilityType = ft(f);
        const isDayUsePermit = isParksCanadaDayUseWithPermit(facilityType, name(f));
        const nameStr = String(
          props.Name_e ?? props.Label_e ?? props.name ?? props.NAME_ENG ?? props.NAME_FRA ?? 'Parks Canada Site'
        ).trim();
        return {
          ...f,
          properties: {
            ...props,
            source: 'parks_canada',
            type: isDayUsePermit ? 'day_use_pass' : 'campsite',
            requires_permit: isDayUsePermit || undefined,
            name: nameStr,
          },
        };
      }),
    };
  } catch {
    return { type: 'FeatureCollection', features: [] };
  }
}

/**
 * Fetch all BC open data sources and merge into one FeatureCollection
 */
export async function fetchAllBCSites(): Promise<BCGeoJSON> {
  const [recSites, recPolygons, bcParks, coastal, parksCanada] = await Promise.all([
    fetchBCRecSites(),
    fetchBCRecPolygons(),
    fetchBCParks(),
    fetchBCCoastalCampsites(),
    fetchParksCanadaBC(),
  ]);

  const seen = new Set<string>();
  const merged: BCFeature[] = [];

  const addUnique = (f: BCFeature, label: string) => {
    if (f.geometry.type !== 'Point') return;
    const [lon, lat] = f.geometry.coordinates;
    const key = `${lon.toFixed(5)},${lat.toFixed(5)}`;
    if (seen.has(key)) return;
    seen.add(key);
    const name =
      f.properties?.name ||
      f.properties?.PROJECT_NAME ||
      f.properties?.REC_SITE_NAME ||
      f.properties?.SITE_LOCATION ||
      (label === 'parks_canada' ? (f.properties?.Name_e || f.properties?.Label_e || 'Parks Canada Site') : 'Rec Site');
    // Per-source camping metadata for badges (Book, Walk-in, Wilderness)
    const props = f.properties as Record<string, unknown> | undefined;
    let campingMeta: { requires_booking?: boolean; camping_type?: string } = {};
    let booking_url: string | undefined;
    if (label === 'rstbc' || label === 'bc_coastal') {
      campingMeta = { requires_booking: false, camping_type: 'first_come_first_serve' };
      const forestFileId = props?.FOREST_FILE_ID as string | undefined;
      if (forestFileId && typeof forestFileId === 'string' && forestFileId.trim()) {
        booking_url = `https://www.sitesandtrailsbc.ca/resource/${forestFileId.trim()}`;
      }
    } else if (label === 'parks_canada') {
      campingMeta = { requires_booking: true, camping_type: 'reservation' };
    } else if (label === 'bcparks') {
      const designation = (props?.PROTECTED_LANDS_DESIGNATION as string) || '';
      const nameStr = String(name ?? '').toUpperCase();
      if (
        designation.toLowerCase().includes('ecological reserve') ||
        nameStr.includes('ECOLOGICAL RESERVE')
      ) {
        campingMeta = { requires_booking: false, camping_type: 'wilderness' };
      } else {
        // Non-ecological BC Parks: reservable per migration 025 - show booking calendar
        campingMeta = { requires_booking: true, camping_type: 'reservation' };
        booking_url = 'https://camping.bcparks.ca/';
      }
    }
    merged.push({
      ...f,
      properties: {
        ...f.properties,
        source: label,
        name: typeof name === 'string' ? name.trim() : String(name ?? 'Site').trim(),
        ...campingMeta,
        ...(booking_url && { booking_url }),
      },
    });
  };

  for (const f of recSites.features) {
    addUnique(f, 'rstbc');
  }
  for (const f of recPolygons.features) {
    addUnique(f, 'rstbc');
  }
  for (const f of bcParks.features) {
    addUnique(f, 'bcparks');
  }
  for (const f of coastal.features) {
    addUnique(f, 'bc_coastal');
  }
  for (const f of parksCanada.features) {
    addUnique(f, 'parks_canada');
  }

  return { type: 'FeatureCollection', features: merged };
}
