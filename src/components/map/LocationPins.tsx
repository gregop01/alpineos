'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Map } from 'mapbox-gl';

export interface LocationPin {
  id: string;
  name: string;
  lon: number;
  lat: number;
  status: 'available' | 'booked' | 'locked' | 'unknown' | 'opening_soon';
}

const PIN_COLORS: Record<LocationPin['status'], string> = {
  available: '#22c55e',
  booked: '#ef4444',
  locked: '#6b7280',
  unknown: '#9ca3af',
  opening_soon: '#3b82f6',
};

interface LocationPinsProps {
  map: Map | null;
  locations: LocationPin[];
  onPinClick: (locationId: string) => void;
}

export function LocationPins({ map, locations, onPinClick }: LocationPinsProps) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map || !locations.length) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    locations.forEach((loc) => {
      const el = document.createElement('div');
      el.className = 'location-pin';
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = PIN_COLORS[loc.status];
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.title = loc.name;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([loc.lon, loc.lat])
        .addTo(map);

      el.addEventListener('click', () => onPinClick(loc.id));
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, locations, onPinClick]);

  return null;
}
