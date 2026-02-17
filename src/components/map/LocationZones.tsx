'use client';

import { useEffect, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Map as MapboxMap } from 'mapbox-gl';
import { PROVIDER_STYLES } from './LocationPins';

const ZONE_PROVIDERS = new Set(['bcparks', 'rstbc']);
const FALLBACK_COLOR = 'rgba(100, 116, 139, 0.12)';

function getZoneFillColor(provider: string): string {
  const hex = PROVIDER_STYLES[provider]?.color ?? '#64748b';
  // Convert hex to rgba with ~12% opacity for light zone fill
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}

/** Build Mapbox match expression for fill-color by provider */
function makeZoneColorExpression(): unknown[] {
  const entries = [...ZONE_PROVIDERS].flatMap((provider) => [
    provider,
    getZoneFillColor(provider),
  ]);
  return ['match', ['get', 'provider'], ...entries, FALLBACK_COLOR];
}

interface LocationZonesProps {
  map: MapboxMap | null;
  visibleProviders: Set<string>;
  /** When true, show zone fills for bcparks/rstbc instead of pins */
  showZones: boolean;
}

export function LocationZones({
  map,
  visibleProviders,
  showZones,
}: LocationZonesProps) {
  const fetchAbortRef = useRef<AbortController | null>(null);

  const shouldFetch = showZones && [...ZONE_PROVIDERS].some((p) => visibleProviders.has(p));
  const providersToFetch = useMemo(() => {
    if (!shouldFetch) return '';
    return [...ZONE_PROVIDERS].filter((p) => visibleProviders.has(p)).join(',');
  }, [shouldFetch, visibleProviders]);

  useEffect(() => {
    if (!map || !shouldFetch || !providersToFetch) {
      if (map?.getLayer('locations-zones-fill')) map.removeLayer('locations-zones-fill');
      if (map?.getSource('locations-zones')) map.removeSource('locations-zones');
      return;
    }

    fetchAbortRef.current?.abort();
    fetchAbortRef.current = new AbortController();

    fetch(`/api/zones?providers=${encodeURIComponent(providersToFetch)}`, {
      signal: fetchAbortRef.current.signal,
    })
      .then((res) => res.json())
      .then((geoJson: GeoJSON.FeatureCollection) => {
        if (!map) return;

        const existing = map.getSource('locations-zones');
        if (existing) {
          (existing as mapboxgl.GeoJSONSource).setData(geoJson);
          return;
        }

        map.addSource('locations-zones', {
          type: 'geojson',
          data: geoJson,
        });

        const layerOptions = {
          id: 'locations-zones-fill',
          type: 'fill' as const,
          source: 'locations-zones',
          paint: {
            'fill-color': makeZoneColorExpression() as unknown as mapboxgl.ExpressionSpecification,
            'fill-outline-color': 'rgba(0,0,0,0.08)',
            'fill-opacity': 1,
          },
        };
        const beforeId = map.getLayer('locations-pins-layer') ? 'locations-pins-layer' : undefined;
        map.addLayer(layerOptions, beforeId);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error('Zones fetch failed:', err);
      });

    return () => {
      fetchAbortRef.current?.abort();
      if (map?.getLayer('locations-zones-fill')) map.removeLayer('locations-zones-fill');
      if (map?.getSource('locations-zones')) map.removeSource('locations-zones');
    };
  }, [map, shouldFetch, providersToFetch]);

  return null;
}
