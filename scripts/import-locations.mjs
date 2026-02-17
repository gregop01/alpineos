#!/usr/bin/env node
/**
 * Import locations from BC & WA data sources.
 * Outputs SQL to stdout. Run: node scripts/import-locations.mjs > supabase/import_bc_wa.sql
 * (Do not use 2>&1 - progress logs go to stderr and would corrupt the SQL file.)
 *
 * BC: RSTBC rec sites (~1350+), BC Coastal campsites KML, Parks Canada facilities
 * WA: State Parks, RIDB federal (optional, requires RIDB_API_KEY)
 */

const RIDB_API_KEY = process.env.RIDB_API_KEY;
const RIDB_BASE = 'https://ridb.recreation.gov/api/v1';

const WA_PARKS_URL =
  'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Parks_and_Open_Space/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson';

const BC_REC_SITES_URL =
  'https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_forest_tenure/MapServer/13/query';
const BC_REC_POLYGONS_URL =
  'https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_forest_tenure/MapServer/5/query';
const BC_COASTAL_KML = 'https://openmaps.gov.bc.ca/kml/geo/layers/WHSE_ENVIRONMENTAL_MONITORING.CHRA_CAMPSITES_POINT_loader.kml';
const BC_PARKS_WFS = 'https://openmaps.gov.bc.ca/geo/pub/WHSE_TANTALIS.TA_PARK_ECORES_PA_SVW/ows';
const PARKS_CANADA_GEOJSON = 'https://opendata.arcgis.com/datasets/28b55decfac848c782819b1706e58aa1_0.geojson';

const BC_BBOX = { south: 48.2, north: 60, west: -139, east: -114 };
const MAX_RECORDS = 1000;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  return res.json();
}

function escapeSql(str) {
  if (str == null) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function toPoint(lon, lat) {
  if (lon == null || lat == null || isNaN(lon) || isNaN(lat)) return null;
  return `ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography`;
}

// RIDB: Recreation.gov facilities in Washington
async function fetchRidbWashington() {
  if (!RIDB_API_KEY) return [];
  const out = [];
  let offset = 0;
  const limit = 50;
  while (true) {
    const url = `${RIDB_BASE}/facilities?state=WA&activity=CAMPING&limit=${limit}&offset=${offset}&apikey=${RIDB_API_KEY}`;
    const data = await fetchJson(url);
    const items = data.RECDATA || [];
    if (items.length === 0) break;
    for (const f of items) {
      const lon = f.FacilityLongitude;
      const lat = f.FacilityLatitude;
      const pt = toPoint(lon, lat);
      if (!pt) continue;
      const name = (f.FacilityName || '').replace(/'/g, "''");
      const url2 = f.URL ? `https://www.recreation.gov${f.URL}` : null;
      out.push({
        name,
        provider: 'ridb',
        type: 'campsite',
        lon,
        lat,
        pt,
        capacity_total: null,
        booking_url: url2,
        metadata: { requires_booking: true, camping_type: 'reservation' },
      });
    }
    offset += limit;
    if (items.length < limit) break;
  }
  return out;
}

async function fetchArcGISPaginated(baseUrl, label) {
  const out = [];
  let offset = 0;
  while (true) {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      returnGeometry: 'true',
      outSR: '4326',
      f: 'geojson',
      resultRecordCount: String(MAX_RECORDS),
      resultOffset: String(offset),
    });
    const url = `${baseUrl}?${params}`;
    try {
      const data = await fetchJson(url);
      const features = data.features || [];
      if (features.length === 0) break;
      out.push(...features);
      if (features.length < MAX_RECORDS) break;
      offset += features.length;
    } catch (e) {
      console.error(`${label} fetch failed:`, e.message);
      break;
    }
  }
  return out;
}

function polygonCentroid(coords) {
  const ring = coords[0];
  if (!ring || ring.length < 3) return null;
  let sumX = 0, sumY = 0, n = 0;
  for (const p of ring) {
    sumX += p[0];
    sumY += p[1];
    n++;
  }
  return n > 0 ? [sumX / n, sumY / n] : null;
}

