'use client';

import { useEffect, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Map as MapboxMap } from 'mapbox-gl';
import { toTitleCase } from '@/lib/format';
import { getCampingBadgeLabel } from '@/lib/booking-utils';

import type { CampingType } from '@/lib/booking-utils';

export interface LocationPin {
  id: string;
  name: string;
  lon: number;
  lat: number;
  type: string;
  provider: string;
  status: 'available' | 'booked' | 'locked' | 'unknown' | 'opening_soon';
  /** When set, location requires booking/reservation */
  needsBooking?: boolean;
  /** Camping type for badge when not bookable (wilderness, FCFS, etc.) */
  campingType?: CampingType;
  /** Capacity for display (pads, people, or tents depending on type) */
  capacity_total?: number | null;
}

export const PIN_SIZE = 8;
const SELECTED_PIN_SIZE = 14;

export const PROVIDER_STYLES: Record<string, { color: string; label: string }> = {
  rstbc: { color: '#059669', label: 'Rec Sites (RSTBC)' },
  bcparks: { color: '#2563eb', label: 'BC Parks' },
  parks_canada: { color: '#dc2626', label: 'Parks Canada' },
  acc: { color: '#ea580c', label: 'ACC Huts' },
  bc_coastal: { color: '#0891b2', label: 'Coastal Campsites' },
  wa_state_parks: { color: '#7c3aed', label: 'WA State Parks' },
  ridb: { color: '#0d9488', label: 'Recreation.gov' },
  bcmc: { color: '#65a30d', label: 'BCMC' },
  voc: { color: '#ca8a04', label: 'VOC' },
  spearhead_huts: { color: '#9333ea', label: 'Spearhead Huts' },
  cvhs: { color: '#0ea5e9', label: 'Columbia Valley Huts' },
  pwa: { color: '#15803d', label: 'Pemberton Wildlife Assoc' },
  tetrahedron: { color: '#c2410c', label: 'Tetrahedron Cabins' },
  sct: { color: '#be185d', label: 'Sunshine Coast Trail' },
  commercial: { color: '#e11d48', label: 'Commercial' },
  other: { color: '#64748b', label: 'Other' },
};

/** Provider homepage URLs for link-only (non-bookable) locations */
export const PROVIDER_URLS: Record<string, string> = {
  rstbc: 'https://www2.gov.bc.ca/gov/content/sports-culture/recreation/camping-hiking/sites-trails',
  bcparks: 'https://bcparks.ca',
  bc_coastal: 'https://www2.gov.bc.ca/gov/content/sports-culture/recreation/camping-hiking/sites-trails',
  parks_canada: 'https://parks.canada.ca',
  wa_state_parks: 'https://parks.state.wa.us',
  ridb: 'https://recreation.gov',
  acc: 'https://alpineclubofcanada.ca',
  spearhead_huts: 'https://spearheadhuts.org',
  cvhs: 'https://cvhsinfo.org',
  pwa: 'https://pembertonwildlifeassociation.com',
  tetrahedron: 'https://www.tetoutdoor.ca',
  sct: 'https://sunshinecoasttrail.com',
};

const FALLBACK_COLOR = '#64748b';
const MAIN_PROVIDERS = new Set(Object.keys(PROVIDER_STYLES).filter((p) => p !== 'other'));

function getColorForProvider(provider: string): string {
  return PROVIDER_STYLES[provider]?.color ?? FALLBACK_COLOR;
}

function getLabelForProvider(provider: string): string {
  return PROVIDER_STYLES[provider]?.label ?? provider.replace(/_/g, ' ');
}

/** Returns capacity as numeric string for badge (e.g. "12") */
function formatCapacityBadge(capacity: number, type: string): string | null {
  if (type.toLowerCase() === 'day_use_pass') return null;
  return String(capacity);
}

export type BookingFilter = 'bookable' | 'walk_in';

/** GeoJSON expression for circle-color by provider (match expression) */
function makeProviderColorExpression(): unknown[] {
  const entries = Object.entries(PROVIDER_STYLES).flatMap(([key, { color }]) => [key, color]);
  return ['match', ['get', 'provider'], ...entries, FALLBACK_COLOR];
}

interface LocationPinsProps {
  map: MapboxMap | null;
  locations: LocationPin[];
  visibleProviders: Set<string>;
  visibleBookingTypes: Set<BookingFilter>;
  onPinClick: (locationId: string) => void;
  /** When set, this pin is rendered larger with a pulse ring */
  selectedLocationId?: string | null;
}

