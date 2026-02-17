'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapbox, MAP_STYLE_STREETS, MAP_STYLE_SATELLITE } from '@/hooks/useMapbox';
import { getCampingBadgeInfo } from '@/lib/booking-utils';
import { LocationPins, type BookingFilter } from './LocationPins';
import { LocationZones } from './LocationZones';
import { MapLayerToggles } from './MapLayerToggles';
import type { LocationPin } from './LocationPins';
import { ChevronDown, ChevronUp, Map, Satellite } from 'lucide-react';

const DEFAULT_VISIBLE_PROVIDERS = new Set([
  'rstbc',
  'bcparks',
  'bc_coastal',
  'parks_canada',
  'acc',
  'wa_state_parks',
  'ridb',
  'bcmc',
  'voc',
  'spearhead_huts',
  'cvhs',
  'pwa',
  'tetrahedron',
  'sct',
  'commercial',
  'other',
]);

const DEFAULT_VISIBLE_BOOKING: Set<BookingFilter> = new Set(['bookable', 'walk_in']);

export interface MapLocation {
  id: string;
  name: string;
  lon: number;
  lat: number;
  type?: string;
  provider?: string;
  status?: LocationPin['status'];
  booking_url?: string | null;
  metadata?: Record<string, unknown>;
  capacity_total?: number | null;
  hasAvailability?: boolean;
}

interface MapContainerProps {
  locations: MapLocation[];
  onLocationClick: (locationId: string) => void;
  /** When set, fly the map to these coordinates */
  flyToCoords?: { lon: number; lat: number } | null;
  /** ID of the currently selected location – its pin will be highlighted */
  selectedLocationId?: string | null;
  /** Filter to only show locations with availability data */
  onlyWithAvailability?: boolean;
  onOnlyWithAvailabilityChange?: (checked: boolean) => void;
}

