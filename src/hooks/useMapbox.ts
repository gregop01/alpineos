'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { toTitleCase } from '@/lib/format';

const BC_WA_BBOX = { south: 45.5, west: -125, north: 54, east: -113 };

// Approximate line length in km (WGS84, good enough for display)
function lineLengthKm(coords: [number, number][]): number {
  let km = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lon1, lat1] = coords[i - 1];
    const [lon2, lat2] = coords[i];
    const R = 6371; // Earth radius km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    km += R * c;
  }
  return Math.round(km * 10) / 10;
}

interface TrailFeature extends GeoJSON.Feature<GeoJSON.LineString> {
  properties: {
    id: number;
    name?: string;
    distance_km?: number;
  };
}

async function fetchOsmTrails(): Promise<GeoJSON.FeatureCollection | null> {
  const query = `
    [out:json][bbox:${BC_WA_BBOX.south},${BC_WA_BBOX.west},${BC_WA_BBOX.north},${BC_WA_BBOX.east}];
    (
      way["highway"="path"]["route"="hiking"];
      way["highway"="path"]["sac_scale"];
      way["highway"="cycleway"]["route"="hiking"];
    );
    out geom;
  `;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    });
    const data = await res.json();
    const features: TrailFeature[] = (data.elements ?? [])
      .filter((el: { type: string }) => el.type === 'way')
      .map((way: { id: number; tags?: Record<string, string>; geometry: Array<{ lat: number; lon: number }> }) => {
        const coords = (way.geometry ?? []).map((p) => [p.lon, p.lat] as [number, number]);
        const distanceKm = coords.length >= 2 ? lineLengthKm(coords) : 0;
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: coords,
          },
          properties: {
            id: way.id,
            name: way.tags?.name ?? `Trail #${way.id}`,
            distance_km: distanceKm,
          },
        };
      })
      .filter(
        (f: TrailFeature) => f.geometry.type === 'LineString' && f.geometry.coordinates.length >= 2
      );
    return { type: 'FeatureCollection', features };
  } catch {
    return null;
  }
}

export const MAP_STYLE_STREETS = 'mapbox://styles/mapbox/streets-v12';
export const MAP_STYLE_SATELLITE = 'mapbox://styles/mapbox/satellite-streets-v12';

export function useMapbox(containerRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const setMapStyleRef = useRef<(style: string) => void>(() => {});

  const setMapStyle = useCallback((style: string) => {
    setMapStyleRef.current?.(style);
  }, []);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      console.warn('Mapbox token missing; map will not load');
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-122.5, 51],
      zoom: 5,
      pitch: 0,
      projection: 'mercator',
    });

    map.on('style.load', () => {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.2 });

      map.addSource('osm-trails', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        promoteId: 'id',
      });
      map.addLayer({
        id: 'osm-trails-line',
        type: 'line',
        source: 'osm-trails',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#047857',
            '#059669',
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            4,
            2,
          ],
          'line-opacity': 0.85,
        },
      });

      setIsLoaded(true);

      fetchOsmTrails().then((geojson) => {
        if (!geojson || !map.getSource('osm-trails')) return;
        (map.getSource('osm-trails') as mapboxgl.GeoJSONSource).setData(geojson);
      });

      // Trail hover: highlight and show popup
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'map-popup',
      });
      popupRef.current = popup;

      let hoveredTrailId: number | string | null = null;

      const clearTrailHighlight = () => {
        if (hoveredTrailId != null) {
          try {
            map.removeFeatureState({ source: 'osm-trails', id: hoveredTrailId });
          } catch {
            // ignore if source/feature no longer exists
          }
          hoveredTrailId = null;
        }
      };

      map.on('mouseenter', 'osm-trails-line', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        clearTrailHighlight();
        const f = e.features?.[0];
        if (f?.id != null) {
          hoveredTrailId = f.id;
          map.setFeatureState({ source: 'osm-trails', id: f.id }, { hover: true });
        }
        const props = f?.properties as { name?: string; distance_km?: number } | undefined;
        const name = toTitleCase(props?.name ?? 'Trail');
        const dist = props?.distance_km != null ? `${props.distance_km} km` : '';
        const parts = [name, dist].filter(Boolean);
        const text = parts.join(' • ');
        popup.setLngLat(e.lngLat).setHTML(`<div class="map-popup-content">${text}</div>`).addTo(map);
      });

      map.on('mouseleave', 'osm-trails-line', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
        clearTrailHighlight();
      });
    });

    mapRef.current = map;

    // Mapbox doesn't auto-detect container resize (e.g. when Layers panel expands)
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    setMapStyleRef.current = (style: string) => {
      map.setStyle(style);
    };

    return () => {
      resizeObserver.disconnect();
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
      setIsLoaded(false);
    };
  }, [containerRef]);

  return { mapRef, isLoaded, setMapStyle };
}