export function LocationPins({
  map,
  locations,
  visibleProviders,
  visibleBookingTypes,
  onPinClick,
  selectedLocationId,
}: LocationPinsProps) {
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const locsByIdRef = useRef<Map<string, LocationPin>>(new Map());

  const filteredLocations = useMemo(
    () =>
      locations.filter((loc) => {
        if (selectedLocationId != null && loc.id === selectedLocationId) return true;
        const providerMatch =
          visibleProviders.has(loc.provider) ||
          (visibleProviders.has('other') && !MAIN_PROVIDERS.has(loc.provider));
        if (!providerMatch) return false;
        const bookingMatch = loc.needsBooking
          ? visibleBookingTypes.has('bookable')
          : visibleBookingTypes.has('walk_in');
        return bookingMatch;
      }),
    [locations, visibleProviders, visibleBookingTypes, selectedLocationId]
  );

  const filteredKey = useMemo(
    () => `${filteredLocations.length}:${filteredLocations.map((l) => l.id).join(',')}`,
    [filteredLocations]
  );

  const geojson = useMemo(() => {
    const features: GeoJSON.Feature<GeoJSON.Point, Record<string, unknown>>[] = filteredLocations.map(
      (loc) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [loc.lon, loc.lat] },
        properties: {
          id: loc.id,
          name: loc.name,
          provider: loc.provider,
          type: loc.type,
          needsBooking: loc.needsBooking ?? false,
          campingType: loc.campingType ?? 'unknown',
          capacity_total: loc.capacity_total ?? null,
        },
      })
    );
    return { type: 'FeatureCollection' as const, features };
  }, [filteredLocations]);

  locsByIdRef.current = useMemo(() => {
    const m = new Map<string, LocationPin>();
    filteredLocations.forEach((l) => m.set(l.id, l));
    return m;
  }, [filteredLocations]);

  useEffect(() => {
    if (!map) return;

    popupRef.current?.remove();
    popupRef.current = null;

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'map-popup',
      offset: [0, -PIN_SIZE / 2 - 4],
    });
    popupRef.current = popup;

    const onMapClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['locations-pins-layer'] });
      const f = features[0];
      if (f?.properties?.id) onPinClick(String(f.properties.id));
    };
    const onMouseMove = (e: mapboxgl.MapMouseEvent) => {
      map.getCanvas().style.cursor = '';
      popup.remove();
      const features = map.queryRenderedFeatures(e.point, { layers: ['locations-pins-layer'] });
      const f = features[0];
      if (!f?.properties?.id) return;
      map.getCanvas().style.cursor = 'pointer';
      const loc = locsByIdRef.current.get(String(f.properties.id));
      if (!loc) return;
      const name = toTitleCase(loc.name);
      const sourceLabel = getLabelForProvider(loc.provider);
      const badgeLabel = loc.needsBooking
        ? 'Book'
        : getCampingBadgeLabel({ requiresBooking: false, campingType: loc.campingType ?? 'unknown' });
      const badgeClass = loc.needsBooking
        ? 'map-popup-booking--book'
        : loc.campingType === 'wilderness'
          ? 'map-popup-booking--wilderness'
          : 'map-popup-booking--walkin';
      const badgeTitle = loc.needsBooking
        ? 'Requires reservation'
        : loc.campingType === 'wilderness'
          ? 'Wilderness camping'
          : 'First-come first-served';
      const bookingBadge = `<span class="map-popup-booking ${badgeClass}" title="${escapeHtml(badgeTitle)}">${escapeHtml(badgeLabel)}</span>`;
      const capacityBadge =
        loc.capacity_total != null && loc.capacity_total > 0
          ? formatCapacityBadge(loc.capacity_total, loc.type)
          : null;
      const capacitySpan = capacityBadge
        ? `<span class="map-popup-capacity map-popup-capacity--badge">${escapeHtml(capacityBadge)}</span>`
        : '';
      const html = `<div class="map-popup-content map-popup-content--pin"><div class="map-popup-main"><strong>${escapeHtml(name)}</strong> <span style="margin-left:4px;font-size:10px;padding:1px 4px;border-radius:3px;background:rgba(0,0,0,0.08);color:rgb(82 82 91)">${escapeHtml(sourceLabel)}</span>${capacitySpan}</div>${bookingBadge}</div>`;
      popup.setLngLat([loc.lon, loc.lat]).setHTML(html).addTo(map);
    };
    const onMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    };

    const addPinsLayer = () => {
      if (!geojson.features.length) return;

      const existing = map.getSource('locations-pins');
      if (existing) {
        (existing as mapboxgl.GeoJSONSource).setData(geojson);
        return;
      }

      map.off('click', 'locations-pins-layer', onMapClick);
      map.off('mousemove', 'locations-pins-layer', onMouseMove);
      map.off('mouseleave', 'locations-pins-layer', onMouseLeave);

      map.addSource('locations-pins', {
        type: 'geojson',
        data: geojson,
        promoteId: 'id',
      });

      map.addLayer({
        id: 'locations-pins-layer',
        type: 'circle',
        source: 'locations-pins',
        paint: {
          'circle-radius': [
            'case',
            ['==', ['get', 'id'], selectedLocationId ?? ''],
            SELECTED_PIN_SIZE / 2,
            PIN_SIZE / 2,
          ],
          'circle-color': makeProviderColorExpression() as unknown as mapboxgl.ExpressionSpecification,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-pitch-alignment': 'viewport',
          'circle-pitch-scale': 'viewport',
        },
      });

      map.on('click', 'locations-pins-layer', onMapClick);
      map.on('mousemove', 'locations-pins-layer', onMouseMove);
      map.on('mouseleave', 'locations-pins-layer', onMouseLeave);
    };

    const ensureLayer = () => {
      if (!map.getSource('locations-pins')) {
        addPinsLayer();
      } else {
        (map.getSource('locations-pins') as mapboxgl.GeoJSONSource).setData(geojson);
      }
    };

    if (map.isStyleLoaded()) {
      ensureLayer();
    } else {
      map.once('style.load', ensureLayer);
    }
    map.on('style.load', ensureLayer);

    const rafId = requestAnimationFrame(() => map.resize());

    return () => {
      cancelAnimationFrame(rafId);
      map.off('style.load', ensureLayer);
      map.off('click', 'locations-pins-layer', onMapClick);
      map.off('mousemove', 'locations-pins-layer', onMouseMove);
      map.off('mouseleave', 'locations-pins-layer', onMouseLeave);
      if (map.getLayer('locations-pins-layer')) map.removeLayer('locations-pins-layer');
      if (map.getSource('locations-pins')) map.removeSource('locations-pins');
      popup.remove();
      popupRef.current = null;
    };
  }, [map, filteredKey, geojson, onPinClick, selectedLocationId]);

  return null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