// Exclude RSTBC sites that are day use, trailheads, or parking - only keep campsites
function isRSTBCCampsite(name, numCampSites) {
  const n = String(name || '').toLowerCase();
  if (n.includes('trailhead') || n.includes('trail head')) return false;
  if (n.includes('day use') || n.includes('day-use')) return false;
  if ((n.includes('parking lot') || n.includes('parking area') || n.includes(' parking ')) && !n.includes('cabin') && !n.includes('camp')) return false;
  if (n.includes('trail (parking') || n.includes('trail parking')) return false;
  if (n.includes('recreation area & parking') || n.includes('recreation area and parking')) return false;
  if (n.includes('snowmobile') && n.includes('parking')) return false;
  if (n.includes('ski parking') || n.includes('cross country ski parking')) return false;
  if (n.includes('trail hd')) return false;
  if (numCampSites !== undefined && numCampSites !== null && numCampSites === 0) return false;
  return true;
}

async function fetchBCRecSites() {
  const features = await fetchArcGISPaginated(BC_REC_SITES_URL, 'BC Rec Sites');
  const meta = { requires_booking: false, camping_type: 'first_come_first_serve' };
  return features
    .filter((f) => f.geometry?.type === 'Point' && f.geometry.coordinates)
    .filter((f) => {
      const name = (f.properties?.PROJECT_NAME || f.properties?.REC_SITE_NAME || f.properties?.SITE_LOCATION || f.properties?.name || 'Rec Site').trim();
      const numCamp = f.properties?.NUM_CAMP_SITES;
      return isRSTBCCampsite(name, numCamp);
    })
    .map((f) => {
      const numCamp = f.properties?.NUM_CAMP_SITES;
      const capacity = numCamp != null && Number.isInteger(numCamp) && numCamp > 0 ? numCamp : null;
      return {
        lon: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        name: (f.properties?.PROJECT_NAME || f.properties?.REC_SITE_NAME || f.properties?.SITE_LOCATION || f.properties?.name || 'Rec Site').trim(),
        provider: 'rstbc',
        type: 'rec_site',
        capacity_total: capacity,
        metadata: meta,
      };
    });
}

async function fetchBCRecPolygons() {
  const features = await fetchArcGISPaginated(BC_REC_POLYGONS_URL, 'BC Rec Polygons');
  const meta = { requires_booking: false, camping_type: 'first_come_first_serve' };
  const out = [];
  for (const f of features) {
    const name = (f.properties?.PROJECT_NAME || f.properties?.REC_AREA_NAME || f.properties?.SITE_LOCATION || f.properties?.name || 'Rec Site').trim();
    const defined = f.properties?.DEFINED_CAMPSITES;
    if (!isRSTBCCampsite(name, defined)) continue;
    let coords = null;
    if (f.geometry?.type === 'Polygon') coords = f.geometry.coordinates;
    else if (f.geometry?.type === 'MultiPolygon') coords = f.geometry.coordinates?.[0];
    const centroid = coords ? polygonCentroid(coords) : null;
    if (centroid) {
      const capacity = defined != null && Number.isInteger(defined) && defined > 0 ? defined : null;
      out.push({
        lon: centroid[0],
        lat: centroid[1],
        name,
        provider: 'rstbc',
        type: 'rec_site',
        capacity_total: capacity,
        metadata: meta,
      });
    }
  }
  return out;
}

async function fetchBCParksWFS() {
  const out = [];
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
      const data = await res.json();
      const features = data.features || [];
      if (features.length === 0) break;
      for (const f of features) {
        if (f.geometry?.type !== 'Polygon' && f.geometry?.type !== 'MultiPolygon') continue;
        const coords = f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates?.[0];
        if (!coords?.[0]?.length) continue;
        const ring = coords[0];
        let sumX = 0, sumY = 0, n = 0;
        for (const p of ring) {
          sumX += p[0];
          sumY += p[1];
          n++;
        }
        if (n < 3) continue;
        const lon = sumX / n;
        const lat = sumY / n;
        const name = (f.properties?.PROTECTED_LANDS_NAME || f.properties?.PARK_NAME || 'BC Park').trim().replace(/'/g, "''");
        const designation = (f.properties?.PROTECTED_LANDS_DESIGNATION || '').toString().toLowerCase();
        const isEcologicalReserve = designation.includes('ecological reserve') || name.toUpperCase().includes('ECOLOGICAL RESERVE');
        if (isEcologicalReserve) continue; // Ecological reserves do not allow camping - skip
        out.push({ lon, lat, name, provider: 'bcparks', type: 'campsite', metadata: undefined });
      }
      if (features.length < pageSize) break;
      startIndex += pageSize;
    } catch (e) {
      console.error('BC Parks WFS fetch failed:', e.message);
      break;
    }
  }
  return out;
}

