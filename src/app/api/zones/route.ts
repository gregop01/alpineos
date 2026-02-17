/**
 * API route to fetch polygon boundaries for BC Parks and RSTBC.
 * Used by the map zones layer (light fills for park/rec site boundaries).
 * Filters: BC Parks excludes ecological reserves; RSTBC excludes trailheads/day-use.
 */

import { NextRequest, NextResponse } from 'next/server';

const BC_PARKS_WFS = 'https://openmaps.gov.bc.ca/geo/pub/WHSE_TANTALIS.TA_PARK_ECORES_PA_SVW/ows';
const BC_REC_POLYGONS_URL =
  'https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_forest_tenure/MapServer/5/query';
const PAGE_SIZE = 500;
const MAX_RECORDS = 1000;

function isRSTBCCampsite(name: string, numCampSites: number | null | undefined): boolean {
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
  if (numCampSites !== undefined && numCampSites !== null && numCampSites === 0) return false;
  return true;
}

async function fetchBCParksPolygons(): Promise<GeoJSON.Feature[]> {
  const features: GeoJSON.Feature[] = [];
  let startIndex = 0;

  while (true) {
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: 'pub:WHSE_TANTALIS.TA_PARK_ECORES_PA_SVW',
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
      count: String(PAGE_SIZE),
    });
    if (startIndex > 0) params.set('startIndex', String(startIndex));

    const res = await fetch(`${BC_PARKS_WFS}?${params}`);
    if (!res.ok) break;
    const data = (await res.json()) as GeoJSON.FeatureCollection;
    const batch = data.features ?? [];
    if (batch.length === 0) break;

    for (const f of batch) {
      if (f.geometry?.type !== 'Polygon' && f.geometry?.type !== 'MultiPolygon') continue;
      const name =
        (f.properties as Record<string, unknown>)?.PROTECTED_LANDS_NAME ||
        (f.properties as Record<string, unknown>)?.PARK_NAME ||
        'BC Park';
      const designation = ((f.properties as Record<string, unknown>)?.PROTECTED_LANDS_DESIGNATION || '').toString();
      const nameStr = String(name).toUpperCase();
      const isEcologicalReserve =
        designation.toLowerCase().includes('ecological reserve') || nameStr.includes('ECOLOGICAL RESERVE');
      if (isEcologicalReserve) continue;

      features.push({
        ...f,
        properties: { ...((f.properties as object) ?? {}), provider: 'bcparks' },
      });
    }
    if (batch.length < PAGE_SIZE) break;
    startIndex += PAGE_SIZE;
  }
  return features;
}

async function fetchRSTBCPolygons(): Promise<GeoJSON.Feature[]> {
  const features: GeoJSON.Feature[] = [];
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
    const res = await fetch(`${BC_REC_POLYGONS_URL}?${params}`);
    if (!res.ok) break;
    const data = (await res.json()) as GeoJSON.FeatureCollection;
    const batch = data.features ?? [];
    if (batch.length === 0) break;

    for (const f of batch) {
      if (f.geometry?.type !== 'Polygon' && f.geometry?.type !== 'MultiPolygon') continue;
      const name = (
        (f.properties as Record<string, unknown>)?.PROJECT_NAME ||
        (f.properties as Record<string, unknown>)?.REC_AREA_NAME ||
        (f.properties as Record<string, unknown>)?.SITE_LOCATION ||
        (f.properties as Record<string, unknown>)?.name ||
        'Rec Site'
      ).toString();
      const defined = (f.properties as Record<string, unknown>)?.DEFINED_CAMPSITES as number | null | undefined;
      if (!isRSTBCCampsite(name, defined)) continue;

      features.push({
        ...f,
        properties: { ...((f.properties as object) ?? {}), provider: 'rstbc' },
      });
    }
    if (batch.length < MAX_RECORDS) break;
    offset += batch.length;
  }
  return features;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providersParam = searchParams.get('providers') ?? 'bcparks,rstbc';
  const providers = new Set(providersParam.split(',').map((p) => p.trim()));

  const allFeatures: GeoJSON.Feature[] = [];

  if (providers.has('bcparks')) {
    try {
      const bcFeatures = await fetchBCParksPolygons();
      allFeatures.push(...bcFeatures);
    } catch (e) {
      console.error('BC Parks zones fetch failed:', e);
    }
  }

  if (providers.has('rstbc')) {
    try {
      const rstbcFeatures = await fetchRSTBCPolygons();
      allFeatures.push(...rstbcFeatures);
    } catch (e) {
      console.error('RSTBC zones fetch failed:', e);
    }
  }

  const geoJson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: allFeatures,
  };

  return NextResponse.json(geoJson, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