export function MapContainer({ locations, onLocationClick, flyToCoords, selectedLocationId, onlyWithAvailability, onOnlyWithAvailabilityChange }: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mapRef, isLoaded, setMapStyle } = useMapbox(containerRef);
  const [visibleProviders, setVisibleProviders] = useState<Set<string>>(DEFAULT_VISIBLE_PROVIDERS);
  const [isSatellite, setIsSatellite] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [visibleBookingTypes, setVisibleBookingTypes] =
    useState<Set<BookingFilter>>(DEFAULT_VISIBLE_BOOKING);

  useEffect(() => {
    if (!flyToCoords || !mapRef.current || !isLoaded) return;
    mapRef.current.flyTo({
      center: [flyToCoords.lon, flyToCoords.lat],
      zoom: 12,
      duration: 1200,
    });
  }, [flyToCoords, isLoaded, mapRef]);

  const pins: LocationPin[] = useMemo(() =>
    locations.map((loc) => {
      const badge = getCampingBadgeInfo({
        provider: loc.provider ?? 'other',
        booking_url: loc.booking_url,
        metadata: loc.metadata,
      });
      return {
        id: loc.id,
        name: loc.name,
        lon: loc.lon,
        lat: loc.lat,
        type: loc.type ?? 'campsite',
        provider: loc.provider ?? 'other',
        status: loc.status ?? 'unknown',
        needsBooking: badge.requiresBooking,
        campingType: badge.campingType,
        capacity_total: loc.capacity_total,
      };
    }),
    [locations]
  );

  const handlePinClick = useCallback(
    (id: string) => {
      onLocationClick(id);
    },
    [onLocationClick]
  );

  const [layersExpanded, setLayersExpanded] = useState(false);
  const handleLayerToggle = useCallback((provider: string, visible: boolean) => {
    setVisibleProviders((prev) => {
      const next = new Set(prev);
      if (visible) next.add(provider);
      else next.delete(provider);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback((visible: boolean) => {
    setVisibleProviders(
      visible ? new Set([...DEFAULT_VISIBLE_PROVIDERS]) : new Set()
    );
  }, []);

  const handleBookingToggle = useCallback((type: BookingFilter, visible: boolean) => {
    setVisibleBookingTypes((prev) => {
      const next = new Set(prev);
      if (visible) next.add(type);
      else next.delete(type);
      return next;
    });
  }, []);

  const handleMapStyleToggle = useCallback(() => {
    const next = !isSatellite;
    setIsSatellite(next);
    setMapStyle(next ? MAP_STYLE_SATELLITE : MAP_STYLE_STREETS);
  }, [isSatellite, setMapStyle]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {isLoaded && mapRef.current && (
        <>
          <LocationZones
            map={mapRef.current}
            visibleProviders={visibleProviders}
            showZones={showZones}
          />
          <LocationPins
            map={mapRef.current}
            locations={pins}
            visibleProviders={visibleProviders}
            visibleBookingTypes={visibleBookingTypes}
            onPinClick={handlePinClick}
            selectedLocationId={selectedLocationId}
          />
        </>
      )}
      <div className="absolute bottom-4 right-4 z-20 flex items-end gap-2">
        <button
          type="button"
          onClick={handleMapStyleToggle}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
            isSatellite
              ? 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700'
              : 'bg-white/95 backdrop-blur text-zinc-600 hover:text-zinc-900 border-zinc-200/50'
          }`}
          title={isSatellite ? 'Switch to map view' : 'Switch to satellite view'}
        >
          {isSatellite ? <Map size={14} /> : <Satellite size={14} />}
          {isSatellite ? 'Map' : 'Satellite'}
        </button>
        <div className="rounded-lg bg-white/95 backdrop-blur shadow-lg border border-zinc-200/50 overflow-hidden">
          <button
            type="button"
            onClick={() => setLayersExpanded((e) => !e)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 hover:text-zinc-900"
          >
            Layers
            {layersExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        {layersExpanded && (
          <div className="px-2.5 pb-2 pt-0 border-t border-zinc-200/50 space-y-2">
            <MapLayerToggles
              visibleProviders={visibleProviders}
              onToggle={handleLayerToggle}
              onToggleAll={handleToggleAll}
            />
            <div className="border-t border-zinc-200/50 pt-2">
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
                BC Parks & Rec Sites
              </p>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-600 hover:text-zinc-900">
                <input
                  type="checkbox"
                  checked={showZones}
                  onChange={(e) => setShowZones(e.target.checked)}
                  className="h-2.5 w-2.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Show zones (boundaries)</span>
              </label>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Light fills for park & rec site boundaries
              </p>
            </div>
            {onOnlyWithAvailabilityChange && (
              <div className="border-t border-zinc-200/50 pt-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-600 hover:text-zinc-900">
                  <input
                    type="checkbox"
                    checked={onlyWithAvailability ?? false}
                    onChange={(e) => onOnlyWithAvailabilityChange(e.target.checked)}
                    className="h-2.5 w-2.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Only with availability data</span>
                </label>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Show campsites that have been scraped
                </p>
              </div>
            )}
            <div className="border-t border-zinc-200/50 pt-2">
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
                Booking
              </p>
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-600 hover:text-zinc-900">
                  <input
                    type="checkbox"
                    checked={visibleBookingTypes.has('bookable')}
                    onChange={(e) => handleBookingToggle('bookable', e.target.checked)}
                    className="h-2.5 w-2.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0 bg-blue-400"
                    aria-hidden
                  />
                  Requires booking
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-600 hover:text-zinc-900">
                  <input
                    type="checkbox"
                    checked={visibleBookingTypes.has('walk_in')}
                    onChange={(e) => handleBookingToggle('walk_in', e.target.checked)}
                    className="h-2.5 w-2.5 rounded border-zinc-300 text-zinc-500 focus:ring-zinc-400"
                  />
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0 bg-zinc-400"
                    aria-hidden
                  />
                  FCFS
                </label>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