async function fetchBCCoastalKML() {
  try {
    const res = await fetch(BC_COASTAL_KML);
    if (!res.ok) return [];
    const text = await res.text();
    const out = [];
    const re = /<Placemark[^>]*>([\s\S]*?)<\/Placemark>/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      const block = m[1];
      const coordMatch = block.match(/<coordinates>([^<]+)<\/coordinates>/i);
      const nameMatch = block.match(/<name>([^<]*)<\/name>/i);
      if (!coordMatch) continue;
      const [lonStr, latStr] = coordMatch[1].trim().split(',');
      const lon = parseFloat(lonStr);
      const lat = parseFloat(latStr);
      if (isNaN(lon) || isNaN(lat)) continue;
      out.push({
        lon,
        lat,
        name: nameMatch?.[1]?.trim() || 'Coastal Campsite',
        provider: 'bc_coastal',
        type: 'campsite',
        metadata: { requires_booking: false, camping_type: 'first_come_first_serve' },
      });
    }
    return out;
  } catch (e) {
    console.error('BC Coastal KML fetch failed:', e.message);
    return [];
  }
}

// Parks Canada: only camping (places to sleep) and day-use areas that require permits.
// Excludes trailheads, visitor centres, picnic areas without permits, etc.
const PC_CAMPING_TYPES = ['camping', 'campground'];
const PC_EXCLUDE_TYPES = ['trailhead', 'visitor centre', 'compound', 'operations station', 'park gate', 'warden', 'patrol cabin', 'offices'];
const PC_DAY_USE_PERMIT_NAMES = ['lake louise', 'moraine lake', "lake o'hara", 'johnston canyon'];

function isParksCanadaPlaceToSleep(ft) {
  if (!ft) return false;
  const t = ft.toLowerCase();
  if (PC_EXCLUDE_TYPES.some((x) => t.includes(x))) return false;
  return PC_CAMPING_TYPES.some((x) => t.includes(x));
}

function isParksCanadaDayUseWithPermit(ft, name) {
  if (!ft) return false;
  const t = ft.toLowerCase();
  const n = (name || '').toLowerCase();
  const isDayUse = t.includes('day-use') || t.includes('pique-nique') || t.includes('picnic');
  if (!isDayUse) return false;
  return PC_DAY_USE_PERMIT_NAMES.some((sub) => n.includes(sub));
}

async function fetchParksCanadaBC() {
  try {
    const data = await fetchJson(PARKS_CANADA_GEOJSON);
    const out = [];
    for (const f of data.features || []) {
      if (f.geometry?.type !== 'Point') continue;
      const [lon, lat] = f.geometry.coordinates;
      if (lon < BC_BBOX.west || lon > BC_BBOX.east || lat < BC_BBOX.south || lat > BC_BBOX.north) continue;
      const ft = f.properties?.Facility_Type_Installation || '';
      const name = (f.properties?.Name_e || f.properties?.Label_e || f.properties?.name || f.properties?.NAME_ENG || f.properties?.NAME_FRA || 'Parks Canada Site').trim();

      if (isParksCanadaPlaceToSleep(ft)) {
        out.push({ lon, lat, name, provider: 'parks_canada', type: 'campsite', metadata: { requires_booking: true, camping_type: 'reservation' } });
      } else if (isParksCanadaDayUseWithPermit(ft, name)) {
        out.push({
          lon,
          lat,
          name,
          provider: 'parks_canada',
          type: 'day_use_pass',
          metadata: { requires_permit: true, requires_booking: true },
        });
      }
    }
    return out;
  } catch (e) {
    console.error('Parks Canada fetch failed:', e.message);
    return [];
  }
}

