'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MapContainer } from '@/components/map/MapContainer';
import { SidePanel } from '@/components/SidePanel';
import { supabase } from '@/lib/supabase';
import { getNextOpening } from '@/lib/booking-rules';
import type { MapLocation } from '@/components/map/MapContainer';
import type { SidePanelLocation } from '@/components/SidePanel';
import type { AvailabilityDay } from '@/components/SidePanel';
import { Radio } from 'lucide-react';

interface FullLocation {
  id: string;
  name: string;
  lon: number;
  lat: number;
  provider: string;
  type: string;
  capacity_total: number | null;
  booking_url: string | null;
}

export default function HomePage() {
  const [locations, setLocations] = useState<FullLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SidePanelLocation | null>(null);
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [bookingRules, setBookingRules] = useState<
    Map<string, { rolling_window_days: number | null; opening_time_pt: string | null; opening_time_mt: string | null; seasonal_launch_date: string | null; rules_metadata: Record<string, unknown> }>
  >(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [locRes, rulesRes] = await Promise.all([
        supabase.from('locations_with_coords').select('id, name, lon, lat, provider, type, capacity_total, booking_url'),
        supabase.from('booking_rules').select('provider, rolling_window_days, opening_time_pt, opening_time_mt, seasonal_launch_date, rules_metadata'),
      ]);

      if (locRes.data) {
        setLocations(
          locRes.data.map((l) => ({
            id: l.id,
            name: l.name,
            lon: l.lon,
            lat: l.lat,
            provider: l.provider,
            type: l.type,
            capacity_total: l.capacity_total,
            booking_url: l.booking_url,
          }))
        );
      }

      if (rulesRes.data) {
        setBookingRules(new Map(rulesRes.data.map((r) => [r.provider, r])));
      }

      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedLocation) {
      setAvailability([]);
      return;
    }

    async function loadAvailability() {
      const { data } = await supabase
        .from('availability')
        .select('date, status, spots_remaining')
        .eq('location_id', selectedLocation!.id)
        .gte('date', new Date().toISOString().slice(0, 10))
        .order('date');

      if (data && data.length > 0) {
        setAvailability(
          data.map((a) => ({
            date: a.date,
            status: a.status,
            spotsRemaining: a.spots_remaining ?? undefined,
          }))
        );
      } else {
        const today = new Date();
        const empty: AvailabilityDay[] = [];
        for (let i = 0; i < 90; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() + i);
          empty.push({
            date: d.toISOString().slice(0, 10),
            status: 'unknown',
          });
        }
        setAvailability(empty);
      }
    }

    loadAvailability();
  }, [selectedLocation?.id]);

  const handleLocationClick = useCallback((locationId: string) => {
    const loc = locations.find((l) => l.id === locationId);
    if (!loc) return;
    setSelectedLocation({
      id: loc.id,
      name: loc.name,
      provider: loc.provider,
      type: loc.type,
      capacity_total: loc.capacity_total,
      booking_url: loc.booking_url,
    });
  }, [locations]);

  const handleClosePanel = useCallback(() => setSelectedLocation(null), []);

  const getNextOpeningDays = useCallback(
    (locationId: string) => {
      const loc = locations.find((l) => l.id === locationId);
      if (!loc) return undefined;
      const rule = bookingRules.get(loc.provider);
      const next = getNextOpening(
        rule ? { ...rule, provider: loc.provider } : null
      );
      return next?.daysUntil;
    },
    [locations, bookingRules]
  );

  const mapLocations: MapLocation[] = locations.map((l) => ({
    id: l.id,
    name: l.name,
    lon: l.lon,
    lat: l.lat,
    status: 'unknown',
  }));

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
          <p className="text-zinc-500">Loading map…</p>
        </div>
      ) : (
        <>
          <MapContainer
            locations={mapLocations}
            onLocationClick={handleLocationClick}
          />

          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <Link
              href="/pulse"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur shadow text-sm font-medium text-zinc-900 dark:text-zinc-50 hover:bg-white dark:hover:bg-zinc-700"
            >
              <Radio size={16} />
              Booking Pulse
            </Link>
          </div>

          <SidePanel
            location={selectedLocation}
            availability={availability}
            onClose={handleClosePanel}
            getNextOpening={getNextOpeningDays}
          />
        </>
      )}
    </div>
  );
}
