'use client';

import { useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapbox } from '@/hooks/useMapbox';
import { LocationPins } from './LocationPins';
import type { LocationPin } from './LocationPins';

export interface MapLocation {
  id: string;
  name: string;
  lon: number;
  lat: number;
  status?: LocationPin['status'];
}

interface MapContainerProps {
  locations: MapLocation[];
  onLocationClick: (locationId: string) => void;
}

export function MapContainer({ locations, onLocationClick }: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mapRef, isLoaded } = useMapbox(containerRef);

  const pins: LocationPin[] = locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    lon: loc.lon,
    lat: loc.lat,
    status: loc.status ?? 'unknown',
  }));

  const handlePinClick = useCallback(
    (id: string) => {
      onLocationClick(id);
    },
    [onLocationClick]
  );

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {isLoaded && mapRef.current && (
        <LocationPins
          map={mapRef.current}
          locations={pins}
          onPinClick={handlePinClick}
        />
      )}
    </div>
  );
}