// Washington State Parks from ArcGIS
async function fetchWashingtonParks() {
  try {
    const geojson = await fetchJson(WA_PARKS_URL);
    const out = [];
    for (const f of geojson.features || []) {
      const geom = f.geometry;
      if (!geom || geom.type !== 'Point') continue;
      const [lon, lat] = geom.coordinates;
      const pt = toPoint(lon, lat);
      if (!pt) continue;
      const props = f.properties || {};
      const name = (props.NAME || props.PARK_NAME || props.SITE_NAME || 'Unknown').replace(/'/g, "''");
      out.push({
        name,
        provider: 'wa_state_parks',
        type: 'campsite',
        lon,
        lat,
        pt,
        capacity_total: null,
        booking_url: 'https://washington.goingtocamp.com',
        metadata: { requires_booking: true, camping_type: 'reservation' },
      });
    }
    return out;
  } catch (e) {
    console.error('WA Parks fetch failed:', e.message);
    return [];
  }
}

async function main() {
  console.log('-- Auto-generated import for BC & WA locations');
  console.log('-- Run in Supabase SQL Editor after adding wa_state_parks to provider CHECK');
  console.log('');
  console.log("-- Add provider if needed: ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_provider_check;");
  console.log("-- ALTER TABLE locations ADD CONSTRAINT locations_provider_check CHECK (provider IN ('bcparks','parks_canada','acc','ridb','rstbc','bcmc','voc','wa_state_parks','bc_coastal','spearhead_huts','cvhs','pwa','tetrahedron','sct','commercial','other'));");
  console.log('');

  const all = [];

  // BC: RSTBC rec sites (subset + polygons)
  const [bcRecSites, bcRecPolygons] = await Promise.all([fetchBCRecSites(), fetchBCRecPolygons()]);
  console.error(`BC Rec Sites: ${bcRecSites.length}, Rec Polygons: ${bcRecPolygons.length}`);
  all.push(...bcRecSites, ...bcRecPolygons);

  // BC Parks (provincial parks, ecological reserves, protected areas - Montague Harbour, Garibaldi, etc.)
  const bcParks = await fetchBCParksWFS();
  console.error(`BC Parks: ${bcParks.length}`);
  all.push(...bcParks);

  // BC Coastal campsites (legacy KML)
  const bcCoastal = await fetchBCCoastalKML();
  console.error(`BC Coastal campsites: ${bcCoastal.length}`);
  all.push(...bcCoastal);

  // Parks Canada (BC only)
  const pcBC = await fetchParksCanadaBC();
  console.error(`Parks Canada BC: ${pcBC.length}`);
  all.push(...pcBC);

  // RIDB (Washington federal)
  const ridb = await fetchRidbWashington();
  console.error(`RIDB WA: ${ridb.length} facilities`);
  all.push(...ridb);

  // WA State Parks
  const wa = await fetchWashingtonParks();
  console.error(`WA State Parks: ${wa.length} features`);
  all.push(...wa);

  // Dedupe by lon,lat only (same location = one entry). Do NOT dedupe by name - many rec sites share names.
  const coordSeen = new Set();
  const unique = all.filter((x) => {
    const lon = x.lon;
    const lat = x.lat;
    if (lon == null || lat == null) return true; // keep if missing coords (shouldn't happen)
    const key = `${Number(lon).toFixed(5)},${Number(lat).toFixed(5)}`;
    if (coordSeen.has(key)) return false;
    coordSeen.add(key);
    return true;
  });

  if (unique.length === 0) {
    console.log('-- No locations fetched. Check network and API keys.');
    return;
  }

  const rstbcUrl = 'https://www2.gov.bc.ca/gov/content/sports-culture/recreation/camping-hiking/sites-trails';
  const pcUrl = 'https://reservation.pc.gc.ca/';
  const bcUrl = 'https://camping.bcparks.ca/';

  console.log('INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata) VALUES');
  const rows = unique
    .map((l) => {
      const pt = l.pt || toPoint(l.lon, l.lat);
      if (!pt) return null;
      const bookingUrl =
        l.provider === 'rstbc' || l.provider === 'bc_coastal' ? rstbcUrl :
        l.provider === 'parks_canada' ? pcUrl :
        l.provider === 'bcparks' ? bcUrl : l.booking_url;
      const metaJson = l.metadata && Object.keys(l.metadata).length ? JSON.stringify(l.metadata) : '{}';
      const metaEscaped = metaJson.replace(/'/g, "''");
      return `  (${escapeSql(l.name)}, ${escapeSql(l.provider)}, ${pt}, ${escapeSql(l.type ?? 'campsite')}, ${l.capacity_total ?? 'NULL'}, ${bookingUrl ? escapeSql(bookingUrl) : 'NULL'}, '${metaEscaped}'::jsonb)`;
    })
    .filter(Boolean);
  console.log(rows.join(',\n'));
  console.log(';');
  console.log('');
  console.error(`Total: ${unique.length} locations`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
