'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

const BC_BBOX = { south: 48.5, west: -125, north: 54, east: -113 };

async function fetchOsmTrails(): Promise<GeoJSON.FeatureCollection | null> {
  const query = `
    [out:json][bbox:${BC_BBOX.south},${BC_BBOX.west},${BC_BBOX.north},${BC_BBOX.east}];
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
    const features: GeoJSON.Feature[] = (data.elements ?? [])
      .filter((el: { type: string }) => el.type === 'way')
      .map((way: { id: number; geometry: Array<{ lat: number; lon: number }> }) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: (way.geometry ?? []).map((p) => [p.lon, p.lat]),
        },
        properties: { id: way.id },
      }))
      .filter((f: GeoJSON.Feature) => f.geometry.type === 'LineString' && f.geometry.coordinates.length >= 2);
    return { type: 'FeatureCollection', features };
  } catch {
    return null;
  }
}

export function useMapbox(containerRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [-122.5, 51],
      zoom: 5,
      pitch: 45,
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
      });
      map.addLayer({
        id: 'osm-trails-line',
        type: 'line',
        source: 'osm-trails',
        paint: {
          'line-color': '#059669',
          'line-width': 2,
          'line-opacity': 0.7,
        },
      });

      setIsLoaded(true);

      fetchOsmTrails().then((geojson) => {
        if (!geojson || !map.getSource('osm-trails')) return;
        (map.getSource('osm-trails') as mapboxgl.GeoJSONSource).setData(geojson);
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setIsLoaded(false);
    };
  }, [containerRef]);

  return { mapRef, isLoaded };
}
